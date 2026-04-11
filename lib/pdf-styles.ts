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

  // ── Grid overlay ────────────────────────────────────────────
  doc.setDrawColor(...PDF_COLORS.navyLight);
  doc.setLineWidth(0.25);
  const G = 14;
  for (let gx = 0; gx <= pw; gx += G) doc.line(gx, 0, gx, ph);
  for (let gy = 0; gy <= ph; gy += G) doc.line(0, gy, pw, gy);

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

export function drawPhotoEntry(
  doc: jsPDF,
  index: number,
  preview: string,
  categorie: string,
  legende: string,
  y: number,
): number {
  const margin       = PDF_LAYOUT.margin;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;

  try {
    doc.addImage(preview, "JPEG", margin, y, contentWidth, 65, undefined, "MEDIUM");
    y += 68;
  } catch {
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.placeholder);
    doc.text(`[Photo ${index + 1} — impossible de charger]`, margin, y + 30);
    doc.setTextColor(...PDF_COLORS.body);
    y += 68;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.blue);
  doc.text(`Photo ${index + 1}`, margin, y);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(` — ${categorie}`, margin + doc.getTextWidth(`Photo ${index + 1}`), y);
  y += 4;

  if (legende) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.body);
    const lines = doc.splitTextToSize(legende, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 3.5;
  }

  y += 10;
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

// ─── Page break check ───────────────────────────────────────────

export function needsPageBreak(y: number, needed: number): boolean {
  return y + needed > PDF_LAYOUT.footerY - 15;
}
