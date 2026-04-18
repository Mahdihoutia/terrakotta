/**
 * Shared PDF styling utilities for KILOWATER document templates.
 * Design: dark navy cover page with grid, electric blue accents, cream content pages.
 */

import type jsPDF from "jspdf";

// ─── Color palette ──────────────────────────────────────────────

export const PDF_COLORS = {
  navy:        [13,  27,  53]  as [number, number, number],  // #0D1B35
  navyLight:   [20,  42,  80]  as [number, number, number],  // grid lines on cover
  navyMid:     [30,  60,  100] as [number, number, number],  // separators
  blue:        [59,  130, 246] as [number, number, number],  // #3B82F6
  blueDark:    [37,  99,  235] as [number, number, number],  // #2563EB
  blueLight:   [147, 197, 253] as [number, number, number],  // #93C5FD
  heading:     [13,  27,  53]  as [number, number, number],  // same as navy
  body:        [107, 91,  80]  as [number, number, number],  // #6B5B50
  bodyLight:   [150, 136, 126] as [number, number, number],
  background:  [250, 248, 245] as [number, number, number],  // #FAF8F5
  surface:     [245, 240, 232] as [number, number, number],
  border:      [232, 224, 212] as [number, number, number],  // #E8E0D4
  white:       [255, 255, 255] as [number, number, number],
  placeholder: [195, 185, 175] as [number, number, number],
  coverText:   [245, 250, 255] as [number, number, number],  // near-white on dark
  coverMuted:  [148, 163, 184] as [number, number, number],  // #94A3B8
} as const;

export const PDF_LAYOUT = {
  margin:        25,
  topMargin:     30,
  footerY:       282,
  headerHeight:  40,
  sectionGap:    14,
  lineHeight:    5,
} as const;

// ─── Company info ───────────────────────────────────────────────

export const COMPANY = {
  name:    "KILOWATER",
  tagline: "Bureau d'etude en renovation energetique",
  address: "115 Rue Saint-Dominique, 75007 Paris",
  email:   "contact@kilowater.fr",
  phone:   "01 XX XX XX XX",
} as const;

// ─── TOC entry ──────────────────────────────────────────────────

export interface TocEntry {
  title: string;
  page:  number;
}

// ─── Utility: format date FR ────────────────────────────────────

export function formatDateFrPdf(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Internal: lightning bolt (Lucide Zap shape) ────────────────

function drawZap(
  doc: jsPDF,
  cx: number, cy: number,
  w: number,  h: number,
  color: [number, number, number],
): void {
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;

  // Normalized points from Lucide Zap 24×24 viewBox, scaled to (w, h)
  const abs = [
    [0.500, 0.083],
    [0.292, 0.542],
    [0.458, 0.542],
    [0.375, 0.917],
    [0.708, 0.375],
    [0.542, 0.375],
    [0.667, 0.083],
  ].map(([nx, ny]) => [x0 + nx * w, y0 + ny * h]);

  const segs: number[][] = [];
  for (let i = 1; i < abs.length; i++) {
    segs.push([abs[i][0] - abs[i - 1][0], abs[i][1] - abs[i - 1][1]]);
  }

  doc.setFillColor(...color);
  doc.lines(segs, abs[0][0], abs[0][1], [1, 1], "F", true);
}

// ─── Cover page ─────────────────────────────────────────────────
// Full dark-navy page — does NOT return y; content pages start fresh.

export function drawCoverPage(
  doc: jsPDF,
  documentType: string,
  subtitle: string,
  infoRows: [string, string][],
  reference: string,
): void {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // ── Background ──────────────────────────────────────────────
  doc.setFillColor(...PDF_COLORS.navy);
  doc.rect(0, 0, pw, ph, "F");

  // ── Lightning bolt (large, centered upper area) ──────────────
  const bW = 24, bH = 39, bCx = pw / 2, bCy = 62;
  // soft glow: slightly larger bolt in mid-blue
  drawZap(doc, bCx, bCy, bW + 8, bH + 13, [25, 65, 140] as [number, number, number]);
  drawZap(doc, bCx, bCy, bW, bH, PDF_COLORS.blue);

  // ── KILOWATER wordmark ───────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.setTextColor(...PDF_COLORS.coverText);
  doc.text("KILOWATER", pw / 2, 91, { align: "center" });

  // ── Tagline ──────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.coverMuted);
  doc.text("Bureau d'etude en renovation energetique", pw / 2, 98, { align: "center" });

  // ── Horizontal rule ──────────────────────────────────────────
  doc.setDrawColor(...PDF_COLORS.navyMid);
  doc.setLineWidth(0.4);
  doc.line(35, 105, pw - 35, 105);

  // ── Document type ────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PDF_COLORS.blue);
  doc.text(documentType.toUpperCase(), pw / 2, 120, { align: "center" });

  // ── Subtitle ─────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.coverMuted);
  const subLines = doc.splitTextToSize(subtitle, pw - 60);
  doc.text(subLines, pw / 2, 130, { align: "center" });

  // ── Reference ────────────────────────────────────────────────
  const refY = 130 + subLines.length * 5 + 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.blueLight);
  doc.text(`Ref. ${reference}`, pw / 2, refY, { align: "center" });

  // ── Info card (white rounded rect) ──────────────────────────
  const filtered = infoRows.filter(([, v]) => v && v !== "—");
  const cardX  = 20;
  const cardY  = refY + 12;
  const cardW  = pw - 40;
  const cardH  = filtered.length * 9 + 16;

  doc.setFillColor(...PDF_COLORS.white);
  doc.roundedRect(cardX, cardY, cardW, cardH, 3, 3, "F");

  // Blue top strip on card
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(cardX, cardY, cardW, 2.5, "F");

  let iy = cardY + 12;
  for (const [label, value] of filtered) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(label, cardX + 8, iy);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(value, cardX + cardW / 2, iy);
    iy += 9;
  }

  // ── Bottom bar ───────────────────────────────────────────────
  const barY = ph - 18;
  doc.setDrawColor(...PDF_COLORS.navyMid);
  doc.setLineWidth(0.3);
  doc.line(20, barY, pw - 20, barY);

  drawZap(doc, 30, barY + 6, 4, 6.5, PDF_COLORS.blue);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.coverMuted);
  doc.text("KILOWATER", 34.5, barY + 7.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    pw - 20, barY + 7.5, { align: "right" },
  );
}

