"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Pencil,
  X,
  FolderKanban,
  User,
  Calendar,
  Euro,
  MapPin,
  CheckCircle2,
  Circle,
  FileText,
  Briefcase,
  BadgeEuro,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ────────────────────────────────────────────── */

type ProjetStatut = "EN_ATTENTE" | "EN_COURS" | "EN_PAUSE" | "TERMINE" | "ANNULE";
type ClientType = "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE";
type DevisStatut = "BROUILLON" | "ENVOYE" | "ACCEPTE" | "REFUSE";
type AideStatut = string;

interface Jalon {
  id: string;
  titre: string;
  echeance: string;
  fait: boolean;
}

interface DevisLigne {
  id: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitHT: number;
  tauxTVA: number;
  ordre: number;
}

interface Devis {
  id: string;
  numero: string;
  objet: string | null;
  statut: DevisStatut;
  montantHT: number;
  tauxTVA: number;
  dateEmis: string;
  dateValide: string | null;
  lignes: DevisLigne[];
}

interface Aide {
  id: string;
  type: string;
  nom: string;
  montant: number | null;
  numeroDossier: string | null;
  statut: AideStatut;
  dateDepot: string | null;
  dateAccord: string | null;
  notes: string | null;
}

interface ProjetDetail {
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
  client: {
    id: string;
    nom: string;
    prenom: string | null;
    email: string | null;
    telephone: string | null;
    type: string;
  };
  jalons: Jalon[];
  devis: Devis[];
  aides: Aide[];
  createdAt: string;
  updatedAt: string;
}

interface ClientOption {
  id: string;
  nom: string;
  prenom: string | null;
  type: string;
}

/* ─── Constants ────────────────────────────────────────── */

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

const DEVIS_STATUT_COLORS: Record<DevisStatut, string> = {
  BROUILLON: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  ENVOYE: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  ACCEPTE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  REFUSE: "bg-red-500/15 text-red-400 border-red-500/20",
};

const DEVIS_STATUT_LABELS: Record<DevisStatut, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
};

const TYPE_LABELS: Record<ClientType, string> = {
  PARTICULIER: "Particulier",
  PROFESSIONNEL: "Professionnel",
  COLLECTIVITE: "Collectivité",
};

