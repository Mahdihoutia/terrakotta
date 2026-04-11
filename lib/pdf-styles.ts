/**
 * Shared PDF styling utilities for Kilowater document templates.
 * Provides a consistent, premium look across all generated documents.
 *
 * Design tokens:
 * - Dark brown #2C1810 for headings
 * - Terracotta #8B4513 for accents
 * - Warm white #FAF8F5 for backgrounds
 * - Muted #6B5B50 for body text
 * - Border color #E8E0D4
 */

import type jsPDF from "jspdf";

// ─── Color palette ──────────────────────────────────────────────

export const PDF_COLORS = {
  heading: [44, 24, 16] as [number, number, number],       // #2C1810
  accent: [139, 69, 19] as [number, number, number],       // #8B4513
  accentLight: [176, 110, 60] as [number, number, number],  // lighter terracotta
  body: [107, 91, 80] as [number, number, number],          // #6B5B50
  bodyLight: [150, 136, 126] as [number, number, number],   // muted labels
  background: [250, 248, 245] as [number, number, number],  // #FAF8F5
  surface: [245, 240, 232] as [number, number, number],     // slightly darker for alt rows
  border: [232, 224, 212] as [number, number, number],      // #E8E0D4
  white: [255, 255, 255] as [number, number, number],
  placeholder: [195, 185, 175] as [number, number, number],
} as const;

export const PDF_LAYOUT = {
  margin: 25,
  topMargin: 30,
  footerY: 282,
  headerHeight: 40,
  sectionGap: 14,
  lineHeight: 5,
} as const;

// ─── Company info ───────────────────────────────────────────────

export const COMPANY = {
  name: "TERRAKOTTA",
  tagline: "Bureau d'etude en renovation energetique",
  address: "115 Rue Saint-Dominique, 75007 Paris",
  email: "contact@kilowater.fr",
  phone: "01 XX XX XX XX",
} as const;

// ─── Utility: format date FR ────────────────────────────────────

export function formatDateFrPdf(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Cover page ─────────────────────────────────────────────────

export function drawCoverPage(
  doc: jsPDF,
  documentType: string,
  subtitle: string,
  infoRows: [string, string][],
  reference: string,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const contentWidth = pageWidth - margin * 2;
  let y = PDF_LAYOUT.topMargin;

  // Top accent line
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(1.2);
  doc.line(margin, y, margin + 40, y);
  y += 12;

  // Company wordmark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("TERRAKOTTA", margin, y);
  y += 7;

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.body);
  doc.text("Bureau d'etude en renovation energetique", margin, y);
  y += 14;

  // Separator line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  // Document type
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(documentType.toUpperCase(), margin, y);
  y += 10;

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.body);
  const subtitleLines = doc.splitTextToSize(subtitle, contentWidth);
  doc.text(subtitleLines, margin, y);
  y += subtitleLines.length * 5 + 8;

  // Reference badge
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.accent);
  doc.text(`Ref. ${reference}`, margin, y);
  y += 16;

  // Accent line before info table
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + 30, y);
  y += 8;

  // Info table - clean, minimal style — skip empty values
  for (const [label, value] of infoRows) {
    if (!value || value === "—") continue;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(value, margin + 55, y);
    y += 6;
  }

  y += 10;
  return y;
}

// ─── Section header ─────────────────────────────────────────────

export function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  description?: string,
): number {
  const margin = PDF_LAYOUT.margin;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Section title with left accent
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(1.5);
  doc.line(margin, y, margin, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(title, margin + 5, y + 5);
  y += 10;

  // Subtle underline
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  if (description) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(description, margin + 5, y + 2);
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
      fillColor: PDF_COLORS.heading,
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
      fillColor: PDF_COLORS.heading,
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
            data.cell.styles.fillColor = PDF_COLORS.heading;
            data.cell.styles.textColor = PDF_COLORS.white;
            data.cell.styles.fontStyle = "bold";
          }
        }
      : undefined,
  };
}

// ─── Footer ─────────────────────────────────────────────────────

export function drawFooter(
  doc: jsPDF,
  documentLabel: string,
  reference: string,
  pageNum: number,
  totalPages: number,
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const footerY = PDF_LAYOUT.footerY;

  // Top line
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  // Left: doc label + reference
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(`${documentLabel}  |  ${reference}`, margin, footerY);

  // Center: company info
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(
    `${COMPANY.address}  |  ${COMPANY.email}  |  ${COMPANY.phone}`,
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  // Right: page number
  doc.text(`${pageNum} / ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
}

// ─── Photo appendix ─────────────────────────────────────────────

export function drawPhotoAppendixHeader(doc: jsPDF): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  let y = PDF_LAYOUT.topMargin;

  // Accent line
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(1.2);
  doc.line(margin, y, margin + 40, y);
  y += 10;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("ANNEXE PHOTOGRAPHIQUE", margin, y);
  y += 8;

  // Separator
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
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
  const margin = PDF_LAYOUT.margin;
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

  // Caption
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.accent);
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
  const pageWidth = doc.internal.pageSize.getWidth();

  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("Bon pour accord", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.body);
  doc.text("Mention manuscrite : \"Lu et approuve, bon pour accord\"", margin, y);
  y += 18;

  // Signature line left
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 65, y);
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text("Signature du client", margin, y + 4);

  // Date line right
  doc.line(pageWidth - margin - 65, y, pageWidth - margin, y);
  doc.text("Date", pageWidth - margin - 65, y + 4);

  y += 12;
  return y;
}

// ─── Page break check ───────────────────────────────────────────

export function needsPageBreak(y: number, needed: number): boolean {
  return y + needed > PDF_LAYOUT.footerY - 15;
}