// ─── Sommaire (TOC) page ─────────────────────────────────────────

export function drawSommaire(
  doc: jsPDF,
  entries: TocEntry[],
  documentTitle: string,
  reference: string,
): void {
  const pw     = doc.internal.pageSize.getWidth();
  const ph     = doc.internal.pageSize.getHeight();
  const margin = PDF_LAYOUT.margin;
  let y = PDF_LAYOUT.topMargin;

  // Cream background
  doc.setFillColor(...PDF_COLORS.background);
  doc.rect(0, 0, pw, ph, "F");

  // Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("SOMMAIRE", margin, y);
  y += 5;

  // Blue accent bar
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(margin, y, 28, 1.5, "F");
  y += 9;

  // Sub-heading: doc title + ref
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.body);
  doc.text(`${documentTitle}  \u00b7  ${reference}`, margin, y);
  y += 11;

  // Horizontal rule
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 10;

  // Entries
  for (let i = 0; i < entries.length; i++) {
    const { title, page } = entries[i];
    const numStr  = `${i + 1}.`;
    const pageStr = `${page}`;

    // Index number in blue
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.blue);
    doc.text(numStr, margin, y);

    // Title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.heading);
    const titleX    = margin + 9;
    const titleMaxW = pw - margin * 2 - 9 - 14;
    const titleLine = doc.splitTextToSize(title, titleMaxW)[0];
    doc.text(titleLine, titleX, y);

    // Dot leader
    const endX    = titleX + doc.getTextWidth(titleLine);
    const rightX  = pw - margin;
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    let dotX = endX + 4;
    while (dotX + 3 < rightX - 10) {
      doc.text(".", dotX, y);
      dotX += 2.5;
    }

    // Page number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(pageStr, rightX, y, { align: "right" });

    y += 9;

    // Light row separator
    if (i < entries.length - 1) {
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setLineWidth(0.15);
      doc.line(margin + 9, y - 3, pw - margin, y - 3);
    }
  }
}

// ─── Section header ─────────────────────────────────────────────

export function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  description?: string,
): number {
  const margin  = PDF_LAYOUT.margin;
  const pw      = doc.internal.pageSize.getWidth();

  // Blue left accent bar
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(margin, y, 2, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(title, margin + 6, y + 6);
  y += 11;

  // Subtle underline
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 4;

  if (description) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(description, margin + 6, y + 2);
    y += 7;
  }

  return y;
}

