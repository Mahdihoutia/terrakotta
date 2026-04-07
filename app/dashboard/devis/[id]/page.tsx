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
  Save,
  Trash2,
  Loader2,
  Pencil,
  X,
  Receipt,
  Calendar,
  User,
  FolderOpen,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DevisDetail, DevisStatut, LigneDevis } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const STATUT_LABELS: Record<DevisStatut, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
};

const STATUT_STYLES: Record<DevisStatut, string> = {
  BROUILLON: "bg-zinc-100 text-zinc-800",
  ENVOYE: "bg-blue-100 text-blue-800",
  ACCEPTE: "bg-emerald-100 text-emerald-800",
  REFUSE: "bg-red-100 text-red-800",
};

interface SimpleClient {
  id: string;
  nom: string;
  prenom: string | null;
}

interface SimpleProjet {
  id: string;
  titre: string;
}

interface LigneForm {
  designation: string;
  unite: string;
  quantite: string;
  prixUnitHT: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

// ─── PDF Generation ─────────────────────────────────────────────

async function generateDevisPDF(devis: DevisDetail) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const {
    drawCoverPage,
    drawSectionHeader,
    drawFooter,
    drawSignatureBlock,
    getDevisTableConfig,
    getTotalsTableConfig,
    getDataTableConfig,
    needsPageBreak,
    PDF_LAYOUT,
    PDF_COLORS,
  } = await import("@/lib/pdf-styles");

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const contentWidth = pageWidth - margin * 2;

  let y: number;

  function checkPage(needed: number) {
    if (needsPageBreak(y, needed)) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
  }

  const clientName = devis.client.prenom
    ? `${devis.client.prenom} ${devis.client.nom}`
    : devis.client.nom;

  // ─── Cover page ──────────────────────────────────────────
  const infoRows: [string, string][] = [
    ["Reference", devis.numero],
    ["Client", clientName],
    ["Objet", devis.objet || ""],
    ["Date d'emission", formatDate(devis.dateEmis)],
    ["Date de validite", formatDate(devis.dateValide)],
  ];
  if (devis.projet) {
    infoRows.push(["Projet", devis.projet.titre]);
  }

  y = drawCoverPage(doc, "Devis", devis.objet || "Devis", infoRows, devis.numero);

  // ─── Client info ─────────────────────────────────────────
  checkPage(30);
  y = drawSectionHeader(doc, "Informations client", y);

  const clientData: string[][] = [];
  clientData.push(["Nom", clientName]);
  if (devis.client.email) clientData.push(["Email", devis.client.email]);
  if (devis.client.telephone) clientData.push(["Telephone", devis.client.telephone]);

  if (clientData.length > 0) {
    autoTable(doc, getDataTableConfig(y, clientData, contentWidth));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + PDF_LAYOUT.sectionGap;
  }

  // ─── Ligne items table ────────────────────────────────────
  checkPage(40);
  y = drawSectionHeader(doc, "Designation des travaux", y);

  const lignesData = devis.lignes.map((l) => {
    const totalHT = l.quantite * l.prixUnitHT;
    return [
      l.designation || "",
      l.unite || "",
      l.quantite.toFixed(2),
      `${l.prixUnitHT.toFixed(2)} \u20AC`,
      `${totalHT.toFixed(2)} \u20AC`,
    ];
  });

  autoTable(doc, getDevisTableConfig(
    y,
    [["Designation", "Unite", "Quantite", "P.U. HT", "Total HT"]],
    lignesData,
  ));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;

  // Totals
  const totalHT = devis.montantHT;
  const tvaRate = devis.tauxTVA;
  const totalTVA = totalHT * (tvaRate / 100);
  const totalTTC = devis.montantTTC;

  autoTable(doc, getTotalsTableConfig(
    y,
    [
      ["Total HT", `${totalHT.toFixed(2)} \u20AC`],
      [`TVA (${tvaRate}%)`, `${totalTVA.toFixed(2)} \u20AC`],
      ["Total TTC", `${totalTTC.toFixed(2)} \u20AC`],
    ],
    contentWidth,
    true,
  ));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + PDF_LAYOUT.sectionGap;

  // ─── Signature ────────────────────────────────────────────
  checkPage(50);
  drawSignatureBlock(doc, y);

