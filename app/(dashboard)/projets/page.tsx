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
  FolderKanban,
  Plus,
  Filter,
  ArrowRight,
  Trash2,
  X,
  Loader2,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ProjetStatut = "EN_ATTENTE" | "EN_COURS" | "EN_PAUSE" | "TERMINE" | "ANNULE";
type ClientType = "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE";

interface Projet {
  id: string;
  titre: string;
  description: string | null;
  statut: ProjetStatut;
  typeClient: ClientType;
  typeTravaux: string | null;
  adresseChantier: string | null;
  budgetPrevu: number | null;
  budgetDepense: number | null;
  dateDebut: string | null;
  dateFin: string | null;
  clientId: string;
  client: { id: string; nom: string; prenom: string | null; type: string };
  jalonsCount: number;
  devisCount: number;
  aidesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientOption {
  id: string;
  nom: string;
  prenom: string | null;
  type: string;
}

const STATUT_COLORS: Record<ProjetStatut, string> = {
  EN_ATTENTE: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  EN_COURS: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  EN_PAUSE: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  TERMINE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ANNULE: "bg-red-500/15 text-red-400 border-red-500/20",
};

const STATUT_LABELS: Record<ProjetStatut, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  EN_PAUSE: "En pause",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

const TYPES_TRAVAUX = [
  "PAC air/eau",
  "PAC air/air",
  "Isolation murs",
  "Isolation combles",
  "Isolation plancher",
  "VMC",
  "Chaudière",
  "Audit énergétique",
  "Rénovation globale",
  "Autre",
];

function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return "\u2014";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso?: string | null): string {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function budgetProgress(prevu: number | null, depense: number | null): number {
  if (!prevu || prevu === 0) return 0;
  return Math.min(100, Math.round(((depense ?? 0) / prevu) * 100));
}

const EMPTY_FORM = {
  titre: "",
  description: "",
  clientId: "",
  typeClient: "PARTICULIER" as ClientType,
  typeTravaux: "",
  adresseChantier: "",
  budgetPrevu: "",
  dateDebut: "",
  dateFin: "",
};

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatut, setFilterStatut] = useState<string>("TOUS");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjets = useCallback(async () => {
    try {
      const res = await fetch("/api/projets");
      if (!res.ok) throw new Error("Erreur lors du chargement des projets");
      const data: Projet[] = await res.json();
      setProjets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) return;
      const data: ClientOption[] = await res.json();
      setClients(data);
    } catch {
      // silently fail — clients dropdown will be empty
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchProjets(), fetchClients()]);
      setLoading(false);
    }
    init();
  }, [fetchProjets, fetchClients]);

  const filteredProjets =
    filterStatut === "TOUS"
      ? projets
      : projets.filter((p) => p.statut === filterStatut);

  const statuts: string[] = ["TOUS", "EN_ATTENTE", "EN_COURS", "EN_PAUSE", "TERMINE", "ANNULE"];

  async function handleCreate() {
    if (!form.titre.trim() || !form.clientId) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      titre: form.titre,
      description: form.description || undefined,
      clientId: form.clientId,
      typeClient: form.typeClient,
      typeTravaux: form.typeTravaux || undefined,
      adresseChantier: form.adresseChantier || undefined,
      budgetPrevu: form.budgetPrevu ? Number(form.budgetPrevu) : undefined,
      dateDebut: form.dateDebut ? new Date(form.dateDebut).toISOString() : undefined,
      dateFin: form.dateFin ? new Date(form.dateFin).toISOString() : undefined,
    };

    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      const created: Projet = await res.json();
      setProjets((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setProjets((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
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
          Vérifiez la connexion à la base de données.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tk-text">Projets</h1>
          <p className="text-tk-text-faint">
            Gérez vos projets de rénovation énergétique &mdash; {projets.length} au total
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="glass rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-tk-text">Nouveau projet</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-tk-text-faint hover:text-tk-text-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Titre *</label>
                  <input
                    type="text"
                    value={form.titre}
                    onChange={(e) => setForm({ ...form, titre: e.target.value })}
                    placeholder="Ex: Rénovation Villa Dupont"
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Client *</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.prenom ? `${c.prenom} ${c.nom}` : c.nom} ({c.type.charAt(0) + c.type.slice(1).toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Type de client</label>
                  <select
                    value={form.typeClient}
                    onChange={(e) => setForm({ ...form, typeClient: e.target.value as ClientType })}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  >
                    <option value="PARTICULIER">Particulier</option>
                    <option value="PROFESSIONNEL">Professionnel</option>
                    <option value="COLLECTIVITE">Collectivité</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Type de travaux</label>
                  <select
                    value={form.typeTravaux}
                    onChange={(e) => setForm({ ...form, typeTravaux: e.target.value })}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  >
                    <option value="">Sélectionner</option>
                    {TYPES_TRAVAUX.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Adresse chantier</label>
                  <input
                    type="text"
                    value={form.adresseChantier}
                    onChange={(e) => setForm({ ...form, adresseChantier: e.target.value })}
                    placeholder="Adresse du chantier"
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Budget prévu</label>
                  <input
                    type="number"
                    value={form.budgetPrevu}
                    onChange={(e) => setForm({ ...form, budgetPrevu: e.target.value })}
                    placeholder="Ex: 45000"
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Date de début</label>
                  <input
                    type="date"
                    value={form.dateDebut}
                    onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-tk-text-muted">Date de fin</label>
                  <input
                    type="date"
                    value={form.dateFin}
                    onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="text-xs font-medium text-tk-text-muted">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Description du projet..."
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text resize-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-3.5 w-3.5" />
                  )}
                  Créer le projet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
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
                ? `Tous (${projets.length})`
                : STATUT_LABELS[s as ProjetStatut]}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-tk-border hover:bg-transparent">
              <TableHead>Projet</TableHead>
              <TableHead>Type travaux</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjets.map((projet) => {
              const progress = budgetProgress(projet.budgetPrevu, projet.budgetDepense);
              return (
                <TableRow
                  key={projet.id}
                  className="group border-tk-border hover:bg-tk-hover"
                >
                  <TableCell>
                    <Link href={`/projets/${projet.id}`} className="block">
                      <p className="font-medium text-tk-text flex items-center gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5 text-tk-text-faint" />
                        {projet.titre}
                      </p>
                      <p className="text-[10px] text-tk-text-faint flex items-center gap-1">
                        <Briefcase className="h-2.5 w-2.5" />
                        {projet.client.prenom
                          ? `${projet.client.prenom} ${projet.client.nom}`
                          : projet.client.nom}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {projet.typeTravaux ? (
                      <span className="rounded-full bg-tk-hover px-2 py-0.5 text-[10px] text-tk-text-muted">
                        {projet.typeTravaux}
                      </span>
                    ) : (
                      <span className="text-xs text-tk-text-faint">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-tk-text-secondary">
                        {formatCurrency(projet.budgetPrevu)}
                      </p>
                      {projet.budgetPrevu && projet.budgetPrevu > 0 && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-16 rounded-full bg-tk-border overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  progress >= 100 ? "bg-red-400" : progress >= 75 ? "bg-amber-400" : "bg-emerald-400"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-tk-text-faint">
                              {formatCurrency(projet.budgetDepense)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        STATUT_COLORS[projet.statut]
                      )}
                    >
                      {STATUT_LABELS[projet.statut]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-tk-text-muted">
                      {formatDate(projet.dateDebut)}
                      {projet.dateFin && (
                        <>
                          {" "}
                          <span className="text-tk-text-faint">&rarr;</span>{" "}
                          {formatDate(projet.dateFin)}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/projets/${projet.id}`}>
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
                        onClick={(e) => handleDelete(projet.id, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProjets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-tk-text-faint">
                  Aucun projet trouvé pour ce filtre
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