// ─── autoTable default styles ───────────────────────────────────

export interface AutoTableConfig {
  startY: number;
  body: (string | number)[][];
  head?: (string | number)[][];
  margin: { left: number; right: number };
  styles: Record<string, unknown>;
  headStyles?: Record<string, unknown>;
  bodyStyles?: Record<string, unknown>;
  alternateRowStyles?: Record<string, unknown>;
  columnStyles?: Record<string, Record<string, unknown>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  didParseCell?: (data: any) => void;
}

export function getDataTableConfig(
  startY: number,
  body: string[][],
  contentWidth: number,
): AutoTableConfig {
  const margin = PDF_LAYOUT.margin;
  return {
    startY,
    body,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      overflow: "linebreak",
      textColor: PDF_COLORS.body,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 65, textColor: PDF_COLORS.heading },
      1: { cellWidth: contentWidth - 65 },
    },
    alternateRowStyles: { fillColor: PDF_COLORS.background },
    didParseCell: undefined,
  };
}

export function getInfoTableConfig(
  startY: number,
  head: string[][],
  body: string[][],
  contentWidth: number,
): AutoTableConfig {
  const margin = PDF_LAYOUT.margin;
  return {
    startY,
    head,
    body,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
      textColor: PDF_COLORS.body,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: PDF_COLORS.background },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, textColor: PDF_COLORS.heading },
    },
  };
}

export function getDevisTableConfig(
  startY: number,
  head: string[][],
  body: string[][],
): AutoTableConfig {
  const margin = PDF_LAYOUT.margin;
  return {
    startY,
    head,
    body,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: PDF_COLORS.body,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: PDF_COLORS.background },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 20, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  };
}

export function getTotalsTableConfig(
  startY: number,
  body: string[][],
  contentWidth: number,
  highlightLastRow: boolean = true,
): AutoTableConfig {
  const margin = PDF_LAYOUT.margin;
  return {
    startY,
    body,
    margin: { left: margin + contentWidth - 85, right: margin },
    styles: {
      fontSize: 10,
      cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
      textColor: PDF_COLORS.heading,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 42 },
      1: { halign: "right", cellWidth: 43 },
    },
    didParseCell: highlightLastRow
      ? (data) => {
          if (data.row.index === body.length - 1) {
            data.cell.styles.fillColor = PDF_COLORS.navy;
            data.cell.styles.textColor = PDF_COLORS.white;
            data.cell.styles.fontStyle = "bold";
          }
        }
      : undefined,
  };
}

// ─── Footer ─────────────────────────────────────────────────────
// Call on pages 2..N (skip page 1 = dark cover).
// pageNum / totalPages should be re-based (page 2 → 1, etc.) for clean numbering.

export function drawFooter(
  doc: jsPDF,
  documentLabel: string,
  reference: string,
  pageNum: number,
  totalPages: number,
): void {
  const pw      = doc.internal.pageSize.getWidth();
  const margin  = PDF_LAYOUT.margin;
  const footerY = PDF_LAYOUT.footerY;

  // Separator line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pw - margin, footerY - 5);

  // Left: mini bolt + KILOWATER
  drawZap(doc, margin + 2, footerY - 0.5, 3, 5, PDF_COLORS.blue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.blue);
  doc.text("KILOWATER", margin + 5.5, footerY);

  // Center: label · reference
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(`${documentLabel}  \u00b7  ${reference}`, pw / 2, footerY, { align: "center" });

  // Right: page X / Y
  doc.text(`${pageNum} / ${totalPages}`, pw - margin, footerY, { align: "right" });
}

// ─── Photo appendix ─────────────────────────────────────────────

export function drawPhotoAppendixHeader(doc: jsPDF): number {
  const pw     = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  let y = PDF_LAYOUT.topMargin;

  // Blue accent bar
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(margin, y, 2, 10, "F");
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("ANNEXE PHOTOGRAPHIQUE", margin + 6, y);
  y += 6;

  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);
  y += 10;

  return y;
}

/**
 * Mesure les dimensions naturelles d'une image (data URL ou URL).
 * Renvoie { w, h } en pixels natifs, ou null si la mesure échoue.
 */
export function measureImage(
  src: string,
): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    const img = new window.Image();
    img.onload = () =>
      resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Détecte le format (JPEG/PNG) d'une data URL.
 */
