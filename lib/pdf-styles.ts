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
  background:  [255, 255, 255] as [number, number, number],  // fond blanc pur
  surface:     [247, 248, 250] as [number, number, number],  // gris très clair (photos, callouts)
  border:      [224, 228, 234] as [number, number, number],  // filet gris clair
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

  // ── Background blanc ────────────────────────────────────────
  doc.setFillColor(...PDF_COLORS.white);
  doc.rect(0, 0, pw, ph, "F");

  // ── Bandeau haut bleu fin ───────────────────────────────────
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(0, 0, pw, 3, "F");

  // ── Lightning bolt + wordmark centrés ───────────────────────
  const bCx = pw / 2, bCy = 58;
  drawZap(doc, bCx, bCy, 22, 36, PDF_COLORS.blue);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("KILOWATER", pw / 2, 90, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text("Bureau d'etude en renovation energetique", pw / 2, 97, { align: "center" });

  // ── Filet horizontal ────────────────────────────────────────
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(40, 105, pw - 40, 105);

  // ── Type de document ────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PDF_COLORS.blue);
  doc.text(documentType.toUpperCase(), pw / 2, 122, { align: "center" });

  // ── Sous-titre ──────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.body);
  const subLines = doc.splitTextToSize(subtitle, pw - 60) as string[];
  doc.text(subLines, pw / 2, 132, { align: "center" });

  // ── Référence ───────────────────────────────────────────────
  const refY = 132 + subLines.length * 5 + 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(`Ref. ${reference}`, pw / 2, refY, { align: "center" });

  // ── Carte info (fond gris clair, filet bleu à gauche) ──────
  const filtered = infoRows.filter(([, v]) => v && v !== "—");
  const cardX  = 25;
  const cardY  = refY + 12;
  const cardW  = pw - 50;
  const cardH  = filtered.length * 9 + 14;

  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, "F");
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(cardX, cardY, 1.8, cardH, "F");

  let iy = cardY + 10;
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

  // ── Barre basse ─────────────────────────────────────────────
  const barY = ph - 18;
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(25, barY, pw - 25, barY);

  drawZap(doc, 30, barY + 6, 3.5, 5.5, PDF_COLORS.blue);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.blue);
  doc.text("KILOWATER", 34, barY + 7.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(
    new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    pw - 25, barY + 7.5, { align: "right" },
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
    alternateRowStyles: { fillColor: PDF_COLORS.surface },
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
    alternateRowStyles: { fillColor: PDF_COLORS.surface },
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
    alternateRowStyles: { fillColor: PDF_COLORS.surface },
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

  // Right: page X / Y (mesuré en premier pour éviter le chevauchement)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  const pageStr = `${pageNum} / ${totalPages}`;
  const pageW   = doc.getTextWidth(pageStr);
  doc.text(pageStr, pw - margin, footerY, { align: "right" });

  // Center: label · reference (tronqué si chevauchement)
  const leftEnd   = margin + 5.5 + doc.getTextWidth("KILOWATER") + 4; // marge sécurité
  const rightStart = pw - margin - pageW - 4;
  const maxCenterW = rightStart - leftEnd;
  let centerText = `${documentLabel}  \u00b7  ${reference}`;
  if (doc.getTextWidth(centerText) > maxCenterW) {
    // Ellipsise caractère par caractère jusqu'à passer
    while (centerText.length > 3 && doc.getTextWidth(centerText + "…") > maxCenterW) {
      centerText = centerText.slice(0, -1);
    }
    centerText = centerText.trimEnd() + "…";
  }
  doc.text(centerText, (leftEnd + rightStart) / 2, footerY, { align: "center" });
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

// ─── Sanitization pour Helvetica (WinAnsi) ─────────────────────
// Remplace les caractères hors WinAnsi par des équivalents ASCII
// afin d'éviter les substitutions ratées (largeur mal calculée,
// lignes débordant du contentWidth).

export function sanitizePdfText(input: string): string {
  return input
    .replace(/≈/g, "~")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/·/g, "\u00B7")  // middle dot OK en WinAnsi
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/…/g, "...")
    .replace(/“|”/g, '"')
    .replace(/‘|’/g, "'")
    .replace(/\u00A0/g, " ");  // NBSP → espace normale
}

