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
}

const ACCENT = "0F766E"; // teal-700, neutre — adapté au branding sobre

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
  } = docx;

  const children: InstanceType<typeof Paragraph | typeof Table>[] = [];

  // ─── Couverture ─────────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 600, after: 200 },
      children: [
        new TextRun({
          text: input.title.toUpperCase(),
          bold: true,
          size: 44, // 22pt
          color: ACCENT,
        }),
      ],
    }),
  );

  if (input.subtitle) {
    children.push(
      new Paragraph({
        spacing: { after: 400 },
        children: [
          new TextRun({ text: input.subtitle, italics: true, size: 24, color: "525252" }),
        ],
      }),
    );
  }

  // Méta couverture en tableau 2 colonnes
  if (input.meta.length > 0) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders(BorderStyle),
        rows: input.meta.map(
          ({ label, value }) =>
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, color: "auto", fill: "F5F5F4" },
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 80 },
                      children: [
                        new TextRun({ text: label, bold: true, size: 18, color: "404040" }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 80 },
                      children: [new TextRun({ text: value || "—", size: 20 })],
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: `Référence : ${input.reference}`, size: 18, color: "737373" }),
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
          rows: section.rows.map(
            ({ label, value }) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, color: "auto", fill: "FAFAF9" },
                    children: [
                      new Paragraph({
                        spacing: { before: 60, after: 60 },
                        children: [
                          new TextRun({ text: label, bold: true, size: 18, color: "404040" }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        spacing: { before: 60, after: 60 },
                        children: [new TextRun({ text: value || "—", size: 20 })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
      );
      children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
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
        const headerRow = new TableRow({
          tableHeader: true,
          children: tbl.headers.map(
            (h) =>
              new TableCell({
                shading: { type: ShadingType.CLEAR, color: "auto", fill: "E7E5E4" },
                children: [
                  new Paragraph({
                    spacing: { before: 60, after: 60 },
                    children: [new TextRun({ text: h, bold: true, size: 18 })],
                  }),
                ],
              }),
          ),
        });
        const dataRows = tbl.rows.map(
          (r) =>
            new TableRow({
              children: r.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        spacing: { before: 40, after: 40 },
                        children: [new TextRun({ text: cell, size: 18 })],
                      }),
                    ],
                  }),
              ),
            }),
        );
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
        );
        children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
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
                  type: photo.dataUrl.startsWith("data:image/jpeg") ? "jpg" : "png",
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
    creator: "Terrakotta",
    title: input.title,
    description: input.subtitle ?? input.title,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
          },
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