function detectImageFormat(src: string): "JPEG" | "PNG" {
  if (/^data:image\/png/i.test(src)) return "PNG";
  return "JPEG";
}

/**
 * Dessine une entrée photo dans le rapport.
 * Version async : respecte le ratio natif de l'image (pas de déformation),
 * centre horizontalement, et encadre d'un filet crème pour l'harmonie.
 *
 * Box maximale : contentWidth × maxH mm (par défaut 95 mm).
 */
export async function drawPhotoEntry(
  doc: jsPDF,
  index: number,
  preview: string,
  categorie: string,
  legende: string,
  y: number,
  opts: { maxH?: number } = {},
): Promise<number> {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const contentWidth = pw - margin * 2;
  const maxH         = opts.maxH ?? 95;

  // Mesure le ratio natif pour éviter toute déformation
  const dims = await measureImage(preview);
  let drawW = contentWidth;
  let drawH = maxH;
  if (dims && dims.w > 0 && dims.h > 0) {
    const ratio = dims.w / dims.h;
    // On privilégie la largeur puis on clampe la hauteur
    drawW = contentWidth;
    drawH = drawW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }
  }
  const drawX = margin + (contentWidth - drawW) / 2; // centrage horizontal

  // Fond crème (bande sur toute la largeur, donne un rythme visuel harmonieux)
  const frameH = (dims ? drawH : maxH) + 6;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(margin, y, contentWidth, frameH, 1.5, 1.5, "F");

  try {
    doc.addImage(
      preview,
      detectImageFormat(preview),
      drawX,
      y + 3,
      drawW,
      drawH,
      undefined,
      "MEDIUM",
    );
  } catch {
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.placeholder);
    doc.text(
      `[Photo ${index + 1} — impossible de charger]`,
      pw / 2,
      y + frameH / 2,
      { align: "center" },
    );
    doc.setTextColor(...PDF_COLORS.body);
  }

  y += frameH + 3;

  // Ligne de légende : "Photo N — catégorie"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.blue);
  const labelLeft = `Photo ${index + 1}`;
  doc.text(labelLeft, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(` — ${categorie}`, margin + doc.getTextWidth(labelLeft), y);
  y += 4;

  if (legende) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.body);
    const lines = doc.splitTextToSize(legende, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 3.8;
  }

  y += 8;
  return y;
}

// ─── Signature block ────────────────────────────────────────────

export function drawSignatureBlock(doc: jsPDF, y: number): number {
  const margin = PDF_LAYOUT.margin;
  const pw     = doc.internal.pageSize.getWidth();

  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("Bon pour accord", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.body);
  doc.text('Mention manuscrite : "Lu et approuve, bon pour accord"', margin, y);
  y += 18;

  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 65, y);
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text("Signature du client", margin, y + 4);

  doc.line(pw - margin - 65, y, pw - margin, y);
  doc.text("Date", pw - margin - 65, y + 4);

  y += 12;
  return y;
}

// ─── Prose / littérature ────────────────────────────────────────
// Dessine un paragraphe justifié avec la typographie du rapport.
// Usage : y = drawProse(doc, "Texte…", y, { italic?, size?, color? });

export function drawProse(
  doc: jsPDF,
  text: string,
  y: number,
  opts: {
    italic?: boolean;
    size?: number;
    color?: [number, number, number];
    spacingBefore?: number;
    spacingAfter?: number;
    align?: "left" | "justify";
  } = {},
): number {
  const margin       = PDF_LAYOUT.margin;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const size         = opts.size ?? 9;
  const color        = opts.color ?? PDF_COLORS.body;
  const lineH        = size * 0.52;

  y += opts.spacingBefore ?? 0;

  doc.setFont("helvetica", opts.italic ? "italic" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);

  const lines = doc.splitTextToSize(text, contentWidth) as string[];
  doc.text(lines, margin, y);
  y += lines.length * lineH;
  y += opts.spacingAfter ?? 0;
  return y;
}

