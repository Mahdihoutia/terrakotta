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
  ReceiptText,
  Plus,
  Filter,
  ArrowRight,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import type { Facture, FactureStatut } from "@/types";

type FactureStatutFilter = FactureStatut | "TOUS";

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
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

/** Une facture EMISE dont l'échéance est passée est en retard. */
function isLate(f: Facture): boolean {
  if (f.statut !== "EMISE" || !f.dateEcheance) return false;
  return new Date(f.dateEcheance).getTime() < Date.now();
}

interface SimpleClient {
  id: string;
  nom: string;
  prenom: string | null;
}

export default function FacturesListPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<SimpleClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatut, setFilterStatut] = useLocalStorage<FactureStatutFilter>(
    "terrakotta:factures:filterStatut",
    "TOUS"
  );

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formObjet, setFormObjet] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formMontantHT, setFormMontantHT] = useState("");
  const [formTauxTVA, setFormTauxTVA] = useState("20");

  const fetchFactures = useCallback(async () => {
    try {
      const res = await fetch("/api/factures");
      if (!res.ok) throw new Error("Erreur chargement factures");
      const data: Facture[] = await res.json();
      setFactures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactures();
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d: SimpleClient[]) => setClients(d))
      .catch(() => {});
  }, [fetchFactures]);

  const filteredFactures =
    filterStatut === "TOUS"
      ? factures
      : factures.filter((f) => f.statut === filterStatut);

  const statuts: FactureStatutFilter[] = [
    "TOUS",
    "BROUILLON",
    "EMISE",
    "PAYEE_PARTIELLEMENT",
    "PAYEE",
    "EN_RETARD",
    "ANNULEE",
  ];

  function resetForm() {
    setFormObjet("");
    setFormClientId("");
    setFormMontantHT("");
    setFormTauxTVA("20");
  }

  async function handleCreate() {
    if (!formClientId || !formMontantHT) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objet: formObjet || undefined,
          clientId: formClientId,
          montantHT: parseFloat(formMontantHT),
          tauxTVA: parseFloat(formTauxTVA),
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Création impossible");
        return;
      }
      const created: Facture = await res.json();
      setFactures([created, ...factures]);
      resetForm();
      setShowForm(false);
    } catch (err) {
      showNetworkError(err, "Création impossible");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/factures/${id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      setFactures(factures.filter((f) => f.id !== id));
    } catch (err) {
      showNetworkError(err, "Suppression impossible");
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tk-text flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-tk-text-faint" />
            Factures
          </h1>
          <p className="text-tk-text-faint">
            Gérez vos factures et leur recouvrement — {factures.length} au total
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      {/* Création rapide */}
      {showForm && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-tk-text-muted">Objet</label>
              <input
                type="text"
                value={formObjet}
                onChange={(e) => setFormObjet(e.target.value)}
                placeholder="Objet de la facture"
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
                <option value="">Sélectionner</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-tk-text-muted">Montant HT *</label>
              <input
                type="number"
                value={formMontantHT}
                onChange={(e) => setFormMontantHT(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
              />
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
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={submitting || !formClientId || !formMontantHT}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ReceiptText className="mr-2 h-3.5 w-3.5" />
              )}
              Créer
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
      )}

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
              {s === "TOUS" ? `Toutes (${factures.length})` : STATUT_LABELS[s]}
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
              <TableHead>Client</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Émission</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFactures.map((f) => (
              <TableRow
                key={f.id}
                className="group border-tk-border hover:bg-tk-hover"
              >
                <TableCell>
                  <Link href={`/dashboard/factures/${f.id}`} className="block">
                    <p className="font-mono text-sm font-medium text-tk-text">
                      {f.numero}
                    </p>
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-tk-text-secondary">
                    {f.client.prenom
                      ? `${f.client.prenom} ${f.client.nom}`
                      : f.client.nom}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-tk-text-secondary">
                    {f.objet || "—"}
                  </p>
                </TableCell>
                <TableCell className="text-sm font-semibold text-tk-text text-right">
                  {formatCurrency(f.montantTTC)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        STATUT_STYLES[f.statut]
                      )}
                    >
                      {STATUT_LABELS[f.statut]}
                    </span>
                    {isLate(f) && (
                      <span
                        className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500"
                        title="Échéance dépassée"
                      >
                        EN RETARD
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-tk-text-faint">
                  {formatDate(f.dateEmis)}
                </TableCell>
                <TableCell className="text-xs text-tk-text-faint">
                  {formatDate(f.dateEcheance)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/factures/${f.id}`}>
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
                      onClick={(e) => handleDelete(f.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredFactures.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-tk-text-faint">
                  Aucune facture pour ce filtre
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
