"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Layers,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Filter,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { MATERIAU_CATEGORIES } from "@/lib/validations/materiau";

interface Materiau {
  id: string;
  nom: string;
  categorie: string;
  marque: string | null;
  reference: string | null;
  conductivite: number;
  masseVolumique: number;
  capaciteThermique: number;
  resistanceVapeur: number | null;
  resistanceFixe: number | null;
  carboneACV: number | null;
  carboneFinDeVie: number | null;
  origineFdes: string | null;
  source: string | null;
  notes: string | null;
}

interface FormState {
  nom: string;
  categorie: string;
  marque: string;
  reference: string;
  conductivite: string;
  masseVolumique: string;
  capaciteThermique: string;
  resistanceVapeur: string;
  resistanceFixe: string;
  carboneACV: string;
  source: string;
  notes: string;
}

function emptyForm(): FormState {
  return {
    nom: "",
    categorie: "ISOLANT",
    marque: "",
    reference: "",
    conductivite: "",
    masseVolumique: "",
    capaciteThermique: "",
    resistanceVapeur: "",
    resistanceFixe: "",
    carboneACV: "",
    source: "",
    notes: "",
  };
}

const CATEGORIE_LABELS: Record<string, string> = {
  STRUCTURE: "Structure",
  ISOLANT: "Isolant",
  FINITION: "Finition",
  VITRAGE: "Vitrage",
  LAME_AIR: "Lame d'air",
  MEMBRANE: "Membrane",
  AUTRE: "Autre",
};

const CATEGORIE_COLORS: Record<string, string> = {
  STRUCTURE: "bg-stone-100 text-stone-800 border-stone-200",
  ISOLANT: "bg-emerald-50 text-emerald-800 border-emerald-200",
  FINITION: "bg-amber-50 text-amber-800 border-amber-200",
  VITRAGE: "bg-sky-50 text-sky-800 border-sky-200",
  LAME_AIR: "bg-slate-50 text-slate-700 border-slate-200",
  MEMBRANE: "bg-violet-50 text-violet-800 border-violet-200",
  AUTRE: "bg-muted text-muted-foreground",
};

interface Filters {
  categorie: string;
  search: string;
}

