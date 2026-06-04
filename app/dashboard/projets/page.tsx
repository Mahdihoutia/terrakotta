"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  Search,
  SlidersHorizontal,
  ArrowRight,
  Trash2,
  Copy,
  X,
  Loader2,
  Briefcase,
  FileText,
  Sparkles,
  Calculator,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { motion, AnimatePresence } from "framer-motion";
import ProjetsKanban from "@/components/dashboard/ProjetsKanban";

type ProjetStatut = "EN_ATTENTE" | "EN_COURS" | "EN_PAUSE" | "TERMINE" | "ANNULE";
type ClientType = "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE";
type CategorieCible =
  | "PARTICULIER"
  | "RESIDENTIEL_COLLECTIF"
  | "TERTIAIRE"
  | "INDUSTRIE"
  | "AGRICULTURE";

const CATEGORIE_CIBLE_LABELS: Record<CategorieCible, string> = {
  PARTICULIER: "Particulier",
  RESIDENTIEL_COLLECTIF: "Résidentiel collectif",
  TERTIAIRE: "Tertiaire",
  INDUSTRIE: "Industrie",
  AGRICULTURE: "Agriculture",
};

interface Projet {
  id: string;
  titre: string;
  description: string | null;
  statut: ProjetStatut;
  typeClient: ClientType;
  categorieCible: CategorieCible;
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

interface AdvancedFilters {
  categorieCible: CategorieCible | "";
  clientId: string;
  budgetMin: string;
  budgetMax: string;
  dateDebutFrom: string;
  dateDebutTo: string;
}

const EMPTY_ADV_FILTERS: AdvancedFilters = {
  categorieCible: "",
  clientId: "",
  budgetMin: "",
  budgetMax: "",
  dateDebutFrom: "",
  dateDebutTo: "",
};

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

/** CEE fiches disponibles pour simulation — kWh cumac calculés côté client */
const CEE_FICHES = [
  { id: "BAR-TH-171", nom: "PAC air/eau (maison indiv.)", secteur: "Résidentiel" },
  { id: "BAR-TH-159", nom: "PAC air/eau (collectif)", secteur: "Résidentiel" },
  { id: "BAR-EN-101", nom: "Isolation combles / toiture", secteur: "Résidentiel" },
  { id: "BAR-EN-102", nom: "Isolation murs (ITE/ITI)", secteur: "Résidentiel" },
  { id: "BAR-EN-103", nom: "Isolation plancher bas", secteur: "Résidentiel" },
  { id: "BAT-TH-116", nom: "Système de régulation", secteur: "Tertiaire" },
  { id: "BAT-TH-134", nom: "VEV sur ventilateur", secteur: "Tertiaire" },
  { id: "BAT-TH-139", nom: "Récup. chaleur sur groupe froid", secteur: "Tertiaire" },
  { id: "BAT-TH-142", nom: "Déstratificateur d'air", secteur: "Tertiaire" },
  { id: "BAT-TH-163", nom: "PAC air/eau ou eau/eau", secteur: "Tertiaire" },
] as const;

interface AideCEE {
  fiche: string;
  nom: string;
  kwhCumac: number;
  prixUnitaire: number; // €/MWh cumac (ex: 8)
  montant: number;
}

interface DocumentOption {
  id: string;
  titre: string;
  reference: string;
  type: string;
  projetId: string | null;
}

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
  categorieCible: "" as CategorieCible | "",
  typeTravaux: "",
  adresseChantier: "",
  budgetPrevu: "",
  dateDebut: "",
  dateFin: "",
};

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [documents, setDocuments] = useState<DocumentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatut, setFilterStatut] = useLocalStorage<string>(
    "kilowater:projets:filterStatut",
    "TOUS"
  );
  const [viewMode, setViewMode] = useLocalStorage<"liste" | "kanban">(
    "kilowater:projets:viewMode",
    "liste"
  );
  const [advFilters, setAdvFilters] = useLocalStorage<AdvancedFilters>(
    "kilowater:projets:filters",
    EMPTY_ADV_FILTERS,
  );
  const [searchInput, setSearchInput] = useLocalStorage<string>(
    "kilowater:projets:search",
    "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Brouillon édité dans le popover — les changements ne sont commités à
  // `advFilters` (et donc envoyés au serveur) qu'au clic sur "Appliquer".
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(advFilters);
  const filtersPopoverRef = useRef<HTMLDivElement | null>(null);

  // À chaque ouverture du popover, on resynchronise le brouillon depuis l'état
  // appliqué (annulant les modifications non-appliquées de la session précédente).
  useEffect(() => {
    if (filtersOpen) setDraftFilters(advFilters);
  }, [filtersOpen, advFilters]);

  // Debounce search input (250ms) avant de déclencher un fetch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Click outside / Escape pour fermer le popover Filtres
  useEffect(() => {
    if (!filtersOpen) return;
    function onClick(e: MouseEvent) {
      if (filtersPopoverRef.current && !filtersPopoverRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFiltersOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [aidesCEE, setAidesCEE] = useState<AideCEE[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const buildProjetsQuery = useCallback(
    (statut: string, q: string, adv: AdvancedFilters): string => {
      const params = new URLSearchParams();
      if (statut && statut !== "TOUS") params.set("statut", statut);
      if (q.trim()) params.set("q", q.trim());
      if (adv.categorieCible) params.set("categorieCible", adv.categorieCible);
      if (adv.clientId) params.set("clientId", adv.clientId);
      if (adv.budgetMin) params.set("budgetMin", adv.budgetMin);
      if (adv.budgetMax) params.set("budgetMax", adv.budgetMax);
      if (adv.dateDebutFrom) {
        params.set("dateDebutFrom", new Date(adv.dateDebutFrom).toISOString());
      }
      if (adv.dateDebutTo) {
        params.set("dateDebutTo", new Date(adv.dateDebutTo).toISOString());
      }
      const qs = params.toString();
      return qs ? `/api/projets?${qs}` : "/api/projets";
    },
    [],
  );

  const fetchProjets = useCallback(async () => {
    try {
      const url = buildProjetsQuery(filterStatut, debouncedSearch, advFilters);
      const res = await fetch(url);
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const detail = payload?.message ?? payload?.error ?? `HTTP ${res.status}`;
        throw new Error(`Chargement des projets impossible — ${detail}`);
      }
      const data: Projet[] = await res.json();
      setProjets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }, [buildProjetsQuery, filterStatut, debouncedSearch, advFilters]);

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

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) return;
      const data: DocumentOption[] = await res.json();
      setDocuments(data);
    } catch {
      // silently fail
    }
  }, []);

  // Initial : clients + documents (chargés une seule fois)
  useEffect(() => {
    Promise.all([fetchClients(), fetchDocuments()]);
  }, [fetchClients, fetchDocuments]);

  // Projets : re-fetch à chaque changement de filtre (debounce sur search déjà appliqué)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProjets().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchProjets]);

  // CEE totals (live simulation)
  const totalKwhCumac = aidesCEE.reduce((s, a) => s + (a.kwhCumac || 0), 0);
  const totalAidesEuros = aidesCEE.reduce((s, a) => s + (a.montant || 0), 0);

  function addAideCEE() {
    setAidesCEE((prev) => [
      ...prev,
      { fiche: "BAR-TH-171", nom: "PAC air/eau (maison indiv.)", kwhCumac: 0, prixUnitaire: 8, montant: 0 },
    ]);
  }

  function updateAideCEE(index: number, patch: Partial<AideCEE>) {
    setAidesCEE((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        const next = { ...a, ...patch };
        // If fiche changed, update its display name
        if (patch.fiche) {
          const f = CEE_FICHES.find((x) => x.id === patch.fiche);
          if (f) next.nom = f.nom;
        }
        // Recompute € = kWh cumac × (prixUnitaire / 1000)  [prix en €/MWh cumac]
        next.montant = Math.round((next.kwhCumac * next.prixUnitaire) / 1000);
        return next;
      }),
    );
  }

  function removeAideCEE(index: number) {
    setAidesCEE((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  // Le serveur applique désormais tous les filtres ; on liste tel quel.
  const filteredProjets = projets;

  const statuts: string[] = ["TOUS", "EN_ATTENTE", "EN_COURS", "EN_PAUSE", "TERMINE", "ANNULE"];

  /** Nombre de filtres avancés actifs (hors statut, hors search). */
  const activeAdvCount = useMemo(() => {
    let n = 0;
    if (advFilters.categorieCible) n++;
    if (advFilters.clientId) n++;
    if (advFilters.budgetMin) n++;
    if (advFilters.budgetMax) n++;
    if (advFilters.dateDebutFrom) n++;
    if (advFilters.dateDebutTo) n++;
    return n;
  }, [advFilters]);

  const hasAnyFilter =
    activeAdvCount > 0 || filterStatut !== "TOUS" || debouncedSearch.trim().length > 0;

  /** Nombre de filtres en cours d'édition (brouillon) — pour le footer du popover. */
  const draftCount = useMemo(() => {
    let n = 0;
    if (draftFilters.categorieCible) n++;
    if (draftFilters.clientId) n++;
    if (draftFilters.budgetMin) n++;
    if (draftFilters.budgetMax) n++;
    if (draftFilters.dateDebutFrom) n++;
    if (draftFilters.dateDebutTo) n++;
    return n;
  }, [draftFilters]);

  /** Y a-t-il des modifications non-appliquées dans le popover ? */
  const draftDirty = useMemo(
    () =>
      draftFilters.categorieCible !== advFilters.categorieCible ||
      draftFilters.clientId !== advFilters.clientId ||
      draftFilters.budgetMin !== advFilters.budgetMin ||
      draftFilters.budgetMax !== advFilters.budgetMax ||
      draftFilters.dateDebutFrom !== advFilters.dateDebutFrom ||
      draftFilters.dateDebutTo !== advFilters.dateDebutTo,
    [draftFilters, advFilters],
  );

  function applyDraftFilters() {
    setAdvFilters(draftFilters);
    setFiltersOpen(false);
  }

  function resetAdvFilters() {
    // Réinitialise immédiatement (clear all) et ferme — convention SaaS.
    setDraftFilters(EMPTY_ADV_FILTERS);
    setAdvFilters(EMPTY_ADV_FILTERS);
    setFiltersOpen(false);
  }

  function resetAllFilters() {
    setAdvFilters(EMPTY_ADV_FILTERS);
    setSearchInput("");
    setFilterStatut("TOUS");
  }

  async function handleCreate() {
    if (submitting) return;
    if (!form.titre.trim()) {
      toast.error("Le titre du projet est requis.");
      return;
    }
    if (!form.clientId) {
      toast.error("Sélectionnez un client avant de créer le projet.");
      return;
    }
    if (!form.categorieCible) {
      toast.error("Sélectionnez une catégorie de cible.");
      return;
    }
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      titre: form.titre,
      description: form.description || undefined,
      clientId: form.clientId,
      typeClient: form.typeClient,
      categorieCible: form.categorieCible,
      typeTravaux: form.typeTravaux || undefined,
      adresseChantier: form.adresseChantier || undefined,
      budgetPrevu: form.budgetPrevu ? Number(form.budgetPrevu) : undefined,
      dateDebut: form.dateDebut ? new Date(form.dateDebut).toISOString() : undefined,
      dateFin: form.dateFin ? new Date(form.dateFin).toISOString() : undefined,
      documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      aides: aidesCEE.length > 0 ? aidesCEE : undefined,
    };

    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        await showApiError(res, "Création du projet impossible");
        return;
      }
      const created: Projet = await res.json();
      setProjets((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setSelectedDocIds([]);
      setAidesCEE([]);
      setShowForm(false);
      toast.success("Projet créé");
      // Refresh documents list to reflect new links
      fetchDocuments();
    } catch (err) {
      showNetworkError(err, "Création du projet impossible");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        "Supprimer ce projet et ses documents associés ? Il sera placé dans la corbeille.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/projets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression du projet impossible");
        return;
      }
      setProjets((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      showNetworkError(err, "Suppression du projet impossible");
    }
  }

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  async function handleDuplicate(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (duplicatingId) return;
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/projets/${id}/duplicate`, { method: "POST" });
      if (!res.ok) {
        await showApiError(res, "Duplication impossible");
        return;
      }
      const created: { id: string; titre: string } = await res.json();
      toast.success(`Projet dupliqué — « ${created.titre} »`);
      // Recharge la liste pour voir la copie en tête (updatedAt récent).
      const listRes = await fetch("/api/projets");
      if (listRes.ok) setProjets(await listRes.json());
    } catch (err) {
      showNetworkError(err, "Duplication impossible");
    } finally {
      setDuplicatingId(null);
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
                  <label className="text-xs font-medium text-tk-text-muted">
                    Catégorie de cible <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.categorieCible}
                    onChange={(e) =>
                      setForm({ ...form, categorieCible: e.target.value as CategorieCible | "" })
                    }
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  >
                    <option value="">Sélectionner…</option>
                    {(Object.keys(CATEGORIE_CIBLE_LABELS) as CategorieCible[]).map((c) => (
                      <option key={c} value={c}>
                        {CATEGORIE_CIBLE_LABELS[c]}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-tk-text-faint">
                    Conditionne l&apos;éligibilité MaPrimeRénov&apos; (particulier uniquement).
                  </p>
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

              {/* Documents liés */}
              <div className="mt-6 rounded-xl border border-tk-border bg-tk-surface/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-tk-text-muted" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-tk-text">Documents liés</h4>
                    {selectedDocIds.length > 0 && (
                      <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-400">
                        {selectedDocIds.length} sélectionné{selectedDocIds.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-tk-text-faint">Devis, notes, rapports, audits…</span>
                </div>
                {documents.length === 0 ? (
                  <p className="text-xs text-tk-text-faint">Aucun document disponible. Créez-en depuis l&apos;onglet Documents.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {documents.map((doc) => {
                      const checked = selectedDocIds.includes(doc.id);
                      const alreadyLinked = doc.projetId && doc.projetId !== null;
                      return (
                        <label
                          key={doc.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                            checked
                              ? "border-orange-500/30 bg-orange-500/5"
                              : "border-tk-border bg-tk-surface hover:bg-tk-hover",
                            alreadyLinked && !checked && "opacity-50",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDoc(doc.id)}
                            className="h-3.5 w-3.5 accent-orange-500"
                          />
                          <span className="font-mono text-[10px] text-tk-text-faint">{doc.reference}</span>
                          <span className="flex-1 truncate text-tk-text-secondary">{doc.titre}</span>
                          <span className="rounded-full bg-tk-hover px-1.5 py-0.5 text-[9px] uppercase text-tk-text-muted">
                            {doc.type.replace("_", " ")}
                          </span>
                          {alreadyLinked && (
                            <span className="text-[9px] text-amber-400">déjà lié</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Simulation CEE */}
              <div className="mt-4 rounded-xl border border-tk-border bg-tk-surface/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-tk-text">Aides CEE — Simulation par fiche</h4>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAideCEE}
                    className="h-7 border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Ajouter une fiche
                  </Button>
                </div>

                {aidesCEE.length === 0 ? (
                  <p className="text-xs text-tk-text-faint">
                    Aucune fiche CEE ajoutée. Cliquez sur « Ajouter une fiche » pour simuler les kWh cumac et la prime associée.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {aidesCEE.map((aide, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-12 gap-2 rounded-lg border border-tk-border bg-tk-surface p-2"
                      >
                        <select
                          value={aide.fiche}
                          onChange={(e) => updateAideCEE(i, { fiche: e.target.value })}
                          className="col-span-4 rounded-md border border-tk-border bg-tk-surface px-2 py-1.5 text-xs text-tk-text"
                        >
                          {CEE_FICHES.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.id} — {f.nom}
                            </option>
                          ))}
                        </select>
                        <div className="col-span-3 flex items-center gap-1">
                          <input
                            type="number"
                            value={aide.kwhCumac || ""}
                            onChange={(e) => updateAideCEE(i, { kwhCumac: Number(e.target.value) || 0 })}
                            placeholder="kWh cumac"
                            className="w-full rounded-md border border-tk-border bg-tk-surface px-2 py-1.5 text-xs text-tk-text"
                          />
                          <span className="text-[10px] text-tk-text-faint">kWhc</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            value={aide.prixUnitaire || ""}
                            onChange={(e) => updateAideCEE(i, { prixUnitaire: Number(e.target.value) || 0 })}
                            placeholder="€/MWhc"
                            className="w-full rounded-md border border-tk-border bg-tk-surface px-2 py-1.5 text-xs text-tk-text"
                          />
                          <span className="text-[10px] text-tk-text-faint">€/MWhc</span>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1 rounded-md bg-emerald-500/10 px-2 text-xs font-semibold text-emerald-400">
                          <Calculator className="h-3 w-3" />
                          {formatCurrency(aide.montant)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAideCEE(i)}
                          className="col-span-1 flex items-center justify-center rounded-md text-tk-text-faint hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Totaux */}
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/5 px-3 py-2 text-xs">
                      <span className="text-tk-text-muted">
                        Total : <strong className="text-tk-text">{new Intl.NumberFormat("fr-FR").format(totalKwhCumac)}</strong> kWh cumac
                      </span>
                      <span className="text-sm font-semibold text-emerald-400">
                        {formatCurrency(totalAidesEuros)}
                      </span>
                    </div>
                  </div>
                )}
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

      {/* Ligne 1 : Search + bouton Filtres avancés */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px] max-w-[480px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tk-text-faint"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher un projet, un client, une adresse…"
            aria-label="Rechercher dans les projets"
            className="focus-ring w-full rounded-lg border border-tk-border bg-tk-surface py-1.5 pl-9 pr-8 text-sm text-tk-text placeholder:text-tk-text-faint"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-tk-text-faint transition-colors hover:bg-tk-hover hover:text-tk-text"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative" ref={filtersPopoverRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            className={cn(
              "border-tk-border bg-tk-surface text-xs text-tk-text-secondary hover:bg-tk-hover",
              activeAdvCount > 0 && "border-tk-accent/40 text-tk-text",
            )}
          >
            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
            Filtres
            {activeAdvCount > 0 && (
              <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-tk-accent px-1 text-[10px] font-semibold text-white">
                {activeAdvCount}
              </span>
            )}
          </Button>
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                role="dialog"
                aria-label="Filtres avancés"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="glass absolute right-0 z-30 mt-2 w-[340px] rounded-xl border border-tk-border p-4 shadow-xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-tk-text-faint">
                    Filtres avancés
                  </p>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    aria-label="Fermer les filtres"
                    className="rounded p-1 text-tk-text-faint hover:bg-tk-hover hover:text-tk-text"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyDraftFilters();
                  }}
                >
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-tk-text-faint">
                        Catégorie cible
                      </label>
                      <select
                        value={draftFilters.categorieCible}
                        onChange={(e) =>
                          setDraftFilters({
                            ...draftFilters,
                            categorieCible: e.target.value as CategorieCible | "",
                          })
                        }
                        className="focus-ring w-full rounded-lg border border-tk-border bg-tk-surface px-2 py-1.5 text-sm text-tk-text"
                      >
                        <option value="">Toutes</option>
                        {(Object.keys(CATEGORIE_CIBLE_LABELS) as CategorieCible[]).map((k) => (
                          <option key={k} value={k}>
                            {CATEGORIE_CIBLE_LABELS[k]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-tk-text-faint">
                        Client
                      </label>
                      <select
                        value={draftFilters.clientId}
                        onChange={(e) =>
                          setDraftFilters({ ...draftFilters, clientId: e.target.value })
                        }
                        className="focus-ring w-full rounded-lg border border-tk-border bg-tk-surface px-2 py-1.5 text-sm text-tk-text"
                      >
                        <option value="">Tous les clients</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-tk-text-faint">
                        Budget prévu (€)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={draftFilters.budgetMin}
                          onChange={(e) =>
                            setDraftFilters({ ...draftFilters, budgetMin: e.target.value })
                          }
                          placeholder="Min"
                          aria-label="Budget minimum"
                          className="focus-ring rounded-lg border border-tk-border bg-tk-surface px-2 py-1.5 text-sm text-tk-text placeholder:text-tk-text-faint"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={draftFilters.budgetMax}
                          onChange={(e) =>
                            setDraftFilters({ ...draftFilters, budgetMax: e.target.value })
                          }
                          placeholder="Max"
                          aria-label="Budget maximum"
                          className="focus-ring rounded-lg border border-tk-border bg-tk-surface px-2 py-1.5 text-sm text-tk-text placeholder:text-tk-text-faint"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-wider text-tk-text-faint">
                        Date de début
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={draftFilters.dateDebutFrom}
                          onChange={(e) =>
                            setDraftFilters({ ...draftFilters, dateDebutFrom: e.target.value })
                          }
                          aria-label="Date de début minimale"
                          className="focus-ring rounded-lg border border-tk-border bg-tk-surface px-2 py-1.5 text-sm text-tk-text"
                        />
                        <input
                          type="date"
                          value={draftFilters.dateDebutTo}
                          onChange={(e) =>
                            setDraftFilters({ ...draftFilters, dateDebutTo: e.target.value })
                          }
                          aria-label="Date de début maximale"
                          className="focus-ring rounded-lg border border-tk-border bg-tk-surface px-2 py-1.5 text-sm text-tk-text"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-tk-border pt-3">
                    <button
                      type="button"
                      onClick={resetAdvFilters}
                      disabled={activeAdvCount === 0 && draftCount === 0}
                      className="text-xs text-tk-text-faint transition-colors hover:text-tk-text disabled:opacity-40"
                    >
                      Réinitialiser
                    </button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!draftDirty}
                      className="text-xs"
                      title={
                        draftDirty
                          ? "Appliquer les filtres"
                          : "Aucune modification à appliquer"
                      }
                    >
                      Appliquer
                      {draftCount > 0 && (
                        <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-semibold">
                          {draftCount}
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Ligne 2 : Chips statut + view toggle */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
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
        <div className="inline-flex shrink-0 rounded-lg border border-tk-border bg-tk-surface p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("liste")}
            aria-pressed={viewMode === "liste"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              viewMode === "liste"
                ? "bg-tk-hover text-tk-text"
                : "text-tk-text-muted hover:text-tk-text"
            )}
          >
            <ListIcon className="h-3.5 w-3.5" />
            Liste
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            aria-pressed={viewMode === "kanban"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              viewMode === "kanban"
                ? "bg-tk-hover text-tk-text"
                : "text-tk-text-muted hover:text-tk-text"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* Kanban view */}
      {viewMode === "kanban" && (
        <ProjetsKanban
          projets={filteredProjets.map((p) => ({
            id: p.id,
            titre: p.titre,
            statut: p.statut,
            typeTravaux: p.typeTravaux,
            budgetPrevu: p.budgetPrevu,
            updatedAt: p.updatedAt,
            client: {
              id: p.client.id,
              nom: p.client.nom,
              prenom: p.client.prenom,
            },
          }))}
          onStatutChange={(id, statut) =>
            setProjets((prev) =>
              prev.map((p) => (p.id === id ? { ...p, statut } : p))
            )
          }
        />
      )}

      {/* Table */}
      {viewMode === "liste" && (
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
                    <Link href={`/dashboard/projets/${projet.id}`} className="block">
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
                      <Link href={`/dashboard/projets/${projet.id}`}>
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
                        className="h-7 w-7 text-tk-text-muted hover:text-tk-text"
                        onClick={(e) => handleDuplicate(projet.id, e)}
                        disabled={duplicatingId === projet.id}
                        title="Dupliquer le projet (bâti, systèmes, variantes)"
                        aria-label="Dupliquer le projet"
                      >
                        {duplicatingId === projet.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
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
                  <div className="flex flex-col items-center gap-2">
                    <span>
                      {hasAnyFilter
                        ? "Aucun projet ne correspond aux filtres."
                        : "Aucun projet pour le moment."}
                    </span>
                    {hasAnyFilter && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="text-xs text-tk-accent transition-opacity hover:opacity-80"
                      >
                        Réinitialiser tous les filtres
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