// Réinitialise l'état texte (certains plugins comme autoTable laissent
// un charSpace non nul qui étire l'interlettrage des rendus suivants)
function resetTextState(doc: jsPDF): void {
  try {
    doc.setCharSpace?.(0);
  } catch {
    /* noop */
  }
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

  resetTextState(doc);
  doc.setFont("helvetica", opts.italic ? "italic" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);

  const clean = sanitizePdfText(text);
  const lines = doc.splitTextToSize(clean, contentWidth) as string[];
  // Pagination automatique ligne par ligne : évite le débordement sur le footer
  const limitY = PDF_LAYOUT.footerY - 12;
  for (const line of lines) {
    if (y + lineH > limitY) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
      resetTextState(doc);
      doc.setFont("helvetica", opts.italic ? "italic" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(...color);
    }
    doc.text(line, margin, y);
    y += lineH;
  }
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
  const limitY = PDF_LAYOUT.footerY - 12;

  resetTextState(doc);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const clean = sanitizePdfText(text);
  const lines = doc.splitTextToSize(clean, contentWidth - padX * 2 - 4) as string[];
  const titleH = opts.title ? 6 : 0;
  const boxH = padY * 2 + titleH + lines.length * 4.7;

  // Si la boîte ne tient pas, page-break avant
  if (y + boxH > limitY) {
    doc.addPage();
    y = PDF_LAYOUT.topMargin;
  }

  // Fond surface
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
    doc.text(sanitizePdfText(opts.title).toUpperCase(), margin + padX + 4, ty);
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

// ─── Classe financière (€/m²/an) — barème interne Kilowater ─────
// Indicatif, bureaux/tertiaire : reprend les paliers courants observés
// sur le marché (≤10 €/m²·an = très performant, > 110 = dégradé).

const FINANCIAL_RANGES: Array<[string, string]> = [
  ["A", "≤ 10"],
  ["B", "11 à 20"],
  ["C", "21 à 35"],
  ["D", "36 à 55"],
  ["E", "56 à 80"],
  ["F", "81 à 110"],
  ["G", "> 110"],
];

export function computeFinancialClass(euroM2: number): string {
  if (euroM2 <= 10) return "A";
  if (euroM2 <= 20) return "B";
  if (euroM2 <= 35) return "C";
  if (euroM2 <= 55) return "D";
  if (euroM2 <= 80) return "E";
  if (euroM2 <= 110) return "F";
  return "G";
}

// ─── Triple jauge A→G (Énergétique / Environnementale / Financière)
// Style Sinteo : 3 barres verticales côte à côte, lettre active surlignée
// et pointeur à droite. Réutilise DPE_COLORS pour l'ensemble (gradient
// vert→rouge commun, lisibilité maximale).

export function drawTripleGauge(
  doc: jsPDF,
  y: number,
  gauges: {
    energetique:      { letter: string; value: string };
    environnementale: { letter: string; value: string };
    financiere:       { letter: string; value: string };
  },
): number {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const contentWidth = pw - margin * 2;
  const gap          = 6;
  const gaugeW       = (contentWidth - 2 * gap) / 3;

  const panes: Array<{
    title:   string;
    unit:    string;
    data:    { letter: string; value: string };
    ranges:  Array<[string, string]>;
  }> = [
    { title: "PERFORMANCE ENERGETIQUE",      unit: "kWhEP/m2.an",   data: gauges.energetique,      ranges: [["A","<=70"],["B","71-110"],["C","111-180"],["D","181-250"],["E","251-330"],["F","331-420"],["G","> 420"]] },
    { title: "PERFORMANCE ENVIRONNEMENTALE", unit: "kgCO2/m2.an",   data: gauges.environnementale, ranges: [["A","<=6"],["B","7-11"],["C","12-30"],["D","31-50"],["E","51-70"],["F","71-100"],["G","> 100"]] },
    { title: "PERFORMANCE FINANCIERE",       unit: "EUR/m2.an",     data: gauges.financiere,       ranges: FINANCIAL_RANGES },
  ];

  let maxY = y;

  for (let i = 0; i < panes.length; i++) {
    const pane = panes[i];
    const gx   = margin + i * (gaugeW + gap);
    let   cy   = y;

    // Fond gris léger encadrant la jauge
    const headerH = 18;
    doc.setFillColor(...PDF_COLORS.surface);
    doc.roundedRect(gx, cy, gaugeW, headerH, 1.5, 1.5, "F");
    doc.setFillColor(...PDF_COLORS.blue);
    doc.rect(gx, cy, 1.5, headerH, "F");

    // Titre
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.blue);
    doc.text(pane.title, gx + 4, cy + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(pane.unit, gx + 4, cy + 9);

    // Valeur en grand
    const activeColor = DPE_COLORS[pane.data.letter] ?? PDF_COLORS.heading;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...activeColor);
    doc.text(sanitizePdfText(pane.data.value), gx + 4, cy + 16);

    cy += headerH + 3;

    // Staircase A→G
    const rowH    = 6.2;
    const minBar  = gaugeW * 0.45;
    const step    = (gaugeW * 0.95 - minBar) / 6;

    for (let k = 0; k < pane.ranges.length; k++) {
      const [letter, range] = pane.ranges[k];
      const isActive = letter === pane.data.letter;
      const barW     = minBar + k * step;
      const color    = DPE_COLORS[letter];

      doc.setFillColor(...color);
      doc.rect(gx, cy, barW, rowH - 0.8, "F");

      const darkBg = ["A", "B", "C", "G"].includes(letter);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...(darkBg ? PDF_COLORS.white : [33, 33, 33] as [number, number, number]));
      doc.text(letter, gx + 2.2, cy + (rowH - 0.8) / 2 + 1);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(range, gx + 7, cy + (rowH - 0.8) / 2 + 1);

      if (isActive) {
        const tipX = gx + barW + 1.3;
        const tipY = cy + (rowH - 0.8) / 2;
        doc.setFillColor(...PDF_COLORS.heading);
        doc.triangle(tipX, tipY, tipX + 3, tipY - 1.9, tipX + 3, tipY + 1.9, "F");
        doc.setDrawColor(...PDF_COLORS.heading);
        doc.setLineWidth(0.5);
        doc.rect(gx - 0.3, cy - 0.3, barW + 0.6, rowH - 0.2, "S");
      }
      cy += rowH;
    }
    maxY = Math.max(maxY, cy);
  }
  return maxY + 4;
}

