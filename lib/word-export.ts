/**
 * Génération de documents Word (.docx) — lisible par Microsoft Word et Apple Pages.
 *
 * Volontairement plus simple que la sortie PDF : le .docx a vocation à être édité
 * (devis modifiable, rapport amendable). Les charts Recharts sont embarqués en PNG
 * via les helpers `lib/pdf-charts`.
 */

export interface WordKeyValue {
  label: string;
  value: string;
}

export interface WordPhoto {
  dataUrl: string;
  categorie?: string;
  legende?: string;
}

export interface WordChart {
  title?: string;
  dataUrl: string; // PNG data URL
}

export interface WordSectionInput {
  titre: string;
  description?: string;
  rows?: WordKeyValue[];
  paragraphs?: { label?: string; text: string }[];
  photos?: WordPhoto[];
  charts?: WordChart[];
  /** Tableau libre — première ligne = entêtes */
  tables?: { caption?: string; headers: string[]; rows: string[][] }[];
}

export interface WordExportInput {
  title: string;
  subtitle?: string;
  reference: string;
  /** Méta-données affichées sur la couverture (Bénéficiaire, Adresse, Date…) */
  meta: WordKeyValue[];
  sections: WordSectionInput[];
  /** Bloc de clôture optionnel */
  closing?: { titre: string; paragraphs: string[] };
  filename?: string;
  /** URL du logo à embarquer dans la bandeau de couverture (PNG blanc sur fond sombre). */
  logoUrl?: string;
  /** Surtitre optionnel — eyebrow au-dessus du titre principal. */
  eyebrow?: string;
}

// Branding Kilowater — aligné sur le site (var(--tk-primary) = #2563EB)
const ACCENT = "2563EB";        // blue-600 — primaire
const BRAND_NAVY = "0D1B35";    // navy — bandeau couverture / footer du site
const BRAND_LIGHT = "60A5FA";   // blue-400 — eyebrow / accent secondaire
const BRAND_NAME = "KILOWATER";
const BRAND_TAGLINE = "Rénover l'existant, construire l'avenir.";
const DEFAULT_LOGO_URL = "/brand/logo-blanc.png";

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function imageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 600, height: 400 });
    img.src = dataUrl;
  });
}

/** Récupère un fichier image (URL relative ou absolue) en bytes pour ImageRun. */
async function loadImageBytes(
  url: string,
): Promise<{ bytes: Uint8Array; dims: { width: number; height: number } } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const dims = await imageDimensions(url);
    return { bytes, dims };
  } catch {
    return null;
  }
}

/**
 * Calcule les dimensions cibles pour une image (limitée à `maxWidthPx` de large,
 * `maxHeightPx` de haut) en conservant le ratio.
 */
function fitImage(
  natural: { width: number; height: number },
  maxWidthPx: number,
  maxHeightPx: number,
): { width: number; height: number } {
  const ratio = natural.width / Math.max(natural.height, 1);
  let w = Math.min(maxWidthPx, natural.width);
  let h = w / ratio;
  if (h > maxHeightPx) {
    h = maxHeightPx;
    w = h * ratio;
  }
  return { width: Math.round(w), height: Math.round(h) };
}

