"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Loader2, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import type { PosteCatalogue } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (poste: PosteCatalogue) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Modal réutilisable pour sélectionner un poste depuis le catalogue.
 * Recherche + filtre catégorie. Utilisé dans le devis classique et le devis travaux.
 */
export default function CataloguePicker({ open, onClose, onSelect }: Props) {
  const [postes, setPostes] = useState<PosteCatalogue[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState<string>("TOUTES");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/postes-catalogue")
      .then(async (res) => {
        if (!res.ok) {
          await showApiError(res, "Chargement du catalogue impossible");
          return [] as PosteCatalogue[];
        }
        return (await res.json()) as PosteCatalogue[];
      })
      .then((data) => {
        if (!cancelled) setPostes(data);
      })
      .catch((err) => {
        if (!cancelled) showNetworkError(err, "Chargement du catalogue impossible");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    postes.forEach((p) => {
      if (p.categorie) set.add(p.categorie);
    });
    return ["TOUTES", ...Array.from(set).sort()];
  }, [postes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return postes.filter((p) => {
      if (categorie !== "TOUTES" && p.categorie !== categorie) return false;
      if (!q) return true;
      return (
        p.designation.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [postes, search, categorie]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-tk-surface border border-tk-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tk-border px-5 py-4">
          <div className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-tk-text-faint" />
            <h2 className="text-sm font-semibold text-tk-text">
              Catalogue de postes
            </h2>
            <span className="text-xs text-tk-text-faint">
              {filtered.length} {filtered.length > 1 ? "postes" : "poste"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-tk-text-faint hover:text-tk-text transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search + filters */}
        <div className="border-b border-tk-border px-5 py-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tk-text-faint" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un poste, une prestation..."
              className="w-full rounded-lg border border-tk-border bg-tk-bg pl-9 pr-3 py-2 text-sm text-tk-text placeholder:text-tk-text-faint focus:outline-none focus:ring-1 focus:ring-tk-accent"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-1 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategorie(c)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    categorie === c
                      ? "border-tk-accent bg-tk-accent/10 text-tk-text"
                      : "border-tk-border bg-transparent text-tk-text-muted hover:text-tk-text"
                  )}
                >
                  {c === "TOUTES" ? "Toutes" : c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-tk-text-faint" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-tk-text-faint">
              {postes.length === 0
                ? "Aucun poste dans le catalogue. Enregistrez vos premières lignes pour les retrouver ici."
                : "Aucun résultat pour cette recherche."}
            </div>
          ) : (
            <ul className="divide-y divide-tk-border">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      onSelect(p);
                      onClose();
                    }}
                    className="w-full px-5 py-3 text-left hover:bg-tk-hover transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-tk-text truncate">
                          {p.designation}
                        </p>
                        {p.description && (
                          <p className="text-xs text-tk-text-faint mt-0.5 line-clamp-2">
                            {p.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {p.categorie && (
                            <span className="inline-flex items-center rounded-full bg-tk-bg px-2 py-0.5 text-[10px] uppercase tracking-wider text-tk-text-muted">
                              {p.categorie}
                            </span>
                          )}
                          <span className="text-[10px] text-tk-text-faint">
                            {p.unite}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-tk-text">
                          {formatCurrency(p.prixUnitHT)}
                        </p>
                        <p className="text-[10px] text-tk-text-faint">
                          HT · TVA {p.tauxTVA}%
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
