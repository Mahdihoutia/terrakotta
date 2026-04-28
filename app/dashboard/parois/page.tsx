"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Boxes,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Filter,
  ArrowUp,
  ArrowDown,
  Layers,
  Thermometer,
  Wind,
  Weight,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { PAROI_TYPES, RSI_RSE_DEFAULTS } from "@/lib/validations/paroi";
import {
  calculerParoi,
  qualifierU,
  qualifierDephasage,
  type CoucheCalc,
} from "@/lib/thermal/paroi-calc";

interface MateriauLite {
  id: string;
  nom: string;
  categorie: string;
  conductivite: number;
  masseVolumique: number;
  capaciteThermique: number;
  resistanceFixe: number | null;
  carboneACV: number | null;
}

interface Couche {
  id?: string;
  ordre: number;
  epaisseur: number; // en mètres
  materiauId: string;
  materiau?: MateriauLite;
}

interface Paroi {
  id: string;
  nom: string;
  type: string;
  description: string | null;
  uCache: number | null;
  rCache: number | null;
  masseSurfaciqueCache: number | null;
  dephasageCache: number | null;
  carboneCache: number | null;
  rsi: number;
  rse: number;
  couches?: Couche[];
}

const TYPE_LABELS: Record<string, string> = {
  MUR_EXT: "Mur extérieur",
  MUR_INT: "Mur intérieur",
  TOITURE: "Toiture",
  PLANCHER_BAS: "Plancher bas",
  PLANCHER_INTER: "Plancher intermédiaire",
  VITRAGE: "Vitrage",
  PORTE: "Porte",
};

const CATEGORIE_COLORS: Record<string, string> = {
  STRUCTURE: "#a8a29e",
  ISOLANT: "#34d399",
  FINITION: "#f59e0b",
  VITRAGE: "#0ea5e9",
  LAME_AIR: "#cbd5e1",
  MEMBRANE: "#a78bfa",
  AUTRE: "#94a3b8",
};

interface Filters {
  type: string;
  search: string;
}

interface FormState {
  nom: string;
  type: string;
  description: string;
  rsi: string;
  rse: string;
  couches: Couche[];
}

function defaultForm(): FormState {
  return {
    nom: "",
    type: "MUR_EXT",
    description: "",
    rsi: String(RSI_RSE_DEFAULTS.MUR_EXT.rsi),
    rse: String(RSI_RSE_DEFAULTS.MUR_EXT.rse),
    couches: [],
  };
}