const AIDE_TYPE_COLORS: Record<string, string> = {
  MAPRIMERENOVV: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  CEE: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  ECO_PTZ: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  AUTRE: "bg-slate-500/15 text-slate-400 border-slate-500/20",
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

/* ─── Helpers ──────────────────────────────────────────── */

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

/* ─── Component ────────────────────────────────────────── */

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjetDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [projet, setProjet] = useState<ProjetDetail | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    titre: "",
    description: "",
    statut: "EN_ATTENTE" as ProjetStatut,
    typeClient: "PARTICULIER" as ClientType,
    typeTravaux: "",
    adresseChantier: "",
    budgetPrevu: "",
    budgetDepense: "",
    dateDebut: "",
    dateFin: "",
    clientId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/projets/${id}`).then((res) => {
        if (!res.ok) throw new Error("Projet introuvable");
        return res.json();
      }),
      fetch("/api/clients").then((res) => res.json()),
    ])
      .then(([projetData, clientsData]: [ProjetDetail, ClientOption[]]) => {
        setProjet(projetData);
        setClients(clientsData);
        populateForm(projetData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  function populateForm(p: ProjetDetail) {
    setForm({
      titre: p.titre,
      description: p.description ?? "",
      statut: p.statut,
      typeClient: p.typeClient,
      typeTravaux: p.typeTravaux ?? "",
      adresseChantier: p.adresseChantier ?? "",
      budgetPrevu: p.budgetPrevu != null ? String(p.budgetPrevu) : "",
      budgetDepense: p.budgetDepense != null ? String(p.budgetDepense) : "",
      dateDebut: p.dateDebut ? p.dateDebut.slice(0, 10) : "",
      dateFin: p.dateFin ? p.dateFin.slice(0, 10) : "",
      clientId: p.clientId,
    });
  }

  async function handleSave() {
    if (!form.titre.trim() || !form.clientId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: form.titre,
          description: form.description || null,
          statut: form.statut,
          typeClient: form.typeClient,
          typeTravaux: form.typeTravaux || null,
          adresseChantier: form.adresseChantier || null,
          budgetPrevu: form.budgetPrevu ? Number(form.budgetPrevu) : null,
          budgetDepense: form.budgetDepense ? Number(form.budgetDepense) : null,
          dateDebut: form.dateDebut ? new Date(form.dateDebut).toISOString() : null,
          dateFin: form.dateFin ? new Date(form.dateFin).toISOString() : null,
          clientId: form.clientId,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      const updated: ProjetDetail = await res.json();
      setProjet(updated);
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
      const res = await fetch(`/api/projets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      router.push("/projets");
    } catch {
      setError("Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  function handleCancel() {
    if (projet) populateForm(projet);
    setEditing(false);
  }

  /* ─── Loading / Error states ───────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-tk-text-faint" />
      </div>
    );
  }

  if (error || !projet) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-red-400 text-sm">{error ?? "Projet introuvable"}</p>
        <Link href="/projets">
          <Button variant="outline" size="sm" className="border-tk-border bg-tk-surface text-tk-text-secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux projets
          </Button>
        </Link>
      </div>
    );
  }

  const progress = budgetProgress(projet.budgetPrevu, projet.budgetDepense);
  const jalonsComplete = projet.jalons.filter((j) => j.fait).length;
  const jalonsTotal = projet.jalons.length;
  const tauxAvancement = jalonsTotal > 0 ? Math.round((jalonsComplete / jalonsTotal) * 100) : 0;

  const inputClass =
    "w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors";
  const labelClass = "text-xs font-medium text-tk-text-muted mb-1.5 block";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projets">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-tk-text-faint hover:text-tk-text hover:bg-tk-hover">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-tk-text">
              {editing ? "Modifier le projet" : projet.titre}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  STATUT_COLORS[editing ? form.statut : projet.statut]
                )}
              >
                {STATUT_LABELS[editing ? form.statut : projet.statut]}
              </span>
              <span className="text-xs text-tk-text-faint">
                Créé le {formatDate(projet.createdAt)} · Modifié le {formatDate(projet.updatedAt)}
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

      {/* ─── Delete confirmation modal ───────────────── */}
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
              <h3 className="text-lg font-semibold text-tk-text mb-2">Supprimer ce projet ?</h3>
              <p className="text-sm text-tk-text-muted mb-6">
                Cette action est irréversible. Le projet{" "}
                <span className="text-tk-text font-medium">{projet.titre}</span> sera
                définitivement supprimé.
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

      {/* ─── Content ─────────────────────────────────── */}
      {editing ? (
        /* ─── Mode édition ──────────────────────────── */
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Titre *</label>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="Titre du projet"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Description du projet..."
                className={cn(inputClass, "resize-none")}
              />
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value as ProjetStatut })}
                className={inputClass}
              >
                <option value="EN_ATTENTE">En attente</option>
                <option value="EN_COURS">En cours</option>
                <option value="EN_PAUSE">En pause</option>
                <option value="TERMINE">Terminé</option>
                <option value="ANNULE">Annulé</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Type de client</label>
              <select
                value={form.typeClient}
                onChange={(e) => setForm({ ...form, typeClient: e.target.value as ClientType })}
                className={inputClass}
              >
                <option value="PARTICULIER">Particulier</option>
                <option value="PROFESSIONNEL">Professionnel</option>
                <option value="COLLECTIVITE">Collectivité</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Client *</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className={inputClass}
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                    {c.prenom ? ` ${c.prenom}` : ""} ({TYPE_LABELS[c.type as ClientType] ?? c.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Type de travaux</label>
              <select
                value={form.typeTravaux}
                onChange={(e) => setForm({ ...form, typeTravaux: e.target.value })}
                className={inputClass}
              >
                <option value="">Sélectionner</option>
                {TYPES_TRAVAUX.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Adresse du chantier</label>
              <input
                type="text"
                value={form.adresseChantier}
                onChange={(e) => setForm({ ...form, adresseChantier: e.target.value })}
                placeholder="Adresse complète"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Budget prévu (EUR)</label>
              <input
                type="number"
                value={form.budgetPrevu}
                onChange={(e) => setForm({ ...form, budgetPrevu: e.target.value })}
                placeholder="Ex: 25000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Budget dépensé (EUR)</label>
              <input
                type="number"
                value={form.budgetDepense}
                onChange={(e) => setForm({ ...form, budgetDepense: e.target.value })}
                placeholder="Ex: 12000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date de début</label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date de fin</label>
              <input
                type="date"
                value={form.dateFin}
                onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        /* ─── Mode lecture ─────────────────────────────── */
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ─── Colonne principale ────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations du projet */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-tk-text-faint" />
                Informations du projet
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={<FolderKanban className="h-4 w-4" />} label="Titre" value={projet.titre} />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Type de travaux" value={projet.typeTravaux ?? "\u2014"} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Adresse du chantier" value={projet.adresseChantier ?? "\u2014"} />
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-tk-text-faint">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Client</p>
                    <Link
                      href={`/contacts/${projet.client.id}`}
                      className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      {projet.client.nom}
                      {projet.client.prenom ? ` ${projet.client.prenom}` : ""}
                    </Link>
                  </div>
                </div>
                {projet.description && (
                  <div className="sm:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-tk-text-faint mb-1">Description</p>
                    <p className="text-sm text-tk-text-secondary whitespace-pre-wrap leading-relaxed">
                      {projet.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Jalons */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-tk-text-faint" />
                Jalons
                {jalonsTotal > 0 && (
                  <span className="text-xs text-tk-text-faint font-normal ml-auto">
                    {jalonsComplete}/{jalonsTotal} terminé(s)
                  </span>
                )}
              </h2>
              {projet.jalons.length === 0 ? (
                <p className="text-sm text-tk-text-faint">Aucun jalon pour ce projet.</p>
              ) : (
                <div className="space-y-2">
                  {projet.jalons.map((jalon) => (
                    <div
                      key={jalon.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-tk-hover/50 transition-colors"
                    >
                      {jalon.fait ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-tk-text-faint flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-sm flex-1",
                          jalon.fait ? "text-tk-text-faint line-through" : "text-tk-text-secondary"
                        )}
                      >
                        {jalon.titre}
                      </span>
                      <span className="text-xs text-tk-text-faint">{formatDate(jalon.echeance)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Devis liés */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-tk-text-faint" />
                Devis liés
                {projet.devis.length > 0 && (
                  <span className="text-xs text-tk-text-faint font-normal ml-auto">
                    {projet.devis.length} devis
                  </span>
                )}
              </h2>
              {projet.devis.length === 0 ? (
                <p className="text-sm text-tk-text-faint">Aucun devis lié à ce projet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-tk-border">
                        <th className="pb-2 text-left text-[10px] uppercase tracking-wider text-tk-text-faint font-medium">
                          N°
                        </th>
                        <th className="pb-2 text-left text-[10px] uppercase tracking-wider text-tk-text-faint font-medium">
                          Objet
                        </th>
                        <th className="pb-2 text-right text-[10px] uppercase tracking-wider text-tk-text-faint font-medium">
                          Montant HT
                        </th>
                        <th className="pb-2 text-right text-[10px] uppercase tracking-wider text-tk-text-faint font-medium">
                          TTC
                        </th>
                        <th className="pb-2 text-center text-[10px] uppercase tracking-wider text-tk-text-faint font-medium">
                          Statut
                        </th>
                        <th className="pb-2 text-right text-[10px] uppercase tracking-wider text-tk-text-faint font-medium">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {projet.devis.map((devis) => {
                        const ttc = devis.montantHT * (1 + devis.tauxTVA / 100);
                        return (
                          <tr key={devis.id} className="border-b border-tk-border/50 last:border-0">
                            <td className="py-2.5">
                              <Link
                                href={`/devis/${devis.id}`}
                                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                              >
                                {devis.numero}
                              </Link>
                            </td>
                            <td className="py-2.5 text-tk-text-secondary">
                              {devis.objet ?? "\u2014"}
                            </td>
                            <td className="py-2.5 text-right text-tk-text-secondary">
                              {formatCurrency(devis.montantHT)}
                            </td>
                            <td className="py-2.5 text-right text-tk-text-secondary">
                              {formatCurrency(ttc)}
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                  DEVIS_STATUT_COLORS[devis.statut]
                                )}
                              >
                                {DEVIS_STATUT_LABELS[devis.statut]}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-tk-text-faint text-xs">
                              {formatDate(devis.dateEmis)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Aides financières */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4 flex items-center gap-2">
                <BadgeEuro className="h-4 w-4 text-tk-text-faint" />
                Aides financières
                {projet.aides.length > 0 && (
                  <span className="text-xs text-tk-text-faint font-normal ml-auto">
                    {projet.aides.length} aide(s)
                  </span>
                )}
              </h2>
              {projet.aides.length === 0 ? (
                <p className="text-sm text-tk-text-faint">Aucune aide financière enregistrée.</p>
              ) : (
                <div className="space-y-3">
                  {projet.aides.map((aide) => (
                    <div
                      key={aide.id}
                      className="flex items-center gap-3 rounded-lg border border-tk-border/50 px-4 py-3"
                    >
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                          AIDE_TYPE_COLORS[aide.type] ?? AIDE_TYPE_COLORS.AUTRE
                        )}
                      >
                        {aide.type.replace(/_/g, " ")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tk-text-secondary truncate">{aide.nom}</p>
                        {aide.numeroDossier && (
                          <p className="text-xs text-tk-text-faint">Dossier : {aide.numeroDossier}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-tk-text">
                          {formatCurrency(aide.montant)}
                        </p>
                        <p className="text-[10px] text-tk-text-faint uppercase">{aide.statut}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Barre latérale ──────────────────────────── */}
          <div className="space-y-6">
            {/* Statut & Budget */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4 flex items-center gap-2">
                <Euro className="h-4 w-4 text-tk-text-faint" />
                Statut & Budget
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint mb-1">Statut</p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      STATUT_COLORS[projet.statut]
                    )}
                  >
                    {STATUT_LABELS[projet.statut]}
                  </span>
                </div>
                <InfoRow
                  icon={<Euro className="h-4 w-4" />}
                  label="Budget prévu"
                  value={formatCurrency(projet.budgetPrevu)}
                />
                <InfoRow
                  icon={<Euro className="h-4 w-4" />}
                  label="Budget dépensé"
                  value={formatCurrency(projet.budgetDepense)}
                />
                {/* Progress bar */}
                {projet.budgetPrevu && projet.budgetPrevu > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">
                        Consommation budget
                      </p>
                      <span className="text-xs text-tk-text-secondary font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-tk-hover overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          progress > 90
                            ? "bg-red-500"
                            : progress > 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {/* Taux d'avancement */}
                {jalonsTotal > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">
                        Avancement
                      </p>
                      <span className="text-xs text-tk-text-secondary font-medium">
                        {tauxAvancement}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-tk-hover overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${tauxAvancement}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Client */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-tk-text-faint" />
                Client
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Nom</p>
                  <Link
                    href={`/contacts/${projet.client.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    {projet.client.nom}
                    {projet.client.prenom ? ` ${projet.client.prenom}` : ""}
                  </Link>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Email</p>
                  <p className="text-sm text-tk-text-secondary">
                    {projet.client.email ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Téléphone</p>
                  <p className="text-sm text-tk-text-secondary">
                    {projet.client.telephone ?? "\u2014"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint mb-1">Type</p>
                  <span className="inline-block rounded-full bg-tk-hover px-2.5 py-1 text-xs text-tk-text-secondary">
                    {TYPE_LABELS[projet.client.type as ClientType] ?? projet.client.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-tk-text mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-tk-text-faint" />
                Dates
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Date de début</p>
                  <p className="text-sm text-tk-text-secondary">{formatDate(projet.dateDebut)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Date de fin</p>
                  <p className="text-sm text-tk-text-secondary">{formatDate(projet.dateFin)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Créé le</p>
                  <p className="text-sm text-tk-text-secondary">{formatDate(projet.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">Dernière modification</p>
                  <p className="text-sm text-tk-text-secondary">{formatDate(projet.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ligne d'information réutilisable */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-tk-text-faint">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-tk-text-faint">{label}</p>
        <p className="text-sm text-tk-text-secondary">{value}</p>
      </div>
    </div>
  );
}