export async function exportToWord(input: WordExportInput): Promise<void> {
  const docx = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    TextRun,
    Table,
    TableRow,
    TableCell,
    ImageRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    PageBreak,
    ShadingType,
    TableLayoutType,
    VerticalAlign,
    Header,
    Footer,
    PageNumber,
    TableOfContents,
    StyleLevel,
  } = docx;

  // Détection MIME image robuste (data:image/jpeg, jpg, png, gif, webp…)
  const detectImageType = (dataUrl: string): "jpg" | "png" | "gif" | "bmp" => {
    const m = /^data:image\/([a-z0-9+.-]+)/i.exec(dataUrl);
    const sub = (m?.[1] ?? "").toLowerCase();
    if (sub === "jpeg" || sub === "jpg") return "jpg";
    if (sub === "gif") return "gif";
    if (sub === "bmp") return "bmp";
    return "png";
  };

  // Bordures fines grises appliquées par défaut sur les tableaux de données
  const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "D6D3D1" };
  const dataTableBorders = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder,
    insideHorizontal: thinBorder,
    insideVertical: thinBorder,
  };

  const children: InstanceType<typeof Paragraph | typeof Table>[] = [];

  // ─── Couverture ─────────────────────────────────────────────
  // Bandeau navy plein-largeur : logo blanc à gauche, nom de marque à droite
  const logo = await loadImageBytes(input.logoUrl ?? DEFAULT_LOGO_URL);
  const logoFitted = logo ? fitImage(logo.dims, 160, 56) : null;

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [3000, 6600],
      borders: noBorders(BorderStyle),
      rows: [
        new TableRow({
          cantSplit: true,
          height: { value: 1400, rule: docx.HeightRule.ATLEAST },
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: BRAND_NAVY },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 280, bottom: 280, left: 360, right: 200 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 0, after: 0 },
                  children:
                    logo && logoFitted
                      ? [
                          new ImageRun({
                            data: logo.bytes,
                            transformation: logoFitted,
                            type: "png",
                          }),
                        ]
                      : [
                          new TextRun({
                            text: BRAND_NAME,
                            bold: true,
                            size: 28,
                            color: "FFFFFF",
                          }),
                        ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: BRAND_NAVY },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 280, bottom: 280, left: 200, right: 360 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 0, after: 60 },
                  children: [
                    new TextRun({
                      text: BRAND_NAME,
                      bold: true,
                      size: 22,
                      color: "FFFFFF",
                      characterSpacing: 60,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({
                      text: "Bureau d'étude · Rénovation énergétique",
                      italics: true,
                      size: 16,
                      color: "BFDBFE",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  );

  // Espace respiration sous bandeau
  children.push(new Paragraph({ spacing: { before: 800, after: 0 }, children: [] }));

  // Eyebrow tracked
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: (input.eyebrow ?? "Document de mission").toUpperCase(),
          bold: true,
          size: 16,
          color: BRAND_LIGHT,
          characterSpacing: 80,
        }),
      ],
    }),
  );

  // Titre principal — typo large, navy
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: input.title,
          bold: true,
          size: 64, // 32pt
          color: BRAND_NAVY,
        }),
      ],
    }),
  );

  if (input.subtitle) {
    children.push(
      new Paragraph({
        spacing: { after: 480 },
        children: [
          new TextRun({ text: input.subtitle, italics: true, size: 26, color: "525252" }),
        ],
      }),
    );
  } else {
    children.push(new Paragraph({ spacing: { after: 480 }, children: [] }));
  }

  // Filet horizontal accent (séparateur visuel)
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 280 },
      border: {
        bottom: { color: ACCENT, size: 12, style: BorderStyle.SINGLE, space: 1 },
      },
      children: [],
    }),
  );

  // Réf. badge
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 280 },
      children: [
        new TextRun({
          text: `RÉFÉRENCE  ·  ${input.reference || "—"}`,
          bold: true,
          size: 18,
          color: ACCENT,
          characterSpacing: 40,
        }),
      ],
    }),
  );

  // Méta couverture en tableau 2 colonnes — ligne accent à gauche pour effet card
  if (input.meta.length > 0) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [2880, 6720],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "E7E5E4" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "E7E5E4" },
          left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT },
          right: { style: BorderStyle.SINGLE, size: 4, color: "E7E5E4" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "F1F5F9" },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
        rows: input.meta.map(
          ({ label, value }) =>
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: "F8FAFC" },
                  margins: { top: 120, bottom: 120, left: 200, right: 120 },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({
                          text: label.toUpperCase(),
                          bold: true,
                          size: 16,
                          color: "64748B",
                          characterSpacing: 30,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 120, bottom: 120, left: 160, right: 200 },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({
                          text: value || "—",
                          size: 22,
                          color: BRAND_NAVY,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
    );
  }

  // Tagline en bas de couverture
  children.push(
    new Paragraph({
      spacing: { before: 800, after: 0 },
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: BRAND_TAGLINE,
          italics: true,
          size: 22,
          color: ACCENT,
        }),
      ],
    }),
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ─── Page 2 — Sommaire ─────────────────────────────────────
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: "SOMMAIRE",
          bold: true,
          size: 16,
          color: BRAND_LIGHT,
          characterSpacing: 80,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: "Table des matières",
          bold: true,
          size: 48,
          color: BRAND_NAVY,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 320 },
      border: {
        bottom: { color: ACCENT, size: 12, style: BorderStyle.SINGLE, space: 1 },
      },
      children: [],
    }),
  );
  // Le TOC est rempli automatiquement à l'ouverture du document (Word/Pages
  // demande à l'utilisateur de mettre à jour les champs ; sinon F9).
  children.push(
    new TableOfContents("Sommaire", {
      hyperlink: true,
      headingStyleRange: "1-2",
      stylesWithLevels: [new StyleLevel("Heading1", 1), new StyleLevel("Heading2", 2)],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 0 },
      children: [
        new TextRun({
          text: "Astuce : si la table des matières est vide, faites un clic-droit dessus puis « Mettre à jour les champs ».",
          italics: true,
          size: 16,
          color: "94A3B8",
        }),
      ],
    }),
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ─── Sections ───────────────────────────────────────────────
  for (const section of input.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 120 },
        children: [
          new TextRun({ text: section.titre, bold: true, size: 28, color: ACCENT }),
        ],
      }),
    );

    if (section.description) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: section.description, italics: true, size: 18, color: "737373" }),
          ],
        }),
      );
    }

    // Tableau clé/valeur
    if (section.rows && section.rows.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          borders: dataTableBorders,
          columnWidths: [3840, 5760],
          rows: section.rows.map(
            ({ label, value }) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, color: "auto", fill: "FAFAF9" },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        spacing: { before: 40, after: 40 },
                        children: [
                          new TextRun({ text: label, bold: true, size: 18, color: "404040" }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        spacing: { before: 40, after: 40 },
                        children: [new TextRun({ text: value || "—", size: 20 })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
      );
      children.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
    }

    // Tableaux libres
    if (section.tables) {
      for (const tbl of section.tables) {
        if (tbl.caption) {
          children.push(
            new Paragraph({
              spacing: { before: 160, after: 80 },
              children: [
                new TextRun({ text: tbl.caption, bold: true, size: 20, color: "404040" }),
              ],
            }),
          );
        }
        const colCount = Math.max(tbl.headers.length, 1);
        // Largeur utile (A4 - marges) ≈ 9000 twentieths ; on répartit également,
        // sauf si la 1re colonne est manifestement « libellé long » (≥ 3 colonnes).
        const totalWidth = 9600;
        const columnWidths: number[] =
          colCount >= 3
            ? [
                Math.round(totalWidth * 0.4),
                ...Array.from({ length: colCount - 1 }, () =>
                  Math.round((totalWidth * 0.6) / (colCount - 1)),
                ),
              ]
            : Array.from({ length: colCount }, () => Math.round(totalWidth / colCount));

        const headerRow = new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: tbl.headers.map(
            (h, idx) =>
              new TableCell({
                width: { size: columnWidths[idx], type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, color: "auto", fill: "E7E5E4" },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                    spacing: { before: 40, after: 40 },
                    children: [new TextRun({ text: h, bold: true, size: 18 })],
                  }),
                ],
              }),
          ),
        });
        const dataRows = tbl.rows.map(
          (r) =>
            new TableRow({
              cantSplit: true,
              children: Array.from({ length: colCount }, (_, idx) => {
                const cell = r[idx] ?? "";
                return new TableCell({
                  width: { size: columnWidths[idx], type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 60, bottom: 60, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                      spacing: { before: 20, after: 20 },
                      children: [new TextRun({ text: cell, size: 18 })],
                    }),
                  ],
                });
              }),
            }),
        );
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: dataTableBorders,
            columnWidths,
            rows: [headerRow, ...dataRows],
          }),
        );
        children.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
      }
    }

    // Paragraphes (textarea)
    if (section.paragraphs) {
      for (const p of section.paragraphs) {
        if (p.label) {
          children.push(
            new Paragraph({
              spacing: { before: 160, after: 60 },
              children: [
                new TextRun({ text: p.label, bold: true, size: 20, color: "404040" }),
              ],
            }),
          );
        }
        // Préserver les sauts de ligne
        const lines = p.text.split(/\r?\n/);
        for (const line of lines) {
          children.push(
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: line, size: 20 })],
            }),
          );
        }
      }
    }

    // Charts (PNG)
    if (section.charts && section.charts.length > 0) {
      for (const chart of section.charts) {
        if (chart.title) {
          children.push(
            new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({ text: chart.title, bold: true, size: 20, color: "404040" }),
              ],
            }),
          );
        }
        try {
          const dims = await imageDimensions(chart.dataUrl);
          const fitted = fitImage(dims, 560, 380);
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 160 },
              children: [
                new ImageRun({
                  data: dataUrlToUint8Array(chart.dataUrl),
                  transformation: fitted,
                  type: "png",
                }),
              ],
            }),
          );
        } catch {
          /* skip chart on error */
        }
      }
    }

    // Photos
    if (section.photos && section.photos.length > 0) {
      for (let i = 0; i < section.photos.length; i++) {
        const photo = section.photos[i];
        try {
          const dims = await imageDimensions(photo.dataUrl);
          const fitted = fitImage(dims, 420, 300);
          children.push(
            new Paragraph({
              spacing: { before: 200, after: 60 },
              children: [
                new TextRun({
                  text: `Photo ${i + 1}${photo.categorie ? ` — ${photo.categorie}` : ""}`,
                  bold: true,
                  size: 18,
                  color: "404040",
                }),
              ],
            }),
          );
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
              children: [
                new ImageRun({
                  data: dataUrlToUint8Array(photo.dataUrl),
                  transformation: fitted,
                  type: detectImageType(photo.dataUrl),
                }),
              ],
            }),
          );
          if (photo.legende) {
            children.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 160 },
                children: [
                  new TextRun({ text: photo.legende, italics: true, size: 16, color: "737373" }),
                ],
              }),
            );
          }
        } catch {
          /* skip photo on error */
        }
      }
    }
  }

  // ─── Clôture ────────────────────────────────────────────────
  if (input.closing) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 120 },
        children: [
          new TextRun({ text: input.closing.titre, bold: true, size: 28, color: ACCENT }),
        ],
      }),
    );
    for (const p of input.closing.paragraphs) {
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: p, size: 20 })],
        }),
      );
    }
  }

  const doc = new Document({
    creator: BRAND_NAME,
    title: input.title,
    description: input.subtitle ?? input.title,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
    features: {
      // Word affiche un prompt « Mettre à jour les champs » à l'ouverture si le TOC
      // n'a jamais été calculé. updateFields=true force le calcul automatique.
      updateFields: true,
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 0 },
                children: [
                  new TextRun({
                    text: `${input.title}${input.reference ? `  ·  ${input.reference}` : ""}`,
                    size: 16,
                    color: BRAND_NAVY,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              // Filet accent au-dessus du footer
              new Paragraph({
                spacing: { before: 0, after: 80 },
                border: {
                  bottom: { color: ACCENT, size: 6, style: BorderStyle.SINGLE, space: 1 },
                },
                children: [],
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                layout: TableLayoutType.FIXED,
                columnWidths: [6720, 2880],
                borders: noBorders(BorderStyle),
                rows: [
                  new TableRow({
                    cantSplit: true,
                    children: [
                      new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: [
                          new Paragraph({
                            spacing: { before: 0, after: 0 },
                            children: [
                              new TextRun({
                                text: BRAND_NAME,
                                bold: true,
                                size: 16,
                                color: BRAND_NAVY,
                                characterSpacing: 60,
                              }),
                              new TextRun({
                                text: "  ·  ",
                                size: 16,
                                color: "CBD5E1",
                              }),
                              new TextRun({
                                text: BRAND_TAGLINE,
                                italics: true,
                                size: 16,
                                color: "64748B",
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 0 },
                            children: [
                              new TextRun({ text: "Page ", size: 16, color: "94A3B8" }),
                              new TextRun({
                                children: [PageNumber.CURRENT],
                                size: 16,
                                bold: true,
                                color: ACCENT,
                              }),
                              new TextRun({ text: " / ", size: 16, color: "94A3B8" }),
                              new TextRun({
                                children: [PageNumber.TOTAL_PAGES],
                                size: 16,
                                color: "94A3B8",
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    input.filename ??
    `${input.title.replace(/\s+/g, "_")}_${input.reference || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ─── Helpers internes ──────────────────────────────────────── */

function noBorders(BorderStyle: typeof import("docx").BorderStyle) {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return {
    top: none,
    bottom: none,
    left: none,
    right: none,
    insideHorizontal: none,
    insideVertical: none,
  };
}