export default function ParoisPage() {
  const [parois, setParois] = useState<Paroi[]>([]);
  const [materiaux, setMateriaux] = useState<MateriauLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [filters, setFilters] = useLocalStorage<Filters>(
    "terrakotta:parois:filters",
    { type: "TOUTES", search: "" },
  );

  const [editing, setEditing] = useState<Paroi | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<{ open: boolean; insertAt: number }>({
    open: false,
    insertAt: 0,
  });
  const [pickerSearch, setPickerSearch] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setMigrationPending(false);
    try {
      const [paroisRes, materiauxRes] = await Promise.all([
        fetch("/api/parois"),
        fetch("/api/materiaux"),
      ]);
      if (paroisRes.status === 503 || materiauxRes.status === 503) {
        setMigrationPending(true);
        return;
      }
      if (!paroisRes.ok) {
        await showApiError(paroisRes, "Chargement des parois impossible");
        return;
      }
      if (!materiauxRes.ok) {
        await showApiError(materiauxRes, "Chargement des matériaux impossible");
        return;
      }
      setParois((await paroisRes.json()) as Paroi[]);
      setMateriaux((await materiauxRes.json()) as MateriauLite[]);
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return parois.filter((p) => {
      if (filters.type !== "TOUTES" && p.type !== filters.type) return false;
      if (q.length === 0) return true;
      return p.nom.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
    });
  }, [parois, filters]);

  function openCreate() {
    setEditing(null);
    setForm(defaultForm());
    setCreating(true);
  }

  function openEdit(p: Paroi) {
    setCreating(false);
    setEditing(p);
    setForm({
      nom: p.nom,
      type: p.type,
      description: p.description ?? "",
      rsi: String(p.rsi),
      rse: String(p.rse),
      couches: (p.couches ?? []).map((c) => ({
        id: c.id,
        ordre: c.ordre,
        epaisseur: c.epaisseur,
        materiauId: c.materiauId,
        materiau: c.materiau,
      })),
    });
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(defaultForm());
  }

  function changeType(newType: string) {
    const defaults = RSI_RSE_DEFAULTS[newType as keyof typeof RSI_RSE_DEFAULTS];
    setForm((f) => ({
      ...f,
      type: newType,
      rsi: String(defaults.rsi),
      rse: String(defaults.rse),
    }));
  }

  function addCouche(materiau: MateriauLite, insertAt: number) {
    setForm((f) => {
      const next = [...f.couches];
      next.splice(insertAt, 0, {
        ordre: insertAt,
        epaisseur: materiau.resistanceFixe != null ? 0.05 : 0.10,
        materiauId: materiau.id,
        materiau,
      });
      return { ...f, couches: next.map((c, i) => ({ ...c, ordre: i })) };
    });
    setPicker({ open: false, insertAt: 0 });
    setPickerSearch("");
  }

  function moveCouche(idx: number, dir: -1 | 1) {
    setForm((f) => {
      const next = [...f.couches];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return f;
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...f, couches: next.map((c, i) => ({ ...c, ordre: i })) };
    });
  }

  function removeCouche(idx: number) {
    setForm((f) => {
      const next = f.couches.filter((_, i) => i !== idx);
      return { ...f, couches: next.map((c, i) => ({ ...c, ordre: i })) };
    });
  }

  function updateEpaisseur(idx: number, mm: string) {
    const v = parseFloat(mm);
    setForm((f) => {
      const next = [...f.couches];
      next[idx] = {
        ...next[idx],
        epaisseur: Number.isNaN(v) ? 0 : v / 1000,
      };
      return { ...f, couches: next };
    });
  }

  // Calcul live
  const metrics = useMemo(() => {
    const couchesCalc: CoucheCalc[] = form.couches
      .filter((c) => c.materiau)
      .map((c) => ({
        materiauId: c.materiauId,
        nom: c.materiau!.nom,
        categorie: c.materiau!.categorie,
        epaisseur: c.epaisseur,
        conductivite: c.materiau!.conductivite,
        masseVolumique: c.materiau!.masseVolumique,
        capaciteThermique: c.materiau!.capaciteThermique,
        resistanceFixe: c.materiau!.resistanceFixe,
        carboneACV: c.materiau!.carboneACV,
      }));
    const rsi = parseFloat(form.rsi) || 0;
    const rse = parseFloat(form.rse) || 0;
    return calculerParoi(couchesCalc, rsi, rse);
  }, [form.couches, form.rsi, form.rse]);

  const totalEpaisseurMm = form.couches.reduce(
    (s, c) => s + c.epaisseur * 1000,
    0,
  );

  const filteredMateriaux = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (q.length === 0) return materiaux;
    return materiaux.filter(
      (m) =>
        m.nom.toLowerCase().includes(q) ||
        m.categorie.toLowerCase().includes(q),
    );
  }, [materiaux, pickerSearch]);

  async function handleSave() {
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    if (form.couches.length === 0) {
      toast.error("Ajoute au moins une couche");
      return;
    }

    setSaving(true);
    const payload = {
      nom: form.nom.trim(),
      type: form.type,
      description: form.description.trim() || null,
      rsi: parseFloat(form.rsi) || 0.13,
      rse: parseFloat(form.rse) || 0.04,
      couches: form.couches.map((c, i) => ({
        materiauId: c.materiauId,
        ordre: i,
        epaisseur: c.epaisseur,
      })),
    };

    try {
      const isEdit = !!editing;
      const url = isEdit ? `/api/parois/${editing!.id}` : "/api/parois";
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
      toast.success(isEdit ? "Paroi mise à jour" : "Paroi créée");
      closeForm();
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Paroi) {
    if (!confirm(`Supprimer la paroi "${p.nom}" ?\n\nElle restera disponible dans la corbeille pendant 30 jours.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/parois/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      toast.success("Paroi déplacée dans la corbeille");
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    }
  }

  const uQual = qualifierU(metrics.uValue);
  const dephQual = qualifierDephasage(metrics.dephasage);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-sky-500/10 text-sky-700">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Composeur de parois</h1>
            <p className="text-xs text-muted-foreground">
              {parois.length} paroi{parois.length > 1 ? "s" : ""} · U, déphasage et carbone calculés automatiquement
            </p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Nouvelle paroi
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Rechercher une paroi…"
            className="w-full rounded-md border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="TOUTES">Tous types</option>
            {PAROI_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      {migrationPending && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-amber-900">Migration de base de données requise</p>
            <p className="mt-1 text-xs text-amber-800">
              Exécute <code className="font-mono">prisma/migrations/_manual/2026_04_28_add_bibliotheque_materiaux.sql</code> dans Supabase.
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
              <Boxes className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium">Aucune paroi</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                {parois.length === 0
                  ? "Compose ta première paroi multicouche en empilant des matériaux de la bibliothèque."
                  : "Aucun résultat avec ces filtres."}
              </p>
              {parois.length === 0 && (
                <Button size="sm" className="mt-4" onClick={openCreate}>
                  <Plus className="mr-1 h-4 w-4" />
                  Créer une paroi
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((p) => {
                const u = p.uCache ?? 0;
                const q = qualifierU(u);
                return (
                  <div key={p.id} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="text-sm font-medium leading-snug">{p.nom}</p>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {TYPE_LABELS[p.type] ?? p.type}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-[10px] shrink-0",
                              q.niveau === "EXCELLENT" && "bg-emerald-100 text-emerald-800 border-emerald-200",
                              q.niveau === "BON" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                              q.niveau === "MOYEN" && "bg-amber-50 text-amber-800 border-amber-200",
                              q.niveau === "FAIBLE" && "bg-red-50 text-red-700 border-red-200",
                            )}
                          >
                            {q.label}
                          </Badge>
                        </div>
                        {p.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>U <span className="font-mono text-foreground font-semibold">{u.toFixed(3)}</span> W/m²·K</span>
                          {p.rCache != null && <span>R <span className="font-mono text-foreground">{p.rCache.toFixed(2)}</span></span>}
                          {p.masseSurfaciqueCache != null && <span>M <span className="font-mono text-foreground">{p.masseSurfaciqueCache.toFixed(0)}</span> kg/m²</span>}
                          {p.dephasageCache != null && <span>φ <span className="font-mono text-foreground">{p.dephasageCache.toFixed(1)}</span> h</span>}
                          {p.carboneCache != null && <span>CO₂ <span className="font-mono text-foreground">{p.carboneCache.toFixed(0)}</span> kg/m²</span>}
                          <span className="text-[10px]">· {p.couches?.length ?? 0} couche{(p.couches?.length ?? 0) > 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} aria-label="Modifier">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p)}
                          aria-label="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composeur modal */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={closeForm}>
          <Card
            className="w-full max-w-5xl mx-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b">
              <CardTitle className="text-base">
                {editing ? `Modifier — ${editing.nom}` : "Nouvelle paroi multicouche"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5">
              {/* Colonne gauche : meta */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Nom de la paroi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Mur ITE laine de bois 14 cm"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => changeType(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      {PAROI_TYPES.map((t) => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Notes sur la composition, contexte d'usage…"
                    rows={2}
                    className="w-full rounded-md border px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Rsi (intérieur) — m²·K/W
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.rsi}
                      onChange={(e) => setForm({ ...form, rsi: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Rse (extérieur) — m²·K/W
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.rse}
                      onChange={(e) => setForm({ ...form, rse: e.target.value })}
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                {/* Visualisation graphique */}
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Coupe schématique
                  </p>
                  <div className="flex items-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
                    <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">INT</span>
                    <span className="flex-1 text-center">{(totalEpaisseurMm).toFixed(0)} mm</span>
                    <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded">EXT</span>
                  </div>
                  {form.couches.length === 0 ? (
                    <div className="h-12 rounded border border-dashed flex items-center justify-center text-[11px] text-muted-foreground">
                      Aucune couche — ajoute des matériaux ci-contre →
                    </div>
                  ) : (
                    <div className="flex h-14 rounded overflow-hidden border">
                      {form.couches.map((c, i) => {
                        const w = totalEpaisseurMm > 0 ? (c.epaisseur * 1000 / totalEpaisseurMm) * 100 : 0;
                        const cat = c.materiau?.categorie ?? "AUTRE";
                        return (
                          <div
                            key={i}
                            title={`${c.materiau?.nom ?? "?"} · ${(c.epaisseur * 1000).toFixed(0)} mm`}
                            style={{
                              width: `${w}%`,
                              background: CATEGORIE_COLORS[cat],
                            }}
                            className="flex items-center justify-center text-[9px] text-white/90 font-medium overflow-hidden"
                          >
                            {w > 8 ? `${(c.epaisseur * 1000).toFixed(0)}` : ""}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Métriques live */}
                <div className="rounded-md border bg-card p-3 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Performance calculée (live)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Metric icon={Thermometer} label="U" value={metrics.uValue.toFixed(3)} unit="W/m²·K"
                      hint={uQual.label}
                      tone={uQual.niveau === "EXCELLENT" || uQual.niveau === "BON" ? "good" : uQual.niveau === "MOYEN" ? "warn" : "bad"}
                    />
                    <Metric icon={Layers} label="R" value={metrics.rTotal.toFixed(2)} unit="m²·K/W" />
                    <Metric icon={Weight} label="Masse" value={metrics.masseSurfacique.toFixed(0)} unit="kg/m²" />
                    <Metric icon={Wind} label="Déphasage" value={metrics.dephasage.toFixed(1)} unit="h"
                      hint={metrics.masseSurfacique > 0 ? dephQual.label : undefined}
                      tone={metrics.dephasage >= 10 ? "good" : metrics.dephasage >= 8 ? "warn" : undefined}
                    />
                    <Metric icon={Leaf} label="Carbone" value={metrics.carboneACVm2.toFixed(1)} unit="kgCO₂e/m²"
                      tone={metrics.carboneACVm2 < 0 ? "good" : undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Colonne droite : couches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Couches (intérieur → extérieur)
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPicker({ open: true, insertAt: form.couches.length })}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter une couche
                  </Button>
                </div>

                {form.couches.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center">
                    <Layers className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="mt-2 text-sm font-medium">Aucune couche</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Empile structure, isolant, finition depuis la bibliothèque.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {form.couches.map((c, i) => {
                      const m = c.materiau;
                      const r = m?.resistanceFixe != null ? m.resistanceFixe : (m && m.conductivite > 0 ? c.epaisseur / m.conductivite : 0);
                      return (
                        <div key={i} className="rounded-md border p-2.5 flex items-center gap-2 bg-card">
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => moveCouche(i, -1)}
                              disabled={i === 0}
                              aria-label="Monter"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => moveCouche(i, 1)}
                              disabled={i === form.couches.length - 1}
                              aria-label="Descendre"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <div
                            className="h-9 w-1.5 rounded-full shrink-0"
                            style={{ background: CATEGORIE_COLORS[m?.categorie ?? "AUTRE"] }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{m?.nom ?? "Matériau supprimé"}</p>
                            <p className="text-[11px] text-muted-foreground">
                              λ={m?.conductivite.toFixed(3) ?? "?"} · R={r.toFixed(3)} m²·K/W
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              value={(c.epaisseur * 1000).toFixed(0)}
                              onChange={(e) => updateEpaisseur(i, e.target.value)}
                              className="w-16 rounded border px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                              disabled={m?.resistanceFixe != null}
                            />
                            <span className="text-[11px] text-muted-foreground w-5">mm</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeCouche(i)}
                            aria-label="Retirer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>

            <div className="flex justify-end gap-2 px-5 py-4 border-t sticky bottom-0 bg-card">
              <Button variant="outline" size="sm" onClick={closeForm} disabled={saving}>Annuler</Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !form.nom.trim() || form.couches.length === 0}
                className={cn(saving && "opacity-50")}
              >
                {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                {editing ? "Enregistrer" : "Créer la paroi"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Picker matériau */}
      {picker.open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setPicker({ open: false, insertAt: 0 })}
        >
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base">Choisir un matériau</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPicker({ open: false, insertAt: 0 })}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Rechercher un matériau ou une catégorie…"
                  className="w-full rounded-md border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y">
              {filteredMateriaux.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Aucun matériau. Importe la base ou crée-en depuis la bibliothèque.
                </p>
              ) : (
                filteredMateriaux.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => addCouche(m, picker.insertAt)}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3"
                  >
                    <div className="h-7 w-1.5 rounded-full shrink-0" style={{ background: CATEGORIE_COLORS[m.categorie] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.nom}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.categorie} · λ={m.conductivite.toFixed(3)} W/m·K · ρ={m.masseVolumique} kg/m³
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

interface MetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  hint?: string;
  tone?: "good" | "warn" | "bad";
}
function Metric({ icon: Icon, label, value, unit, hint, tone }: MetricProps) {
  return (
    <div className="rounded-md border p-2.5 bg-muted/20">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className={cn(
            "text-base font-semibold tabular-nums",
            tone === "good" && "text-emerald-700",
            tone === "warn" && "text-amber-700",
            tone === "bad" && "text-red-700",
          )}
        >
          {value}
        </span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
