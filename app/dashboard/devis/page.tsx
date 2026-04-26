"use client";

import { useState, useEffect, useCallback } from "react";
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
  Receipt,
  Plus,
  Filter,
  ArrowRight,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import type { Devis, DevisStatut, DevisClient, DevisProjet } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

type DevisStatutFilter = DevisStatut | "TOUS";

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

interface LigneForm {
  designation: string;
  unite: string;
  quantite: string;
  prixUnitHT: string;
}

interface SimpleClient {
  id: string;
  nom: string;
  prenom: string | null;
}

interface SimpleProjet {
  id: string;
  titre: string;
}

const EMPTY_LIGNE: LigneForm = {
  designation: "",
  unite: "U",
  quantite: "1",
  prixUnitHT: "",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

const RELANCE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

/** Un devis ENVOYE non touché depuis > 7j est candidat à la relance. */
function needsRelance(d: Devis): boolean {
  if (d.statut !== "ENVOYE") return false;
  const updated = new Date(d.updatedAt).getTime();
  return Date.now() - updated > RELANCE_THRESHOLD_MS;
}

export default function DevisListPage() {
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [projets, setProjets] = useState<SimpleProjet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatut, setFilterStatut] = useLocalStorage<DevisStatutFilter>(
    "terrakotta:devis:filterStatut",
    "TOUS"
  );
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formObjet, setFormObjet] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formProjetId, setFormProjetId] = useState("");
  const [formTauxTVA, setFormTauxTVA] = useState("20");
  const [formLignes, setFormLignes] = useState<LigneForm[]>([{ ...EMPTY_LIGNE }]);

  const fetchDevis = useCallback(async () => {
    try {
      const res = await fetch("/api/devis");
      if (!res.ok) throw new Error("Erreur lors du chargement des devis");
      const data: Devis[] = await res.json();
      setDevisList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevis();

    // Fetch clients for dropdown
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data: SimpleClient[]) => setClients(data))
      .catch(() => {});

    // Fetch projets for dropdown
    fetch("/api/projets")
      .then((res) => res.json())
      .then((data: SimpleProjet[]) => setProjets(data))
      .catch(() => {});
  }, [fetchDevis]);

  const filteredDevis =
    filterStatut === "TOUS"
      ? devisList
      : devisList.filter((d) => d.statut === filterStatut);

  const statuts: DevisStatutFilter[] = ["TOUS", "BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"];

  function computeMontantHT(): number {
    return formLignes.reduce((sum, l) => {
      const qty = parseFloat(l.quantite) || 0;
      const prix = parseFloat(l.prixUnitHT) || 0;
      return sum + qty * prix;
    }, 0);
  }

  function addLigne() {
    setFormLignes([...formLignes, { ...EMPTY_LIGNE }]);
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

  function resetForm() {
    setFormObjet("");
    setFormClientId("");
    setFormProjetId("");
    setFormTauxTVA("20");
    setFormLignes([{ ...EMPTY_LIGNE }]);
  }

  async function handleCreate() {
    if (!formObjet.trim() || !formClientId) return;

    const montantHT = computeMontantHT();
    const tauxTVA = parseFloat(formTauxTVA);

    const lignes = formLignes
      .filter((l) => l.designation.trim() && l.prixUnitHT)
      .map((l, index) => ({
        designation: l.designation,
        unite: l.unite || "U",
        quantite: parseFloat(l.quantite) || 1,
        prixUnitHT: parseFloat(l.prixUnitHT) || 0,
        tauxTVA,
        ordre: index,
      }));

    setSubmitting(true);
    try {
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objet: formObjet,
          clientId: formClientId,
          projetId: formProjetId || undefined,
          montantHT,
          tauxTVA,
          lignes,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la creation");
      const created: Devis = await res.json();
      setDevisList([created, ...devisList]);
      resetForm();
      setShowForm(false);
    } catch {
      setError("Erreur lors de la creation du devis");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/devis/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      setDevisList(devisList.filter((d) => d.id !== id));
    } catch {
      setError("Erreur lors de la suppression");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-tk-text-faint" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <p className="text-tk-text-faint text-xs">
          Verifiez la connexion a la base de donnees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tk-text flex items-center gap-2">
            <Receipt className="h-6 w-6 text-tk-text-faint" />
            Devis
          </h1>
          <p className="text-tk-text-faint">
            Gerez vos devis et propositions commerciales — {devisList.length} au total
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau devis
        </Button>
      </div>

      {/* Creation form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="glass rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-tk-text">Nouveau devis</h3>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="text-tk-text-faint hover:text-tk-text-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-tk-text-muted">Objet *</label>
                  <input
                    type="text"
                    value={formObjet}
                    onChange={(e) => setFormObjet(e.target.value)}
                    placeholder="Ex: Audit energetique maison individuelle"
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Client *</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  >
                    <option value="">Selectionner un client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Projet (optionnel)</label>
                  <select
                    value={formProjetId}
                    onChange={(e) => setFormProjetId(e.target.value)}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  >
                    <option value="">Aucun projet</option>
                    {projets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Taux TVA</label>
                  <select
                    value={formTauxTVA}
                    onChange={(e) => setFormTauxTVA(e.target.value)}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  >
                    <option value="5.5">5,5%</option>
                    <option value="10">10%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
              </div>

              {/* Lignes de devis */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-tk-text-muted">Lignes du devis</label>
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
                  {/* Column headers */}
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
                        placeholder="1"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                      />
                      <input
                        type="number"
                        value={ligne.prixUnitHT}
                        onChange={(e) => updateLigne(index, "prixUnitHT", e.target.value)}
                        placeholder="0,00"
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

                {/* Totals */}
                <div className="mt-4 flex justify-end">
                  <div className="text-right space-y-1">
                    <p className="text-sm text-tk-text-muted">
                      Total HT : <span className="font-semibold text-tk-text">{formatCurrency(computeMontantHT())}</span>
                    </p>
                    <p className="text-sm text-tk-text-muted">
                      TVA ({formTauxTVA}%) : <span className="font-medium text-tk-text-secondary">{formatCurrency(computeMontantHT() * parseFloat(formTauxTVA) / 100)}</span>
                    </p>
                    <p className="text-sm font-semibold text-tk-text">
                      Total TTC : {formatCurrency(computeMontantHT() * (1 + parseFloat(formTauxTVA) / 100))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={submitting || !formObjet.trim() || !formClientId}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Receipt className="mr-2 h-3.5 w-3.5" />
                  )}
                  Creer le devis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-tk-text-faint" />
        <div className="flex gap-1">
          {statuts.map((s) => (
            <Button
              key={s}
              variant={filterStatut === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatut(s)}
              className={cn(
                "text-xs whitespace-nowrap",
                filterStatut !== s &&
                  "border-tk-border bg-tk-surface text-tk-text-muted hover:bg-tk-hover hover:text-tk-text-secondary"
              )}
            >
              {s === "TOUS"
                ? `Tous (${devisList.length})`
                : STATUT_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-tk-border hover:bg-transparent">
              <TableHead>N°</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Montant HT</TableHead>
              <TableHead>Montant TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date emission</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevis.map((devis) => (
              <TableRow
                key={devis.id}
                className="group border-tk-border hover:bg-tk-hover"
              >
                <TableCell>
                  <Link href={`/dashboard/devis/${devis.id}`} className="block">
                    <p className="font-mono text-sm font-medium text-tk-text">
                      {devis.numero}
                    </p>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/devis/${devis.id}`} className="block">
                    <p className="text-sm text-tk-text-secondary">
                      {devis.objet || "\u2014"}
                    </p>
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-tk-text-secondary">
                    {devis.client.prenom
                      ? `${devis.client.prenom} ${devis.client.nom}`
                      : devis.client.nom}
                  </p>
                </TableCell>
                <TableCell className="text-sm font-medium text-tk-text-secondary">
                  {formatCurrency(devis.montantHT)}
                </TableCell>
                <TableCell className="text-sm font-medium text-tk-text">
                  {formatCurrency(devis.montantTTC)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        STATUT_STYLES[devis.statut]
                      )}
                    >
                      {STATUT_LABELS[devis.statut]}
                    </span>
                    {needsRelance(devis) && (
                      <span
                        className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-500"
                        title="Envoyé il y a plus de 7 jours sans retour"
                      >
                        À relancer
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-tk-text-faint">
                  {formatDate(devis.dateEmis)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/devis/${devis.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-tk-text-muted hover:text-tk-text"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-tk-text-muted hover:text-red-400"
                      onClick={(e) => handleDelete(devis.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredDevis.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-tk-text-faint">
                  Aucun devis trouve pour ce filtre
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
