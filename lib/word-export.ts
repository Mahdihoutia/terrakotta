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
  /**
   * Préambule narratif inséré entre le sommaire et la 1ʳᵉ section.
   * - `intro` : paragraphes d'ouverture (rôle du document, méthodologie…)
   * - `constats` : liste à puces — observations clés
   * - `leviers` : liste à puces — pistes / recommandations principales
   */
  lead?: {
    titre?: string;
    intro?: string[];
    constats?: string[];
    leviers?: string[];
  };
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
const DEFAULT_LOGO_URL = "/brand/logo-noir.png";

/**
 * Génère l'éclair bleu (icône Zap du dashboard) en PNG, sans dépendance asset :
 * carré arrondi bleu pâle + polygone blanc/bleu — identique au logo de la sidebar.
 */
function buildLightningIconPng(sizePx = 128): Uint8Array | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Fond carré arrondi très pâle (rgba(59,130,246,0.12))
  const radius = sizePx * 0.22;
  ctx.fillStyle = "rgba(59,130,246,0.12)";
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(sizePx - radius, 0);
  ctx.quadraticCurveTo(sizePx, 0, sizePx, radius);
  ctx.lineTo(sizePx, sizePx - radius);
  ctx.quadraticCurveTo(sizePx, sizePx, sizePx - radius, sizePx);
  ctx.lineTo(radius, sizePx);
  ctx.quadraticCurveTo(0, sizePx, 0, sizePx - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Lucide Zap polygon : 13,2 3,14 12,14 11,22 21,10 12,10 13,2 (viewBox 24×24)
  const scale = (sizePx * 0.6) / 24; // glyph occupe ~60% du carré
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const pts: [number, number][] = [
    [13, 2],
    [3, 14],
    [12, 14],
    [11, 22],
    [21, 10],
    [12, 10],
    [13, 2],
  ];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((12 * Math.PI) / 180); // rotate-12 comme dans le dashboard
  ctx.translate(-12 * scale, -12 * scale); // recentre depuis viewBox 24
  ctx.fillStyle = "#3B82F6";
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const px = x * scale;
    const py = y * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/png");
  return dataUrlToUint8Array(dataUrl);
}

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

  // ─── Couverture — Dossier technique BE ─────────────────────
  // Bandeau de marque (slim, ~18mm) : éclair bleu + KILOWATER + tagline tracked.
  const lightningBytes = buildLightningIconPng(128);
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [9600],
      borders: noBorders(BorderStyle),
      rows: [
        new TableRow({
          cantSplit: true,
          height: { value: 1100, rule: docx.HeightRule.ATLEAST },
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: BRAND_NAVY },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 200, bottom: 200, left: 360, right: 360 },
              children: [
                new Paragraph({
                  spacing: { before: 0, after: 0 },
                  children: [
                    ...(lightningBytes
                      ? [
                          new ImageRun({
                            data: lightningBytes,
                            transformation: { width: 28, height: 28 },
                            type: "png",
                          }),
                          new TextRun({ text: "    ", size: 24 }),
                        ]
                      : []),
                    new TextRun({
                      text: BRAND_NAME,
                      bold: true,
                      size: 22, // 11pt
                      color: "FFFFFF",
                      characterSpacing: 80,
                    }),
                    new TextRun({ text: "      ", size: 22 }),
                    new TextRun({
                      text: "BUREAU D'ÉTUDE · RÉNOVATION ÉNERGÉTIQUE",
                      size: 14, // 7pt
                      color: BRAND_LIGHT,
                      characterSpacing: 60,
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

  // Grande respiration sous le bandeau (~50mm)
  children.push(new Paragraph({ spacing: { before: 2800, after: 0 }, children: [] }));

  // Eyebrow tracked : type de document + référence
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: `${(input.eyebrow ?? "Dossier technique").toUpperCase()}   ·   ${(input.reference || "—").toUpperCase()}`,
          bold: true,
          size: 16, // 8pt
          color: ACCENT,
          characterSpacing: 100,
        }),
      ],
    }),
  );

  // Titre principal — typo grand format, navy
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 80 },
      children: [
        new TextRun({
          text: input.title,
          bold: true,
          size: 72, // 36pt
          color: BRAND_NAVY,
        }),
      ],
    }),
  );

  // Sous-titre — italique gris
  if (input.subtitle) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: input.subtitle,
            italics: true,
            size: 26, // 13pt
            color: "64748B",
          }),
        ],
      }),
    );
  } else {
    children.push(new Paragraph({ spacing: { after: 240 }, children: [] }));
  }

  // Filet accent court (~60mm) — barre de marque
  children.push(
    new Table({
      width: { size: 3400, type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      columnWidths: [3400],
      borders: noBorders(BorderStyle),
      rows: [
        new TableRow({
          cantSplit: true,
          height: { value: 60, rule: docx.HeightRule.EXACT },
          children: [
            new TableCell({
              width: { size: 3400, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: ACCENT },
              children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
            }),
          ],
        }),
      ],
    }),
  );
  children.push(new Paragraph({ spacing: { before: 0, after: 360 }, children: [] }));

  // Bloc méta — vraie présentation tableau : label col teintée + filets fins
  if (input.meta.length > 0) {
    const metaHairline = { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" };
    const metaBorder = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        columnWidths: [3200, 6400],
        borders: {
          top: metaBorder,
          bottom: metaBorder,
          left: metaBorder,
          right: metaBorder,
          insideHorizontal: metaHairline,
          insideVertical: metaHairline,
        },
        rows: input.meta.map(
          ({ label, value }) =>
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: "F8FAFC" },
                  margins: { top: 140, bottom: 140, left: 200, right: 160 },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({
                          text: label.toUpperCase(),
                          bold: true,
                          size: 14, // 7pt
                          color: "475569",
                          characterSpacing: 60,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 67, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 140, bottom: 140, left: 200, right: 200 },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({
                          text: value || "—",
                          size: 22, // 11pt
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

  // Mention de bas de couverture : indice + date d'édition tracked
  children.push(new Paragraph({ spacing: { before: 1600, after: 0 }, children: [] }));
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 0 },
      children: [
        new TextRun({
          text: `INDICE A   ·   ÉDITION ${new Date()
            .toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
            .toUpperCase()}`,
          size: 14, // 7pt
          color: "94A3B8",
          characterSpacing: 80,
        }),
      ],
    }),
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ─── Page 2 — Sommaire (index éditorial) ───────────────────
  // Tableau à filets fins : numéro accent | titre navy. Rendu identique
  // sur Word, Pages Mac et Google Docs (pas de champ TOC dynamique).
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: "SOMMAIRE",
          bold: true,
          size: 16, // 8pt
          color: ACCENT,
          characterSpacing: 120,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 360 },
      children: [
        new TextRun({
          text: "Table des matières",
          bold: true,
          size: 40, // 20pt
          color: BRAND_NAVY,
        }),
      ],
    }),
  );

  const tocHairline = { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" };
  const tocNoBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: [800, 8800],
      borders: {
        top: tocHairline,
        bottom: tocHairline,
        left: tocNoBorder,
        right: tocNoBorder,
        insideHorizontal: tocHairline,
        insideVertical: tocNoBorder,
      },
      rows: input.sections.map(
        (section, idx) =>
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 800, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 140, bottom: 140, left: 0, right: 200 },
                children: [
                  new Paragraph({
                    spacing: { before: 0, after: 0 },
                    children: [
                      new TextRun({
                        text: String(idx + 1).padStart(2, "0"),
                        bold: true,
                        size: 22, // 11pt
                        color: ACCENT,
                        characterSpacing: 40,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 8800, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 140, bottom: 140, left: 0, right: 0 },
                children: [
                  new Paragraph({
                    spacing: { before: 0, after: 0 },
                    children: [
                      new TextRun({
                        text: section.titre,
                        size: 22, // 11pt
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
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ─── Page 3 — Préambule narratif (intro, constats, leviers) ──
  if (input.lead) {
    const lead = input.lead;
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [
          new TextRun({
            text: "PRÉAMBULE",
            bold: true,
            size: 16,
            color: ACCENT,
            characterSpacing: 120,
          }),
        ],
      }),
    );
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 360 },
        children: [
          new TextRun({
            text: lead.titre ?? "Synthèse et orientations",
            bold: true,
            size: 40, // 20pt
            color: BRAND_NAVY,
          }),
        ],
      }),
    );

    // Paragraphes d'introduction (justifié, navy clair)
    if (lead.intro && lead.intro.length > 0) {
      for (const p of lead.intro) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 0, after: 200, line: 320 },
            children: [
              new TextRun({ text: p, size: 22, color: "1F2937" }),
            ],
          }),
        );
      }
    }

    // Constats — bloc encadré gauche par filet accent
    if (lead.constats && lead.constats.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 100 },
          children: [
            new TextRun({
              text: "CONSTATS",
              bold: true,
              size: 14,
              color: ACCENT,
              characterSpacing: 80,
            }),
          ],
        }),
      );
      for (const c of lead.constats) {
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 100, line: 280 },
            indent: { left: 200 },
            children: [
              new TextRun({ text: "·  ", bold: true, size: 22, color: ACCENT }),
              new TextRun({ text: c, size: 22, color: BRAND_NAVY }),
            ],
          }),
        );
      }
    }

    // Leviers / pistes
    if (lead.leviers && lead.leviers.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 100 },
          children: [
            new TextRun({
              text: "LEVIERS PRIORITAIRES",
              bold: true,
              size: 14,
              color: ACCENT,
              characterSpacing: 80,
            }),
          ],
        }),
      );
      for (const l of lead.leviers) {
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 100, line: 280 },
            indent: { left: 200 },
            children: [
              new TextRun({ text: "·  ", bold: true, size: 22, color: ACCENT }),
              new TextRun({ text: l, size: 22, color: BRAND_NAVY }),
            ],
          }),
        );
      }
    }

    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ─── Sections ───────────────────────────────────────────────
  for (let sIdx = 0; sIdx < input.sections.length; sIdx++) {
    const section = input.sections[sIdx];

    // Kicker tracked : "SECTION 01"
    children.push(
      new Paragraph({
        spacing: { before: 320, after: 80 },
        children: [
          new TextRun({
            text: `SECTION ${String(sIdx + 1).padStart(2, "0")}`,
            bold: true,
            size: 14,
            color: ACCENT,
            characterSpacing: 100,
          }),
        ],
      }),
    );

    // Titre navy + ancre HEADING_1 (sans styling lourd qui doublonnait)
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({ text: section.titre, bold: true, size: 32, color: BRAND_NAVY }),
        ],
      }),
    );

    // Filet accent fin sous le titre
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 200 },
        border: {
          bottom: { color: ACCENT, size: 6, style: BorderStyle.SINGLE, space: 1 },
        },
        children: [],
      }),
    );

    if (section.description) {
      // Justifié, italique, line height généreuse → lecture naturelle
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240, line: 320 },
          children: [
            new TextRun({ text: section.description, italics: true, size: 20, color: "475569" }),
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

    // Paragraphes (textarea ou prose) — justifié, leading 1.4 pour lecture naturelle
    if (section.paragraphs) {
      for (const p of section.paragraphs) {
        if (p.label) {
          children.push(
            new Paragraph({
              spacing: { before: 200, after: 80 },
              children: [
                new TextRun({
                  text: p.label.toUpperCase(),
                  bold: true,
                  size: 16,
                  color: BRAND_NAVY,
                  characterSpacing: 60,
                }),
              ],
            }),
          );
        }
        // Préserver les sauts de ligne ; sauter les lignes vides
        const lines = p.text.split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim()) {
            children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
            continue;
          }
          children.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 120, line: 320 },
              children: [new TextRun({ text: line, size: 22, color: "1F2937" })],
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
                                size: 12, // 6pt — discret
                                color: BRAND_NAVY,
                                characterSpacing: 40,
                              }),
                              new TextRun({
                                text: "  ·  ",
                                size: 14,
                                color: "CBD5E1",
                              }),
                              new TextRun({
                                text: BRAND_TAGLINE,
                                italics: true,
                                size: 14,
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