export default function MateriauxPage() {
  const [materiaux, setMateriaux] = useState<Materiau[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [filters, setFilters] = useLocalStorage<Filters>(
    "terrakotta:materiaux:filters",
    { categorie: "TOUTES", search: "" },
  );

  const [editing, setEditing] = useState<Materiau | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMigrationPending(false);
    try {
      const res = await fetch("/api/materiaux", { cache: "no-store" });
      if (res.status === 503) {
        setMigrationPending(true);
        return;
      }
      if (!res.ok) {
        await showApiError(res, "Chargement de la bibliothèque impossible");
        return;
      }
      const data = (await res.json()) as Materiau[];
      setMateriaux(data);
    } catch (err) {
      showNetworkError(err, "Chargement de la bibliothèque impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return materiaux.filter((m) => {
      if (filters.categorie !== "TOUTES" && m.categorie !== filters.categorie) return false;
      if (q.length === 0) return true;
      return (
        m.nom.toLowerCase().includes(q) ||
        (m.marque ?? "").toLowerCase().includes(q) ||
        (m.reference ?? "").toLowerCase().includes(q)
      );
    });
  }, [materiaux, filters]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setCreating(true);
  }

  function openEdit(m: Materiau) {
    setCreating(false);
    setEditing(m);
    setForm({
      nom: m.nom,
      categorie: m.categorie,
      marque: m.marque ?? "",
      reference: m.reference ?? "",
      conductivite: String(m.conductivite),
      masseVolumique: String(m.masseVolumique),
      capaciteThermique: String(m.capaciteThermique),
      resistanceVapeur: m.resistanceVapeur != null ? String(m.resistanceVapeur) : "",
      resistanceFixe: m.resistanceFixe != null ? String(m.resistanceFixe) : "",
      carboneACV: m.carboneACV != null ? String(m.carboneACV) : "",
      source: m.source ?? "",
      notes: m.notes ?? "",
    });
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(emptyForm());
  }

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const lambda = parseFloat(form.conductivite);
    const rho = parseFloat(form.masseVolumique);
    const c = parseFloat(form.capaciteThermique);
    if (Number.isNaN(lambda) || lambda < 0) {
      toast.error("Conductivité λ invalide");
      return;
    }
    if (Number.isNaN(rho) || rho <= 0) {
      toast.error("Masse volumique ρ invalide");
      return;
    }
    if (Number.isNaN(c) || c < 0) {
      toast.error("Capacité thermique c invalide");
      return;
    }

    const optNum = (v: string) => {
      const t = v.trim();
      if (t === "") return null;
      const n = parseFloat(t);
      return Number.isNaN(n) ? null : n;
    };

    setSaving(true);
    const payload = {
      nom: form.nom.trim(),
      categorie: form.categorie,
      marque: form.marque.trim() || null,
      reference: form.reference.trim() || null,
      conductivite: lambda,
      masseVolumique: rho,
      capaciteThermique: c,
      resistanceVapeur: optNum(form.resistanceVapeur),
      resistanceFixe: optNum(form.resistanceFixe),
      carboneACV: optNum(form.carboneACV),
      source: form.source.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      const isEdit = !!editing;
      const url = isEdit ? `/api/materiaux/${editing!.id}` : "/api/materiaux";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        await showApiError(res, isEdit ? "Mise à jour impossible" : "Création impossible");
        return;
      }
      toast.success(isEdit ? "Matériau mis à jour" : "Matériau créé");
      closeForm();
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m: Materiau) {
    if (!confirm(`Supprimer "${m.nom}" ?\n\nIl restera disponible dans la corbeille pendant 30 jours.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/materiaux/${m.id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      toast.success("Matériau déplacé dans la corbeille");
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    }
  }

  async function handleSeed() {
    if (!confirm("Importer la bibliothèque initiale (~80 matériaux courants depuis ADEME / DTU / FDES) ?")) {
      return;
    }
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-materiaux", { method: "POST" });
      if (!res.ok) {
        await showApiError(res, "Import impossible");
        return;
      }
      const data = (await res.json()) as { created: number; skipped: number };
      toast.success(`Bibliothèque importée — ${data.created} ajoutés, ${data.skipped} déjà présents.`);
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-700">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Bibliothèque de matériaux</h1>
            <p className="text-xs text-muted-foreground">
              {materiaux.length} matériau{materiaux.length > 1 ? "x" : ""} · Base thermique pour le composeur de parois
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {materiaux.length === 0 && !loading && !migrationPending && (
            <Button size="sm" variant="outline" onClick={handleSeed} disabled={seeding}>
              {seeding ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}
              Importer la base initiale
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Nouveau matériau
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Rechercher par nom, marque, référence…"
            className="w-full rounded-md border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filters.categorie}
            onChange={(e) => setFilters({ ...filters, categorie: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="TOUTES">Toutes catégories</option>
            {MATERIAU_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>
            ))}
          </select>
        </div>
      </div>

      {migrationPending && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Migration de base de données requise
            </p>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
              Exécute <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">prisma/migrations/_manual/2026_04_28_add_bibliotheque_materiaux.sql</code> dans Supabase, puis recharge.
            </p>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium">Aucun matériau</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                {materiaux.length === 0
                  ? "Importe la base initiale (ADEME / DTU / FDES) ou crée un matériau personnalisé."
                  : "Aucun résultat avec ces filtres."}
              </p>
              {materiaux.length === 0 && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleSeed} disabled={seeding}>
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Importer la base
                  </Button>
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Créer un matériau
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-medium leading-snug">{m.nom}</p>
                      <Badge variant="outline" className={cn("text-[10px] shrink-0", CATEGORIE_COLORS[m.categorie])}>
                        {CATEGORIE_LABELS[m.categorie] ?? m.categorie}
                      </Badge>
                      {m.marque && (
                        <span className="text-xs text-muted-foreground">· {m.marque}</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>λ <span className="font-mono text-foreground">{m.conductivite.toFixed(3)}</span> W/m·K</span>
                      <span>ρ <span className="font-mono text-foreground">{m.masseVolumique}</span> kg/m³</span>
                      <span>c <span className="font-mono text-foreground">{m.capaciteThermique}</span> J/kg·K</span>
                      {m.carboneACV != null && (
                        <span>CO₂ <span className="font-mono text-foreground">{m.carboneACV}</span> kg/m³</span>
                      )}
                      {m.source && (
                        <span className="text-[10px] italic">· {m.source}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)} aria-label="Modifier">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(m)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {(creating || editing) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={closeForm}
        >
          <Card
            className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                {editing ? "Modifier le matériau" : "Nouveau matériau"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Laine de roche λ35"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Catégorie
                  </label>
                  <select
                    value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {MATERIAU_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Marque</label>
                  <input
                    type="text"
                    value={form.marque}
                    onChange={(e) => setForm({ ...form, marque: e.target.value })}
                    placeholder="Ex: Isover"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Référence</label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="Ex: ISOCONFORT 35"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Propriétés thermiques (NF EN ISO 6946)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      λ — W/m·K <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={form.conductivite}
                      onChange={(e) => setForm({ ...form, conductivite: e.target.value })}
                      placeholder="0.035"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      ρ — kg/m³ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={form.masseVolumique}
                      onChange={(e) => setForm({ ...form, masseVolumique: e.target.value })}
                      placeholder="80"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      c — J/kg·K <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={form.capaciteThermique}
                      onChange={(e) => setForm({ ...form, capaciteThermique: e.target.value })}
                      placeholder="850"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">µ — vapeur</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.resistanceVapeur}
                      onChange={(e) => setForm({ ...form, resistanceVapeur: e.target.value })}
                      placeholder="optionnel"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">R fixe — m²·K/W</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.resistanceFixe}
                      onChange={(e) => setForm({ ...form, resistanceFixe: e.target.value })}
                      placeholder="lames d'air / vitrages"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">CO₂ — kg/m³</label>
                    <input
                      type="number"
                      step="1"
                      value={form.carboneACV}
                      onChange={(e) => setForm({ ...form, carboneACV: e.target.value })}
                      placeholder="ACV A1-A3"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Source / référence</label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="Ex: FDES Isover, Base Carbone ADEME"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="optionnel"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={closeForm} disabled={saving}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !form.nom.trim() || !form.conductivite || !form.masseVolumique || !form.capaciteThermique}
                  className={cn(saving && "opacity-50")}
                >
                  {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                  {editing ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