// Encadré "pull quote" — bloc de littérature mis en valeur avec filet bleu
export function drawCallout(
  doc: jsPDF,
  text: string,
  y: number,
  opts: { title?: string } = {},
): number {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const contentWidth = pw - margin * 2;
  const padX = 8;
  const padY = 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(text, contentWidth - padX * 2 - 4) as string[];
  const titleH = opts.title ? 6 : 0;
  const boxH = padY * 2 + titleH + lines.length * 4.7;

  // Fond crème surface
  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(margin, y, contentWidth, boxH, 1.5, 1.5, "F");
  // Filet bleu gauche
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(margin, y, 1.5, boxH, "F");

  let ty = y + padY + 3;
  if (opts.title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.blue);
    doc.text(opts.title.toUpperCase(), margin + padX + 4, ty);
    ty += titleH;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(lines, margin + padX + 4, ty);

  return y + boxH + 6;
}

// ─── DPE / GES — Étiquettes énergétiques officielles ────────────
// Couleurs et seuils de la réglementation DPE 2021 (Arrêté 31 mars 2021).

export const DPE_COLORS: Record<string, [number, number, number]> = {
  A: [49, 152, 52],   // vert foncé
  B: [51, 164, 87],
  C: [121, 183, 46],
  D: [243, 217, 63],
  E: [238, 178, 57],
  F: [232, 116, 30],
  G: [215, 34, 31],   // rouge
};

export const GES_COLORS: Record<string, [number, number, number]> = {
  A: [246, 244, 250],
  B: [228, 219, 239],
  C: [200, 182, 222],
  D: [169, 138, 203],
  E: [135, 98, 182],
  F: [99, 63, 156],
  G: [64, 28, 131],
};

// Seuils kWhEP/m²/an
const DPE_RANGES: Array<[string, string]> = [
  ["A", "≤ 70"],
  ["B", "71 à 110"],
  ["C", "111 à 180"],
  ["D", "181 à 250"],
  ["E", "251 à 330"],
  ["F", "331 à 420"],
  ["G", "> 420"],
];

// Seuils kgCO₂/m²/an
const GES_RANGES: Array<[string, string]> = [
  ["A", "≤ 6"],
  ["B", "7 à 11"],
  ["C", "12 à 30"],
  ["D", "31 à 50"],
  ["E", "51 à 70"],
  ["F", "71 à 100"],
  ["G", "> 100"],
];

/**
 * Classe DPE à partir d'une valeur kWhEP/m²/an (arrêté 2021).
 */
export function computeDPEClass(kwhM2: number): string {
  if (kwhM2 <= 70) return "A";
  if (kwhM2 <= 110) return "B";
  if (kwhM2 <= 180) return "C";
  if (kwhM2 <= 250) return "D";
  if (kwhM2 <= 330) return "E";
  if (kwhM2 <= 420) return "F";
  return "G";
}

/**
 * Classe GES à partir d'une valeur kgCO₂/m²/an.
 */
export function computeGESClass(co2M2: number): string {
  if (co2M2 <= 6) return "A";
  if (co2M2 <= 11) return "B";
  if (co2M2 <= 30) return "C";
  if (co2M2 <= 50) return "D";
  if (co2M2 <= 70) return "E";
  if (co2M2 <= 100) return "F";
  return "G";
}

/**
 * Dessine une étiquette DPE officielle (7 classes A→G) avec pointeur sur la classe active.
 * Largeur ≈ 85 mm.
 */
