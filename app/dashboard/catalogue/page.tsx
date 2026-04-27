"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  BookMarked,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import type { PosteCatalogue } from "@/types";

interface FormState {
  designation: string;
  categorie: string;
  unite: string;
  prixUnitHT: string;
  tauxTVA: string;
  description: string;
}

function emptyForm(): FormState {
  return {
    designation: "",
    categorie: "",
    unite: "U",
    prixUnitHT: "",
    tauxTVA: "20",
    description: "",
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

interface Filters {
  categorie: string;
  search: string;
}

export default function CataloguePage() {
  const [postes, setPostes] = useState<PosteCatalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useLocalStorage<Filters>(
    "terrakotta:catalogue:filters",
    { categorie: "TOUTES", search: "" },
  );

  const [editing, setEditing] = useState<PosteCatalogue | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/postes-catalogue");
      if (!res.ok) {
        await showApiError(res, "Chargement du catalogue impossible");
        return;
      }
      const data = (await res.json()) as PosteCatalogue[];
      setPostes(data);
    } catch (err) {
      showNetworkError(err, "Chargement du catalogue impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    postes.forEach((p) => {
      if (p.categorie) set.add(p.categorie);
    });
    return ["TOUTES", ...Array.from(set).sort()];
  }, [postes]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return postes.filter((p) => {
      if (filters.categorie !== "TOUTES" && p.categorie !== filters.categorie) return false;
      if (q.length === 0) return true;
      return (
        p.designation.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.categorie ?? "").toLowerCase().includes(q)
      );
    });
  }, [postes, filters]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setCreating(true);
  }

  function openEdit(p: PosteCatalogue) {
    setCreating(false);
    setEditing(p);
    setForm({
      designation: p.designation,
      categorie: p.categorie ?? "",
      unite: p.unite,
      prixUnitHT: String(p.prixUnitHT),
      tauxTVA: String(p.tauxTVA),
      description: p.description ?? "",
    });
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setForm(emptyForm());
  }

  async function handleSave() {
    if (!form.designation.trim()) {
      toast.error("La désignation est obligatoire");
      return;
    }
    const prix = parseFloat(form.prixUnitHT);
    if (Number.isNaN(prix) || prix < 0) {
      toast.error("Prix unitaire HT invalide");
      return;
    }
    const tva = parseFloat(form.tauxTVA);
    if (Number.isNaN(tva) || tva < 0) {
      toast.error("Taux de TVA invalide");
      return;
    }

    setSaving(true);
    const payload = {
      designation: form.designation.trim(),
      categorie: form.categorie.trim() || null,
      unite: form.unite.trim() || "U",
      prixUnitHT: prix,
      tauxTVA: tva,
      description: form.description.trim() || null,
    };

    try {
      const isEdit = !!editing;
      const url = isEdit ? `/api/postes-catalogue/${editing!.id}` : "/api/postes-catalogue";
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
      toast.success(isEdit ? "Poste mis à jour" : "Poste créé");
      closeForm();
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: PosteCatalogue) {
    if (!confirm(`Supprimer le poste "${p.designation}" ?\n\nIl restera disponible dans la corbeille pendant 30 jours.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/postes-catalogue/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      toast.success("Poste déplacé dans la corbeille");
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-violet-500/10 text-violet-700">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Catalogue de postes</h1>
            <p className="text-xs text-muted-foreground">
              {postes.length} poste{postes.length > 1 ? "s" : ""} · Réutilisables dans tous les devis
            </p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Nouveau poste
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
            placeholder="Rechercher par désignation, description, catégorie…"
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
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "TOUTES" ? "Toutes catégories" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookMarked className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium">Aucun poste dans le catalogue</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {postes.length === 0
                  ? "Crée ton premier poste réutilisable pour gagner du temps sur tes devis."
                  : "Aucun résultat avec ces filtres."}
              </p>
              {postes.length === 0 && (
                <Button size="sm" className="mt-4" onClick={openCreate}>
                  <Plus className="mr-1 h-4 w-4" />
                  Créer un poste
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-medium leading-snug">{p.designation}</p>
                      {p.categorie && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {p.categorie}
                        </Badge>
                      )}
                    </div>
                    {p.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Unité&nbsp;: <span className="font-mono text-foreground">{p.unite}</span></span>
                      <span>TVA&nbsp;: <span className="font-mono text-foreground">{p.tauxTVA}%</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-semibold tabular-nums">
                      {formatCurrency(p.prixUnitHT)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(p)}
                        aria-label="Modifier"
                      >
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal édition / création */}
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
                {editing ? "Modifier le poste" : "Nouveau poste catalogue"}
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Désignation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="Ex: Audit énergétique bâtiment tertiaire"
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Description (optionnelle)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Détails techniques, normes, livrables…"
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    list="catalogue-categories"
                    value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                    placeholder="Ex: Audit, Isolation, PAC…"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <datalist id="catalogue-categories">
                    {categories.filter((c) => c !== "TOUTES").map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Unité
                  </label>
                  <select
                    value={form.unite}
                    onChange={(e) => setForm({ ...form, unite: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="U">Unité</option>
                    <option value="forfait">Forfait</option>
                    <option value="m²">m²</option>
                    <option value="ml">ml</option>
                    <option value="m³">m³</option>
                    <option value="h">Heure</option>
                    <option value="jour">Jour</option>
                    <option value="lot">Lot</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Prix unitaire HT (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.prixUnitHT}
                    onChange={(e) => setForm({ ...form, prixUnitHT: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Taux TVA (%)
                  </label>
                  <input
                    type="number"
                    value={form.tauxTVA}
                    onChange={(e) => setForm({ ...form, tauxTVA: e.target.value })}
                    placeholder="20"
                    min="0"
                    step="0.1"
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
                  disabled={saving || !form.designation.trim() || !form.prixUnitHT}
                  className={cn(saving && "opacity-50")}
                >
                  {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                  {editing ? "Enregistrer" : "Créer le poste"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