// ─── Synthèse exécutive (1 page dédiée) ─────────────────────────
// Appelée après addPage() — dessine fond blanc + bandeau + carte info
// bâtiment + triple jauge + constats + leviers.

export function drawExecutiveSummary(
  doc: jsPDF,
  data: {
    beneficiaire:      string;
    adresse:           string;
    typeBatiment:      string;
    anneeConstruction: string;
    surface:           string;
    energetique:       { letter: string; value: string };
    environnementale:  { letter: string; value: string };
    financiere:        { letter: string; value: string };
    constats:          string[];
    leviers:           string[];
  },
): void {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const ph           = doc.internal.pageSize.getHeight();
  const contentWidth = pw - margin * 2;
  let y: number = PDF_LAYOUT.topMargin;

  // Fond blanc
  doc.setFillColor(...PDF_COLORS.background);
  doc.rect(0, 0, pw, ph, "F");

  // Titre
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(margin, y, 2, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("SYNTHESE EXECUTIVE", margin + 6, y + 7);
  y += 11;
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pw - margin, y);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(
    "Vue d'ensemble en une page : etat initial, performance globale et leviers prioritaires.",
    margin, y + 5,
  );
  y += 11;

  // Carte info bâtiment
  const rows: Array<[string, string]> = [
    ["Beneficiaire",          data.beneficiaire],
    ["Adresse",               data.adresse],
    ["Type de batiment",      data.typeBatiment],
    ["Annee de construction", data.anneeConstruction],
    ["Surface",               data.surface],
  ].filter(([, v]) => v && v.trim() && v !== "—") as Array<[string, string]>;

  const cardH = rows.length * 6 + 8;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(margin, y, contentWidth, cardH, 2, 2, "F");
  doc.setFillColor(...PDF_COLORS.blue);
  doc.rect(margin, y, 1.5, cardH, "F");
  let iy = y + 6;
  for (const [label, val] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(label, margin + 6, iy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(sanitizePdfText(val), margin + 58, iy);
    iy += 6;
  }
  y += cardH + 8;

  // Triple jauge
  y = drawTripleGauge(doc, y, {
    energetique:      data.energetique,
    environnementale: data.environnementale,
    financiere:       data.financiere,
  });
  y += 4;

  // Constats clés + leviers en 2 colonnes
  const colW = (contentWidth - 8) / 2;
  const colGap = 8;
  const limitY = PDF_LAYOUT.footerY - 14;

  function drawColumn(x: number, title: string, items: string[]): void {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.blue);
    doc.text(title, x, y + 4);
    doc.setDrawColor(...PDF_COLORS.blue);
    doc.setLineWidth(0.6);
    doc.line(x, y + 6, x + 18, y + 6);

    let ly = y + 11;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.body);
    for (const it of items) {
      if (!it || !it.trim()) continue;
      const lines = doc.splitTextToSize(sanitizePdfText(`• ${it.trim()}`), colW) as string[];
      for (const line of lines) {
        if (ly > limitY) return;
        doc.text(line, x, ly);
        ly += 4.3;
      }
      ly += 1.5;
    }
  }

  drawColumn(margin,                       "CONSTATS CLES",       data.constats);
  drawColumn(margin + colW + colGap,       "LEVIERS PRIORITAIRES", data.leviers);
}