export function drawEnergyLabel(
  doc: jsPDF,
  x: number,
  y: number,
  opts: {
    kind: "DPE" | "GES";
    activeLetter: string;
    value?: string;        // "185 kWhEP/m²/an"
    title?: string;
    width?: number;
  },
): number {
  const width  = opts.width ?? 85;
  const ranges = opts.kind === "DPE" ? DPE_RANGES : GES_RANGES;
  const colors = opts.kind === "DPE" ? DPE_COLORS : GES_COLORS;
  const rowH   = 7.2;
  const headerH = opts.title ? 10 : 0;
  const valueH  = opts.value ? 10 : 0;
  const barsH   = ranges.length * rowH;
  const totalH  = headerH + valueH + barsH + 3;

  // Titre
  if (opts.title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(opts.title, x, y + 5);
  }
  let cy = y + headerH;

  // Valeur numérique en grand
  if (opts.value) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...(colors[opts.activeLetter] ?? PDF_COLORS.heading));
    doc.text(opts.value, x, cy + 6);
    cy += valueH;
  }

  // Barres par classe ; chaque classe a une largeur croissante (staircase inversé)
  // pour rappeler l'échelle officielle.
  const minBar = width * 0.45;
  const step   = (width - minBar) / (ranges.length - 1);

  for (let i = 0; i < ranges.length; i++) {
    const [letter, range] = ranges[i];
    const color = colors[letter];
    const barW = minBar + i * step;
    const isActive = letter === opts.activeLetter;

    // Rect coloré
    doc.setFillColor(...color);
    doc.rect(x, cy, barW, rowH - 1, "F");

    // Lettre + tranche sur le rect
    const textColor = (opts.kind === "DPE" && (letter === "A" || letter === "B" || letter === "C"))
      ? PDF_COLORS.white
      : (opts.kind === "DPE" && letter === "G")
      ? PDF_COLORS.white
      : (opts.kind === "GES" && ["E", "F", "G"].includes(letter))
      ? PDF_COLORS.white
      : [33, 33, 33] as [number, number, number];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(letter, x + 3, cy + rowH / 2 + 0.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(range, x + 9, cy + rowH / 2 + 0.8);

    // Indicateur "vous êtes ici" pour la classe active
    if (isActive) {
      // Pointeur noir à droite de la barre
      const tipX = x + barW + 2;
      const tipY = cy + (rowH - 1) / 2;
      doc.setFillColor(...PDF_COLORS.heading);
      doc.triangle(tipX, tipY, tipX + 4, tipY - 2.5, tipX + 4, tipY + 2.5, "F");

      // Encadrement noir du rect actif
      doc.setDrawColor(...PDF_COLORS.heading);
      doc.setLineWidth(0.6);
      doc.rect(x - 0.4, cy - 0.4, barW + 0.8, rowH - 0.2, "S");
    }

    cy += rowH;
  }

  return y + totalH;
}

/**
 * Affiche côte à côte les deux étiquettes DPE + GES (layout officiel).
 */
export function drawDPEGESDual(
  doc: jsPDF,
  y: number,
  opts: {
    kwhValue: string;
    dpeLetter: string;
    co2Value: string;
    gesLetter: string;
  },
): number {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const contentWidth = pw - margin * 2;
  const labelW = Math.min(85, (contentWidth - 6) / 2);

  const yLeft = drawEnergyLabel(doc, margin, y, {
    kind: "DPE",
    activeLetter: opts.dpeLetter,
    value: opts.kwhValue,
    title: "Consommation énergétique (kWhEP/m²/an)",
    width: labelW,
  });
  const yRight = drawEnergyLabel(doc, margin + labelW + 6, y, {
    kind: "GES",
    activeLetter: opts.gesLetter,
    value: opts.co2Value,
    title: "Émissions GES (kgCO₂/m²/an)",
    width: labelW,
  });
  return Math.max(yLeft, yRight) + 4;
}

// ─── Diagramme de répartition des consommations par poste ───────
// Barre horizontale empilée + légende. Postes = { label, kwh, color }

export function drawConsoBreakdown(
  doc: jsPDF,
  y: number,
  postes: Array<{ label: string; kwh: number; color: [number, number, number] }>,
  opts: { title?: string } = {},
): number {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const contentWidth = pw - margin * 2;

  if (opts.title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(opts.title, margin, y + 4);
    y += 8;
  }

  const total = postes.reduce((s, p) => s + (isFinite(p.kwh) ? Math.max(0, p.kwh) : 0), 0);
  if (total <= 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text("Aucune donnée de consommation saisie.", margin, y + 4);
    return y + 8;
  }

  // Barre empilée
  const barH = 10;
  let bx = margin;
  for (const p of postes) {
    if (p.kwh <= 0) continue;
    const segW = (p.kwh / total) * contentWidth;
    doc.setFillColor(...p.color);
    doc.rect(bx, y, segW, barH, "F");
    const pct = (p.kwh / total) * 100;
    if (segW >= 14) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...PDF_COLORS.white);
      doc.text(`${pct.toFixed(0)}%`, bx + segW / 2, y + barH / 2 + 1, { align: "center" });
    }
    bx += segW;
  }
  // Bordure
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, barH, "S");
  y += barH + 6;

  // Légende en 2 colonnes
  const colW = contentWidth / 2;
  const rowSpacing = 5.5;
  const leftCount = Math.ceil(postes.length / 2);
  postes.forEach((p, i) => {
    const col = i < leftCount ? 0 : 1;
    const row = i < leftCount ? i : i - leftCount;
    const lx = margin + col * colW;
    const ly = y + row * rowSpacing + 3;
    doc.setFillColor(...p.color);
    doc.rect(lx, ly - 2.5, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.heading);
    const pct = total > 0 ? (Math.max(0, p.kwh) / total) * 100 : 0;
    doc.text(
      `${p.label}  ·  ${p.kwh.toFixed(0)} kWh/an  (${pct.toFixed(1)}%)`,
      lx + 5,
      ly,
    );
  });
  y += Math.max(leftCount, postes.length - leftCount) * rowSpacing + 3;

  return y;
}