  // ─── Footers ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Devis", devis.numero, i, totalPages);
  }

  const filename = `Devis_${devis.numero}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function DevisDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [devis, setDevis] = useState<DevisDetail | null>(null);
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [projets, setProjets] = useState<SimpleProjet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatut, setUpdatingStatut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Edit form state
  const [formObjet, setFormObjet] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formProjetId, setFormProjetId] = useState("");
  const [formTauxTVA, setFormTauxTVA] = useState("20");
  const [formDateValide, setFormDateValide] = useState("");
  const [formLignes, setFormLignes] = useState<LigneForm[]>([]);

  useEffect(() => {
    fetch(`/api/devis/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Devis introuvable");
        return res.json();
      })
      .then((data: DevisDetail) => {
        setDevis(data);
        populateForm(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));

    fetch("/api/clients")
      .then((res) => res.json())
      .then((data: SimpleClient[]) => setClients(data))
      .catch(() => {});

    fetch("/api/projets")
      .then((res) => res.json())
      .then((data: SimpleProjet[]) => setProjets(data))
      .catch(() => {});
  }, [id]);

  function populateForm(d: DevisDetail) {
    setFormObjet(d.objet || "");
    setFormClientId(d.clientId);
    setFormProjetId(d.projetId || "");
    setFormTauxTVA(String(d.tauxTVA));
    setFormDateValide(d.dateValide ? d.dateValide.split("T")[0] : "");
    setFormLignes(
      d.lignes.map((l) => ({
        designation: l.designation,
        unite: l.unite,
        quantite: String(l.quantite),
        prixUnitHT: String(l.prixUnitHT),
      }))
    );
  }

  function computeMontantHT(): number {
    return formLignes.reduce((sum, l) => {
      const qty = parseFloat(l.quantite) || 0;
      const prix = parseFloat(l.prixUnitHT) || 0;
      return sum + qty * prix;
    }, 0);
  }

  function addLigne() {
    setFormLignes([...formLignes, { designation: "", unite: "U", quantite: "1", prixUnitHT: "" }]);
  }

  function removeLigne(index: number) {
    if (formLignes.length <= 1) return;
    setFormLignes(formLignes.filter((_, i) => i !== index));
  }

  function updateLigne(index: number, field: keyof LigneForm, value: string) {
    const updated = [...formLignes];
    updated[index] = { ...updated[index], [field]: value };
    setFormLignes(updated);
  }

  async function handleSave() {
    if (!formObjet.trim() || !formClientId) return;
    setSaving(true);

    const montantHT = computeMontantHT();
    const tauxTVA = parseFloat(formTauxTVA);

    const lignes = formLignes
      .filter((l) => l.designation.trim())
      .map((l, index) => ({
        designation: l.designation,
        unite: l.unite || "U",
        quantite: parseFloat(l.quantite) || 1,
        prixUnitHT: parseFloat(l.prixUnitHT) || 0,
        tauxTVA,
        ordre: index,
      }));

    try {
      const res = await fetch(`/api/devis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objet: formObjet,
          clientId: formClientId,
          projetId: formProjetId || null,
          montantHT,
          tauxTVA,
          dateValide: formDateValide
            ? new Date(formDateValide).toISOString()
            : null,
          lignes,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      const updated: DevisDetail = await res.json();
      setDevis(updated);
      populateForm(updated);
      setEditing(false);
    } catch {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/devis/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      router.push("/dashboard/devis");
    } catch {
      setError("Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  async function handleStatutChange(newStatut: DevisStatut) {
    if (!devis || devis.statut === newStatut) return;
    setUpdatingStatut(true);
    try {
      const res = await fetch(`/api/devis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (!res.ok) throw new Error("Erreur");
      const updated: DevisDetail = await res.json();
      setDevis(updated);
      populateForm(updated);
    } catch {
      setError("Erreur lors de la mise a jour du statut");
    } finally {
      setUpdatingStatut(false);
    }
  }

  function handleCancel() {
    if (devis) populateForm(devis);
    setEditing(false);
  }

  async function handleDownloadPDF() {
    if (!devis) return;
    setGeneratingPDF(true);
    try {
      await generateDevisPDF(devis);
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

  if (error || !devis) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error ?? "Devis introuvable"}</p>
        <Link href="/dashboard/devis">
          <Button
            variant="outline"
            size="sm"
            className="border-tk-border bg-tk-surface text-tk-text-secondary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux devis
          </Button>
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors";
  const labelClass = "text-xs font-medium text-tk-text-muted mb-1.5 block";

  // Compute line-level totals
  const lignesWithTotals = devis.lignes.map((l) => ({
    ...l,
    totalHT: l.quantite * l.prixUnitHT,
  }));
  const totalHT = devis.montantHT;
  const tva = totalHT * devis.tauxTVA / 100;
  const totalTTC = devis.montantTTC;

  // Status action buttons
  const statutActions: { statut: DevisStatut; label: string; icon: React.ReactNode; className: string }[] = [];

  if (devis.statut === "BROUILLON") {
    statutActions.push({
      statut: "ENVOYE",
      label: "Marquer comme envoye",
      icon: <Send className="mr-2 h-3.5 w-3.5" />,
      className: "border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10",
    });
  }
  if (devis.statut === "BROUILLON" || devis.statut === "ENVOYE") {
    statutActions.push({
      statut: "ACCEPTE",
      label: "Marquer comme accepte",
      icon: <CheckCircle2 className="mr-2 h-3.5 w-3.5" />,
      className: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10",
    });
    statutActions.push({
      statut: "REFUSE",
      label: "Marquer comme refuse",
      icon: <XCircle className="mr-2 h-3.5 w-3.5" />,
      className: "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10",
    });
  }
  if (devis.statut === "ENVOYE") {
    statutActions.push({
      statut: "BROUILLON",
      label: "Repasser en brouillon",
      icon: <FileText className="mr-2 h-3.5 w-3.5" />,
      className: "border-zinc-500/20 bg-zinc-500/5 text-zinc-400 hover:bg-zinc-500/10",
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/devis">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-tk-text-faint hover:text-tk-text hover:bg-tk-hover"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-tk-text flex items-center gap-2">
              <span className="font-mono">{devis.numero}</span>
              {devis.objet && (
                <span className="text-lg font-normal text-tk-text-secondary">
                  — {devis.objet}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  STATUT_STYLES[devis.statut]
                )}
              >
                {STATUT_LABELS[devis.statut]}
              </span>
              <span className="text-xs text-tk-text-faint">
                Emis le {formatDate(devis.dateEmis)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover"
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3.5 w-3.5" />
                )}
                Enregistrer
              </Button>
            </>
          ) : (
            <>
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
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Modifier
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
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
              <h3 className="text-lg font-semibold text-tk-text mb-2">
                Supprimer ce devis ?
              </h3>
              <p className="text-sm text-tk-text-muted mb-6">
                Cette action est irreversible. Le devis{" "}
                <span className="text-tk-text font-medium">{devis.numero}</span>{" "}
                sera definitivement supprime.
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

      {/* Content */}
      {editing ? (
        /* ─── Mode edition ─────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Basic info */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-tk-text mb-4">Informations</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Objet *</label>
                <input
                  type="text"
                  value={formObjet}
                  onChange={(e) => setFormObjet(e.target.value)}
                  placeholder="Objet du devis"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Client *</label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selectionner</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Projet</label>
                <select
                  value={formProjetId}
                  onChange={(e) => setFormProjetId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Aucun</option>
                  {projets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Taux TVA</label>
                <select
                  value={formTauxTVA}
                  onChange={(e) => setFormTauxTVA(e.target.value)}
                  className={inputClass}
                >
                  <option value="5.5">5,5%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Date de validite</label>
                <input
                  type="date"
                  value={formDateValide}
                  onChange={(e) => setFormDateValide(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Lignes */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-tk-text">Lignes du devis</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={addLigne}
                className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover text-xs h-7"
              >
                <Plus className="mr-1 h-3 w-3" />
                Ajouter une ligne
              </Button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_80px_120px_32px] gap-2 text-[10px] uppercase tracking-wider text-tk-text-faint px-1">
                <span>Designation</span>
                <span>Unite</span>
                <span>Quantite</span>
                <span>Prix unit. HT</span>
                <span></span>
              </div>
              {formLignes.map((ligne, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_80px_80px_120px_32px] gap-2 items-center"
                >
                  <input
                    type="text"
                    value={ligne.designation}
                    onChange={(e) => updateLigne(index, "designation", e.target.value)}
                    placeholder="Designation"
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                  <input
                    type="text"
                    value={ligne.unite}
                    onChange={(e) => updateLigne(index, "unite", e.target.value)}
                    placeholder="U"
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                  <input
                    type="number"
                    value={ligne.quantite}
                    onChange={(e) => updateLigne(index, "quantite", e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                  <input
                    type="number"
                    value={ligne.prixUnitHT}
                    onChange={(e) => updateLigne(index, "prixUnitHT", e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                  <button
                    onClick={() => removeLigne(index)}
                    disabled={formLignes.length <= 1}
                    className={cn(
                      "flex items-center justify-center h-9 w-8 rounded-lg transition-colors",
                      formLignes.length <= 1
                        ? "text-tk-text-faint/30 cursor-not-allowed"
                        : "text-tk-text-faint hover:text-red-400 hover:bg-red-500/10"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <div className="text-right space-y-1">
                <p className="text-sm text-tk-text-muted">
                  Total HT :{" "}
                  <span className="font-semibold text-tk-text">
                    {formatCurrency(computeMontantHT())}
                  </span>
                </p>
                <p className="text-sm text-tk-text-muted">
                  TVA ({formTauxTVA}%) :{" "}
                  <span className="font-medium text-tk-text-secondary">
                    {formatCurrency(computeMontantHT() * parseFloat(formTauxTVA) / 100)}
                  </span>
                </p>
                <p className="text-sm font-semibold text-tk-text">
                  Total TTC :{" "}
                  {formatCurrency(computeMontantHT() * (1 + parseFloat(formTauxTVA) / 100))}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ─── Mode lecture ─────────────────────────────────────── */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lignes du devis */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-tk-border">
                <h2 className="text-sm font-semibold text-tk-text flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-tk-text-faint" />
                  Lignes du devis
                </h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-tk-border hover:bg-transparent">
                    <TableHead>Designation</TableHead>
                    <TableHead className="w-[70px]">Unite</TableHead>
                    <TableHead className="w-[80px] text-right">Qte</TableHead>
                    <TableHead className="w-[120px] text-right">Prix unit. HT</TableHead>
                    <TableHead className="w-[80px] text-right">TVA</TableHead>
                    <TableHead className="w-[120px] text-right">Total HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignesWithTotals.map((ligne, index) => (
                    <TableRow key={ligne.id || index} className="border-tk-border">
                      <TableCell className="text-sm text-tk-text">
                        {ligne.designation}
                      </TableCell>
                      <TableCell className="text-sm text-tk-text-muted">
                        {ligne.unite}
                      </TableCell>
                      <TableCell className="text-sm text-tk-text-secondary text-right">
                        {ligne.quantite}
                      </TableCell>
                      <TableCell className="text-sm text-tk-text-secondary text-right">
                        {formatCurrency(ligne.prixUnitHT)}
                      </TableCell>
                      <TableCell className="text-sm text-tk-text-muted text-right">
                        {ligne.tauxTVA}%
                      </TableCell>
                      <TableCell className="text-sm font-medium text-tk-text text-right">
                        {formatCurrency(ligne.totalHT)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {devis.lignes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-tk-text-faint">
                        Aucune ligne dans ce devis
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Footer totals */}
              <div className="border-t border-tk-border p-4">
                <div className="flex justify-end">
                  <div className="space-y-1.5 text-right">
                    <div className="flex justify-between gap-8">
                      <span className="text-sm text-tk-text-muted">Total HT</span>
                      <span className="text-sm font-medium text-tk-text-secondary">
                        {formatCurrency(totalHT)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-sm text-tk-text-muted">TVA ({devis.tauxTVA}%)</span>
                      <span className="text-sm text-tk-text-secondary">
                        {formatCurrency(tva)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-8 pt-1.5 border-t border-tk-border">
                      <span className="text-sm font-semibold text-tk-text">Total TTC</span>
                      <span className="text-sm font-bold text-tk-text">
                        {formatCurrency(totalTTC)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4">Informations</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow
                  icon={<FileText className="h-4 w-4" />}
                  label="Objet"
                  value={devis.objet || "\u2014"}
                />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Client"
                  value={
                    devis.client.prenom
                      ? `${devis.client.prenom} ${devis.client.nom}`
                      : devis.client.nom
                  }
                  href={`/dashboard/contacts/${devis.clientId}`}
                />
                {devis.projet && (
                  <InfoRow
                    icon={<FolderOpen className="h-4 w-4" />}
                    label="Projet"
                    value={devis.projet.titre}
                    href={`/dashboard/projets/${devis.projetId}`}
                  />
                )}
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date d'emission"
                  value={formatDate(devis.dateEmis)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date de validite"
                  value={formatDate(devis.dateValide)}
                />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Montants */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4">Montants</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">
                    Montant HT
                  </p>
                  <p className="text-2xl font-bold text-tk-text-secondary">
                    {formatCurrency(totalHT)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">
                    TVA ({devis.tauxTVA}%)
                  </p>
                  <p className="text-lg font-medium text-tk-text-muted">
                    {formatCurrency(tva)}
                  </p>
                </div>
                <div className="pt-3 border-t border-tk-border">
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">
                    Montant TTC
                  </p>
                  <p className="text-3xl font-bold text-tk-text">
                    {formatCurrency(totalTTC)}
                  </p>
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
                    STATUT_STYLES[devis.statut]
                  )}
                >
                  {STATUT_LABELS[devis.statut]}
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
                        disabled={updatingStatut}
                      >
                        {updatingStatut ? (
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
          </div>
        </div>
      )}
    </div>
  );
}

/** Reusable info row */
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
          <Link
            href={href}
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            {value}
          </Link>
        ) : (
          <p className="text-sm text-tk-text-secondary">{value}</p>
        )}
      </div>
    </div>
  );
}