// ─── Préconisations structurées — catalogue d'actions ───────────

export interface PreconisationAction {
  code:         string;              // Ex: "CHA-01"
  famille:      string;              // Ex: "Chauffage"
  titre:        string;
  opportunite:  number;              // 1-5
  horizon:      string;              // "Court terme" | "Moyen terme" | "Long terme"
  faisabilite?: string;              // "Facile" | "Moyenne" | "Difficile"
  brief?:       string;
  economiesKwh?:   number;           // kWh/an
  economiesEuro?:  number;           // €/an
  co2Evite?:       number;           // kgCO2/an
  coutTravaux?:    number;           // € TTC
  aides?:          number;           // €
  tri?:            number;           // années
}

export const FAMILLE_COLORS: Record<string, [number, number, number]> = {
  "Enveloppe":         [59, 130, 246],
  "Chauffage":         [220, 38, 38],
  "Climatisation":     [14, 165, 233],
  "Ventilation":       [139, 92, 246],
  "Eclairage":         [245, 158, 11],
  "ECS":               [249, 115, 22],
  "Regulation / GTB":  [107, 91, 80],
  "ENR":               [34, 197, 94],
  "Comportemental":    [100, 116, 139],
  "Autre":             [100, 116, 139],
};

function drawStars(
  doc: jsPDF,
  x: number, y: number,
  count: number,
  max: number = 5,
  size: number = 3,
): void {
  const gap = 0.8;
  for (let i = 0; i < max; i++) {
    const cx = x + i * (size * 2 + gap) + size;
    const filled = i < count;
    doc.setFillColor(...(filled ? PDF_COLORS.blue : PDF_COLORS.border));
    // Étoile 5 branches approchée par pentagone étoilé (triangles)
    const outer = size;
    const inner = size * 0.45;
    const pts: [number, number][] = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      pts.push([cx + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    const segs: number[][] = [];
    for (let k = 1; k < pts.length; k++) {
      segs.push([pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]]);
    }
    doc.lines(segs, pts[0][0], pts[0][1], [1, 1], "F", true);
  }
}

function formatEuro(n: number | undefined): string {
  if (n === undefined || n === null || !isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} EUR`;
}
function formatKwh(n: number | undefined): string {
  if (n === undefined || n === null || !isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} kWh/an`;
}
function formatCo2(n: number | undefined): string {
  if (n === undefined || n === null || !isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("fr-FR")} kgCO2/an`;
}

/**
 * Dessine une fiche action complète pour une préconisation.
 * Structure : bandeau couleur famille (code + titre) · méta (horizon, faisabilité, étoiles) ·
 * brief · grille 4 KPI · ligne coûts/aides/reste à charge.
 */
export function drawActionSheet(
  doc: jsPDF,
  y: number,
  action: PreconisationAction,
): number {
  const margin       = PDF_LAYOUT.margin;
  const pw           = doc.internal.pageSize.getWidth();
  const contentWidth = pw - margin * 2;
  const limitY       = PDF_LAYOUT.footerY - 14;

  // Hauteur estimée — si ça ne tient pas, saute de page
  const briefLines = action.brief
    ? (doc.splitTextToSize(sanitizePdfText(action.brief), contentWidth - 10) as string[]).length
    : 0;
  const estH = 14 + 10 + (briefLines * 4 + 4) + 22 + 10;
  if (y + estH > limitY) {
    doc.addPage();
    y = PDF_LAYOUT.topMargin;
  }

  const familleColor = FAMILLE_COLORS[action.famille] ?? FAMILLE_COLORS["Autre"];

  // ── Bandeau ──────────────────────────────────────────────
  const bandH = 10;
  doc.setFillColor(...familleColor);
  doc.roundedRect(margin, y, contentWidth, bandH, 1.5, 1.5, "F");
  // Rectangle gris du dessous pour éviter coins arrondis en bas du bandeau
  doc.setFillColor(...familleColor);
  doc.rect(margin, y + bandH - 2, contentWidth, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(action.code, margin + 4, y + 6.5);
  doc.setFontSize(9.5);
  doc.text(
    sanitizePdfText(action.titre),
    margin + 4 + doc.getTextWidth(action.code) + 5, y + 6.5,
  );

  // Famille à droite
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(
    sanitizePdfText(action.famille.toUpperCase()),
    pw - margin - 4, y + 6.5, { align: "right" },
  );
  y += bandH;

  // ── Bandeau méta (horizon, faisabilité, étoiles) ────────
  const metaH = 8;
  doc.setFillColor(...PDF_COLORS.surface);
  doc.rect(margin, y, contentWidth, metaH, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text("HORIZON", margin + 3, y + 3.4);
  doc.text("FAISABILITE", margin + 55, y + 3.4);
  doc.text("OPPORTUNITE", pw - margin - 55, y + 3.4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(sanitizePdfText(action.horizon || "—"),                margin + 3,  y + 7);
  doc.text(sanitizePdfText(action.faisabilite || "—"),            margin + 55, y + 7);

  // Étoiles
  drawStars(doc, pw - margin - 30, y + 4.5, Math.max(0, Math.min(5, action.opportunite || 0)));
  y += metaH + 4;

  // ── Brief ────────────────────────────────────────────────
  if (action.brief && action.brief.trim()) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.body);
    const lines = doc.splitTextToSize(sanitizePdfText(action.brief), contentWidth) as string[];
    for (const line of lines) {
      doc.text(line, margin, y);
      y += 4;
    }
    y += 2;
  }

  // ── KPI grid (4 cases) ──────────────────────────────────
  const tileW = (contentWidth - 3 * 3) / 4;
  const tileH = 16;
  const tiles: Array<{ label: string; value: string; accent: [number, number, number] }> = [
    { label: "Economies",     value: formatEuro(action.economiesEuro), accent: [34, 197, 94] },
    { label: "Gain energie",  value: formatKwh(action.economiesKwh),   accent: [59, 130, 246] },
    { label: "CO2 evite",     value: formatCo2(action.co2Evite),       accent: [14, 165, 233] },
    { label: "Retour invest.", value: action.tri ? `${action.tri.toFixed(1)} ans` : "—", accent: [245, 158, 11] },
  ];
  for (let i = 0; i < tiles.length; i++) {
    const tx = margin + i * (tileW + 3);
    doc.setFillColor(...PDF_COLORS.surface);
    doc.roundedRect(tx, y, tileW, tileH, 1.2, 1.2, "F");
    doc.setFillColor(...tiles[i].accent);
    doc.rect(tx, y, 1.2, tileH, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(tiles[i].label.toUpperCase(), tx + 4, y + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(sanitizePdfText(tiles[i].value), tx + 4, y + 11);
  }
  y += tileH + 4;

  // ── Coûts ────────────────────────────────────────────────
  const reste = action.coutTravaux !== undefined
    ? action.coutTravaux - (action.aides ?? 0)
    : undefined;
  const costLine = `Cout travaux : ${formatEuro(action.coutTravaux)}   |   Aides mobilisables : ${formatEuro(action.aides)}   |   Reste a charge : ${formatEuro(reste)}`;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.body);
  doc.text(sanitizePdfText(costLine), margin, y);
  y += 6;

  // Filet séparateur
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pw - margin, y);
  y += 5;

  return y;
}

// ─── Page break check ───────────────────────────────────────────

export function needsPageBreak(y: number, needed: number): boolean {
  return y + needed > PDF_LAYOUT.footerY - 15;
}