// ─── Diagramme des déperditions par paroi ───────────────────────
// Barres horizontales avec pourcentages. Items = { label, pct }

export function drawDeperditionsChart(
  doc: jsPDF,
  y: number,
  items: Array<{ label: string; pct: number }>,
  opts: { title?: string } = {},
): number {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const contentWidth = pw - margin * 2;

  if (opts.title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(opts.title, margin, y + 4);
    y += 8;
  }

  const sanitized = items.filter((i) => isFinite(i.pct) && i.pct > 0);
  if (sanitized.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text("Aucune donnée de déperdition saisie.", margin, y + 4);
    return y + 8;
  }

  const labelW = 55;
  const barMaxW = contentWidth - labelW - 20;
  const rowH = 7;
  const max = Math.max(...sanitized.map((i) => i.pct));

  for (const item of sanitized) {
    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(item.label, margin, y + rowH / 2 + 1);

    // Fond de barre
    const bx = margin + labelW;
    doc.setFillColor(...PDF_COLORS.surface);
    doc.rect(bx, y + 1, barMaxW, rowH - 2, "F");

    // Barre active (gradient simulé via couleur unique)
    const w = (item.pct / max) * barMaxW;
    doc.setFillColor(...PDF_COLORS.blue);
    doc.rect(bx, y + 1, w, rowH - 2, "F");

    // Valeur %
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(`${item.pct.toFixed(1)} %`, bx + barMaxW + 3, y + rowH / 2 + 1);

    y += rowH + 1;
  }

  return y + 4;
}

// ─── Comparaison avant / après scénario (2 badges côte à côte) ──

export function drawBeforeAfterComparison(
  doc: jsPDF,
  y: number,
  before: { letter: string; value: string },
  after: { letter: string; value: string },
  opts: { title?: string; kind?: "DPE" | "GES" } = {},
): number {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const contentWidth = pw - margin * 2;
  const kind = opts.kind ?? "DPE";

  if (opts.title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(opts.title, margin, y + 4);
    y += 9;
  }

  const cardW = (contentWidth - 10) / 2;
  const cardH = 30;
  const palette = kind === "DPE" ? DPE_COLORS : GES_COLORS;

  function drawCard(cx: number, label: string, letter: string, value: string) {
    doc.setFillColor(...PDF_COLORS.surface);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, "F");

    // Puce colorée
    const chipW = 16;
    doc.setFillColor(...(palette[letter] ?? PDF_COLORS.bodyLight));
    doc.roundedRect(cx + 5, y + 5, chipW, cardH - 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(
      ...((kind === "DPE" && ["D", "E", "F"].includes(letter)) || (kind === "GES" && ["A", "B", "C"].includes(letter))
        ? [33, 33, 33] as [number, number, number]
        : PDF_COLORS.white),
    );
    doc.text(letter, cx + 5 + chipW / 2, y + cardH / 2 + 3, { align: "center" });

    // Texte
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(label.toUpperCase(), cx + 27, y + 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(value, cx + 27, y + 20);
  }

  drawCard(margin, "Avant travaux", before.letter, before.value);
  drawCard(margin + cardW + 10, "Après travaux", after.letter, after.value);

  // Flèche de progression au centre
  doc.setDrawColor(...PDF_COLORS.blue);
  doc.setLineWidth(0.6);
  const arrowY = y + cardH / 2;
  const arrowX0 = margin + cardW + 1;
  const arrowX1 = margin + cardW + 9;
  doc.line(arrowX0, arrowY, arrowX1 - 2, arrowY);
  doc.setFillColor(...PDF_COLORS.blue);
  doc.triangle(arrowX1, arrowY, arrowX1 - 2.5, arrowY - 1.8, arrowX1 - 2.5, arrowY + 1.8, "F");

  return y + cardH + 6;
}

// ─── Page break check ───────────────────────────────────────────

export function needsPageBreak(y: number, needed: number): boolean {
  return y + needed > PDF_LAYOUT.footerY - 15;
}
