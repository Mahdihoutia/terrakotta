"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Receipt,
  Calendar,
  User,
  FolderOpen,
  FileText,
  Download,
  CheckCircle2,
  ReceiptText,
  CreditCard,
  Save,
  XCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import type { FactureDetail, FactureStatut } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const STATUT_LABELS: Record<FactureStatut, string> = {
  BROUILLON: "Brouillon",
  EMISE: "Émise",
  PAYEE_PARTIELLEMENT: "Payée partiellement",
  PAYEE: "Payée",
  EN_RETARD: "En retard",
  ANNULEE: "Annulée",
};

const STATUT_STYLES: Record<FactureStatut, string> = {
  BROUILLON: "bg-zinc-100 text-zinc-800",
  EMISE: "bg-blue-100 text-blue-800",
  PAYEE_PARTIELLEMENT: "bg-amber-100 text-amber-800",
  PAYEE: "bg-emerald-100 text-emerald-800",
  EN_RETARD: "bg-red-100 text-red-800",
  ANNULEE: "bg-zinc-200 text-zinc-600",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

// ─── PDF Generation ─────────────────────────────────────────────

async function generateFacturePDF(facture: FactureDetail) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const {
    drawFooter,
    needsPageBreak,
    resetTextState,
    sanitizePdfText,
    formatNumberPdf,
    formatDateFrPdf,
    PDF_LAYOUT,
    PDF_COLORS,
    COMPANY,
  } = await import("@/lib/pdf-styles");

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const contentWidth = pageWidth - margin * 2;

  const fmtEur = (n: number) =>
    `${formatNumberPdf(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  const txt = (s: string | undefined | null) => sanitizePdfText((s ?? "").trim());
  const has = (s: string | undefined | null) => !!(s && s.trim());

  let y: number = PDF_LAYOUT.topMargin;

  function checkPage(needed: number) {
    if (needsPageBreak(y, needed)) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
  }

  const clientName = facture.client.prenom
    ? `${facture.client.prenom} ${facture.client.nom}`
    : facture.client.nom;

  // ─── A. EN-TÊTE ───────────────────────────
  resetTextState(doc);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text("FACTURE", margin, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  let metaY = y + 14;
  doc.text(`N° ${txt(facture.numero)}`, margin, metaY);
  metaY += 4;
  doc.text(`Émise le ${formatDateFrPdf(facture.dateEmis)}`, margin, metaY);
  metaY += 4;
  if (facture.dateEcheance) {
    doc.text(`Échéance : ${formatDateFrPdf(facture.dateEcheance)}`, margin, metaY);
    metaY += 4;
  }
  if (facture.datePaiement) {
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text(
      `PAYÉE LE ${formatDateFrPdf(facture.datePaiement).toUpperCase()}`,
      margin,
      metaY
    );
    metaY += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.bodyLight);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(COMPANY.name, pageWidth - margin, y + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  let emY = y + 10;
  for (const line of [COMPANY.address, COMPANY.phone, COMPANY.email].filter(Boolean)) {
    doc.text(line, pageWidth - margin, emY, { align: "right" });
    emY += 3.8;
  }

  y = Math.max(metaY, emY) + 4;

  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ─── B. Émetteur / Destinataire ─────────
  const colW = (contentWidth - 8) / 2;
  const colLeftX = margin;
  const colRightX = margin + colW + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.setCharSpace?.(0.6);
  doc.text("ÉMETTEUR", colLeftX, y);
  doc.text("DESTINATAIRE", colRightX, y);
  doc.setCharSpace?.(0);
  y += 5;

  let leftY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.heading);
  const emNomLines = doc.splitTextToSize(COMPANY.name, colW) as string[];
  doc.text(emNomLines, colLeftX, leftY);
  leftY += emNomLines.length * 4.4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.body);
  for (const line of [COMPANY.address, COMPANY.phone, COMPANY.email].filter(Boolean)) {
    const wrapped = doc.splitTextToSize(line, colW) as string[];
    doc.text(wrapped, colLeftX, leftY);
    leftY += wrapped.length * 3.9;
  }

  let rightY = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.heading);
  const clNomLines = doc.splitTextToSize(txt(clientName) || "Client", colW) as string[];
  doc.text(clNomLines, colRightX, rightY);
  rightY += clNomLines.length * 4.4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.body);
  const destLines = [txt(facture.client.email), txt(facture.client.telephone)].filter(Boolean);
  for (const line of destLines) {
    const wrapped = doc.splitTextToSize(line, colW) as string[];
    doc.text(wrapped, colRightX, rightY);
    rightY += wrapped.length * 3.9;
  }
  y = Math.max(leftY, rightY) + 6;

  // ─── C. Micro-cartes ────────────
  const cards: Array<{ label: string; value: string }> = [];
  if (has(facture.objet)) cards.push({ label: "OBJET", value: txt(facture.objet) });
  if (facture.projet?.titre) cards.push({ label: "PROJET LIÉ", value: txt(facture.projet.titre) });
  if (facture.devisOrigine) cards.push({ label: "DEVIS D'ORIGINE", value: facture.devisOrigine.numero });
  if (facture.dateEcheance) cards.push({ label: "ÉCHÉANCE", value: formatDateFrPdf(facture.dateEcheance) });

  if (cards.length > 0) {
    const cardCount = cards.length;
    const gap = 4;
    const cardW = (contentWidth - gap * (cardCount - 1)) / cardCount;
    const cardWrapped: string[][] = cards.map(
      (c) => doc.splitTextToSize(c.value, cardW - 8) as string[]
    );
    const maxLines = cardWrapped.reduce((m, w) => Math.max(m, w.length), 1);
    const cardH = 9 + maxLines * 4.4;
    checkPage(cardH + 4);
    for (let i = 0; i < cardCount; i++) {
      const cx = margin + i * (cardW + gap);
      doc.setFillColor(...PDF_COLORS.surface);
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...PDF_COLORS.bodyLight);
      doc.setCharSpace?.(0.5);
      doc.text(cards[i].label, cx + 4, y + 5);
      doc.setCharSpace?.(0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...PDF_COLORS.heading);
      doc.text(cardWrapped[i], cx + 4, y + 10);
    }
    y += cardH + 8;
  }

  // ─── D. Lignes ────────────
  checkPage(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.setCharSpace?.(0.6);
  doc.text("DÉTAIL DES POSTES", margin, y);
  doc.setCharSpace?.(0);
  y += 3;

  const lignesData = facture.lignes.map((l, idx) => {
    const lt = l.quantite * l.prixUnitHT;
    return [
      `#${String(idx + 1).padStart(2, "0")}`,
      txt(l.designation) || "-",
      txt(l.unite) || "-",
      formatNumberPdf(l.quantite, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      fmtEur(l.prixUnitHT),
      fmtEur(lt),
    ];
  });

  const colNumW = 12;
  const colUniteW = 16;
  const colQteW = 18;
  const colPuW = 26;
  const colTotalW = 30;
  const colDesignW = contentWidth - colNumW - colUniteW - colQteW - colPuW - colTotalW;

  autoTable(doc, {
    startY: y,
    head: [["#", "Désignation", "Unité", "Qté", "P.U. HT", "Total HT"]],
    body: lignesData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9.5,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      overflow: "linebreak",
      textColor: PDF_COLORS.body,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: PDF_COLORS.surface,
      textColor: PDF_COLORS.heading,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
    },
    alternateRowStyles: { fillColor: [252, 253, 254] as [number, number, number] },
    columnStyles: {
      0: { cellWidth: colNumW, textColor: PDF_COLORS.bodyLight, fontSize: 8.5 },
      1: { cellWidth: colDesignW, textColor: PDF_COLORS.heading },
      2: { cellWidth: colUniteW, halign: "center" },
      3: { cellWidth: colQteW, halign: "right" },
      4: { cellWidth: colPuW, halign: "right" },
      5: { cellWidth: colTotalW, halign: "right", fontStyle: "bold", textColor: PDF_COLORS.heading },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;
  resetTextState(doc);

  // ─── E. Totaux ────────────
  checkPage(40);
  const totalHT = facture.montantHT;
  const tvaRate = facture.tauxTVA;
  const totalTVA = totalHT * (tvaRate / 100);
  const totalTTC = facture.montantTTC;

  const totalsW = 82;
  const totalsX = pageWidth - margin - totalsW;
  const rowH = 7;
  const ttcH = 13;
  const totalsH = rowH * 2 + ttcH;

  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(totalsX, y, totalsW, totalsH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text("Total HT", totalsX + 5, y + 4.6);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(fmtEur(totalHT), totalsX + totalsW - 5, y + 4.6, { align: "right" });

  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(
    `TVA (${formatNumberPdf(tvaRate, { maximumFractionDigits: 1 })}%)`,
    totalsX + 5,
    y + 4.6 + rowH
  );
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(fmtEur(totalTVA), totalsX + totalsW - 5, y + 4.6 + rowH, { align: "right" });

  const ttcY = y + rowH * 2;
  doc.setFillColor(...PDF_COLORS.navy);
  doc.roundedRect(totalsX, ttcY, totalsW, ttcH, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.coverText);
  doc.text("TOTAL TTC", totalsX + 5, ttcY + 8);
  doc.setFontSize(15);
  doc.text(fmtEur(totalTTC), totalsX + totalsW - 5, ttcY + 8.4, { align: "right" });

  y += totalsH + PDF_LAYOUT.sectionGap;
  resetTextState(doc);

  // ─── F. Mention légale obligatoire (bas dernière page) ────────
  const mention =
    "En cas de retard de paiement, des pénalités de retard au taux annuel de 10% seront appliquées " +
    "(article L441-10 du Code de commerce). Indemnité forfaitaire pour frais de recouvrement : 40 €.";
  const mentionLines = doc.splitTextToSize(mention, contentWidth) as string[];
  const mentionH = mentionLines.length * 3.6 + 6;
  if (needsPageBreak(y, mentionH + 20)) {
    doc.addPage();
    y = PDF_LAYOUT.topMargin;
  } else {
    y = Math.max(y, PDF_LAYOUT.safeBottom - mentionH);
  }
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(margin, y, contentWidth, mentionH, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(mentionLines, margin + 4, y + 4.5);

  // ─── G. Footers ────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Facture", facture.numero, i, totalPages);
  }

  const filename = `Facture_${facture.numero}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function FactureDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [facture, setFacture] = useState<FactureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Inline edit state for paiement / référence
  const [editPaiement, setEditPaiement] = useState(false);
  const [formModePaiement, setFormModePaiement] = useState("");
  const [formReference, setFormReference] = useState("");
  const [formDatePaiement, setFormDatePaiement] = useState("");
  const [savingPaiement, setSavingPaiement] = useState(false);

  useEffect(() => {
    fetch(`/api/factures/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Facture introuvable");
        return r.json();
      })
      .then((data: FactureDetail) => {
        setFacture(data);
        setFormModePaiement(data.modePaiement ?? "");
        setFormReference(data.reference ?? "");
        setFormDatePaiement(data.datePaiement ? data.datePaiement.split("T")[0] : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  async function patchFacture(payload: Record<string, unknown>): Promise<FactureDetail | null> {
    const res = await fetch(`/api/factures/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      await showApiError(res, "Mise à jour impossible");
      return null;
    }
    return (await res.json()) as FactureDetail;
  }

  async function handleStatutChange(newStatut: FactureStatut) {
    if (!facture || facture.statut === newStatut) return;
    setUpdating(true);
    try {
      const updated = await patchFacture({ statut: newStatut });
      if (updated) {
        setFacture(updated);
        toast.success("Statut mis à jour");
      }
    } catch (err) {
      showNetworkError(err, "Mise à jour impossible");
    } finally {
      setUpdating(false);
    }
  }

  async function handleMarkPayee() {
    if (!facture) return;
    setUpdating(true);
    try {
      const updated = await patchFacture({
        statut: "PAYEE",
        datePaiement: new Date().toISOString(),
      });
      if (updated) {
        setFacture(updated);
        setFormDatePaiement(updated.datePaiement ? updated.datePaiement.split("T")[0] : "");
        toast.success("Facture marquée comme payée");
      }
    } catch (err) {
      showNetworkError(err, "Mise à jour impossible");
    } finally {
      setUpdating(false);
    }
  }

  async function handleSavePaiement() {
    setSavingPaiement(true);
    try {
      const updated = await patchFacture({
        modePaiement: formModePaiement || null,
        reference: formReference || null,
        datePaiement: formDatePaiement
          ? new Date(formDatePaiement).toISOString()
          : null,
      });
      if (updated) {
        setFacture(updated);
        setEditPaiement(false);
        toast.success("Paiement enregistré");
      }
    } catch (err) {
      showNetworkError(err, "Mise à jour impossible");
    } finally {
      setSavingPaiement(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/factures/${id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        setDeleting(false);
        return;
      }
      toast.success("Facture déplacée dans la corbeille");
      router.push("/dashboard/factures");
    } catch (err) {
      showNetworkError(err, "Suppression impossible");
      setDeleting(false);
    }
  }

  async function handleDownloadPDF() {
    if (!facture) return;
    setGeneratingPDF(true);
    try {
      await generateFacturePDF(facture);
    } finally {
      setGeneratingPDF(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-tk-text-faint" />
      </div>
    );
  }

  if (error || !facture) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error ?? "Facture introuvable"}</p>
        <Link href="/dashboard/factures">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux factures
          </Button>
        </Link>
      </div>
    );
  }

  const lignesWithTotals = facture.lignes.map((l) => ({
    ...l,
    totalHT: l.quantite * l.prixUnitHT,
  }));
  const totalHT = facture.montantHT;
  const tva = totalHT * facture.tauxTVA / 100;
  const totalTTC = facture.montantTTC;

  const isLate =
    facture.statut === "EMISE" &&
    facture.dateEcheance &&
    new Date(facture.dateEcheance).getTime() < Date.now();

  // Status actions
  const statutActions: { statut: FactureStatut; label: string; icon: React.ReactNode; className: string }[] = [];
  if (facture.statut === "BROUILLON") {
    statutActions.push({
      statut: "EMISE",
      label: "Émettre la facture",
      icon: <Send className="mr-2 h-3.5 w-3.5" />,
      className: "border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10",
    });
  }
  if (facture.statut !== "PAYEE" && facture.statut !== "ANNULEE") {
    statutActions.push({
      statut: "ANNULEE",
      label: "Annuler la facture",
      icon: <XCircle className="mr-2 h-3.5 w-3.5" />,
      className: "border-zinc-500/20 bg-zinc-500/5 text-zinc-400 hover:bg-zinc-500/10",
    });
  }

  const inputClass =
    "w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors";
  const labelClass = "text-xs font-medium text-tk-text-muted mb-1.5 block";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/factures">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-tk-text-faint hover:text-tk-text hover:bg-tk-hover">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-tk-text flex items-center gap-2">
              <span className="font-mono">{facture.numero}</span>
              {facture.objet && (
                <span className="text-lg font-normal text-tk-text-secondary">— {facture.objet}</span>
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  STATUT_STYLES[facture.statut]
                )}
              >
                {STATUT_LABELS[facture.statut]}
              </span>
              {isLate && (
                <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">
                  EN RETARD
                </span>
              )}
              <span className="text-xs text-tk-text-faint">
                Émise le {formatDate(facture.dateEmis)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {facture.statut !== "PAYEE" && facture.statut !== "ANNULEE" && (
            <Button
              size="sm"
              onClick={handleMarkPayee}
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updating ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              )}
              Marquer comme payée
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover"
          >
            {generatingPDF ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5" />
            )}
            Télécharger PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-tk-text mb-2">Supprimer cette facture ?</h3>
              <p className="text-sm text-tk-text-muted mb-6">
                Cette action est réversible (corbeille).{" "}
                <span className="text-tk-text font-medium">{facture.numero}</span>{" "}
                sera placée dans la corbeille.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover"
                >
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                  )}
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lignes */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-tk-border">
              <h2 className="text-sm font-semibold text-tk-text flex items-center gap-2">
                <Receipt className="h-4 w-4 text-tk-text-faint" />
                Détail des postes
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-tk-border hover:bg-transparent">
                  <TableHead>Désignation</TableHead>
                  <TableHead className="w-[70px]">Unité</TableHead>
                  <TableHead className="w-[80px] text-right">Qté</TableHead>
                  <TableHead className="w-[120px] text-right">Prix unit. HT</TableHead>
                  <TableHead className="w-[80px] text-right">TVA</TableHead>
                  <TableHead className="w-[120px] text-right">Total HT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lignesWithTotals.map((ligne, index) => (
                  <TableRow key={ligne.id || index} className="border-tk-border">
                    <TableCell className="text-sm text-tk-text">{ligne.designation}</TableCell>
                    <TableCell className="text-sm text-tk-text-muted">{ligne.unite}</TableCell>
                    <TableCell className="text-sm text-tk-text-secondary text-right">{ligne.quantite}</TableCell>
                    <TableCell className="text-sm text-tk-text-secondary text-right">{formatCurrency(ligne.prixUnitHT)}</TableCell>
                    <TableCell className="text-sm text-tk-text-muted text-right">{ligne.tauxTVA}%</TableCell>
                    <TableCell className="text-sm font-medium text-tk-text text-right">{formatCurrency(ligne.totalHT)}</TableCell>
                  </TableRow>
                ))}
                {facture.lignes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-tk-text-faint">
                      Aucune ligne
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="border-t border-tk-border p-4">
              <div className="flex justify-end">
                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-tk-text-muted">Total HT</span>
                    <span className="text-sm font-medium text-tk-text-secondary">{formatCurrency(totalHT)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-tk-text-muted">TVA ({facture.tauxTVA}%)</span>
                    <span className="text-sm text-tk-text-secondary">{formatCurrency(tva)}</span>
                  </div>
                  <div className="flex justify-between gap-8 pt-1.5 border-t border-tk-border">
                    <span className="text-sm font-semibold text-tk-text">Total TTC</span>
                    <span className="text-sm font-bold text-tk-text">{formatCurrency(totalTTC)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-tk-text mb-4">Informations</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={<FileText className="h-4 w-4" />} label="Objet" value={facture.objet || "—"} />
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Client"
                value={facture.client.prenom ? `${facture.client.prenom} ${facture.client.nom}` : facture.client.nom}
                href={`/dashboard/contacts/${facture.clientId}`}
              />
              {facture.projet && (
                <InfoRow
                  icon={<FolderOpen className="h-4 w-4" />}
                  label="Projet"
                  value={facture.projet.titre}
                  href={`/dashboard/projets/${facture.projetId}`}
                />
              )}
              {facture.devisOrigine && (
                <InfoRow
                  icon={<Receipt className="h-4 w-4" />}
                  label="Devis d'origine"
                  value={facture.devisOrigine.numero}
                  href={`/dashboard/devis/${facture.devisOrigine.id}`}
                />
              )}
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date d'émission" value={formatDate(facture.dateEmis)} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date d'échéance" value={formatDate(facture.dateEcheance)} />
            </div>
          </div>

          {/* Paiement */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-tk-text flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-tk-text-faint" />
                Paiement
              </h2>
              {!editPaiement && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditPaiement(true)}
                  className="text-xs h-7"
                >
                  Modifier
                </Button>
              )}
            </div>
            {editPaiement ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Mode de paiement</label>
                  <select
                    value={formModePaiement}
                    onChange={(e) => setFormModePaiement(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    <option value="VIREMENT">Virement</option>
                    <option value="CHEQUE">Chèque</option>
                    <option value="CB">Carte bancaire</option>
                    <option value="ESPECES">Espèces</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Référence</label>
                  <input
                    type="text"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                    placeholder="Réf. virement, n° chèque…"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date paiement</label>
                  <input
                    type="date"
                    value={formDatePaiement}
                    onChange={(e) => setFormDatePaiement(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSavePaiement}
                    disabled={savingPaiement}
                  >
                    {savingPaiement ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-3.5 w-3.5" />
                    )}
                    Enregistrer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditPaiement(false);
                      setFormModePaiement(facture.modePaiement ?? "");
                      setFormReference(facture.reference ?? "");
                      setFormDatePaiement(facture.datePaiement ? facture.datePaiement.split("T")[0] : "");
                    }}
                    className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Mode" value={facture.modePaiement || "—"} />
                <InfoRow icon={<FileText className="h-4 w-4" />} label="Référence" value={facture.reference || "—"} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Date paiement" value={formatDate(facture.datePaiement)} />
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Montants */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-tk-text mb-4">Montants</h2>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Montant HT</p>
                <p className="text-2xl font-bold text-tk-text-secondary">{formatCurrency(totalHT)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">TVA ({facture.tauxTVA}%)</p>
                <p className="text-lg font-medium text-tk-text-muted">{formatCurrency(tva)}</p>
              </div>
              <div className="pt-3 border-t border-tk-border">
                <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Montant TTC</p>
                <p className="text-3xl font-bold text-tk-text">{formatCurrency(totalTTC)}</p>
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-tk-text mb-4">Statut</h2>
            <div className="space-y-3">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                  STATUT_STYLES[facture.statut]
                )}
              >
                {STATUT_LABELS[facture.statut]}
              </span>
              {statutActions.length > 0 && (
                <div className="pt-3 border-t border-tk-border space-y-2">
                  {statutActions.map((action) => (
                    <Button
                      key={action.statut}
                      variant="outline"
                      size="sm"
                      className={cn("w-full justify-start", action.className)}
                      onClick={() => handleStatutChange(action.statut)}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        action.icon
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {facture.devisOrigine && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-3 flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-tk-text-faint" />
                Origine
              </h2>
              <Link
                href={`/dashboard/devis/${facture.devisOrigine.id}`}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                Devis {facture.devisOrigine.numero}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-tk-text-faint">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">{label}</p>
        {href ? (
          <Link href={href} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
            {value}
          </Link>
        ) : (
          <p className="text-sm text-tk-text-secondary">{value}</p>
        )}
      </div>
    </div>
  );
}
