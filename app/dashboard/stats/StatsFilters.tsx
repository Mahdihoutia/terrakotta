"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { CategorieCible } from "@prisma/client";
import {
  ALL_CATEGORIES,
  ALL_PERIODS,
  CATEGORIE_LABELS,
  PERIOD_LABELS,
  type PeriodKey,
  type TabKey,
} from "@/lib/stats/period";
import { cn } from "@/lib/utils";

interface Props {
  period: PeriodKey;
  categories: CategorieCible[];
  tab: TabKey;
  categoryFilterDisabled: boolean;
}

export default function StatsFilters({ period, categories, tab, categoryFilterDisabled }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const p = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") p.delete(k);
        else p.set(k, v);
      }
      router.push(`${pathname}?${p.toString()}`);
    },
    [router, pathname, search],
  );

  const toggleCategory = (c: CategorieCible) => {
    const set = new Set(categories);
    if (set.has(c)) set.delete(c);
    else set.add(c);
    const next = Array.from(set);
    update({ categories: next.length > 0 ? next.join(",") : null });
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-tk-border bg-tk-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-tk-text-muted">
          Période
        </span>
        <div className="flex flex-wrap gap-1">
          {ALL_PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => update({ period: p })}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                period === p
                  ? "bg-tk-primary text-white"
                  : "bg-tk-hover text-tk-text-muted hover:text-tk-text",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
            categoryFilterDisabled ? "text-tk-text-faint" : "text-tk-text-muted",
          )}
          title={categoryFilterDisabled ? "Le filtre catégorie ne s'applique pas à cet onglet" : undefined}
        >
          Catégorie cible
        </span>
        <div className="flex flex-wrap gap-1">
          {ALL_CATEGORIES.map((c) => {
            const active = categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                disabled={categoryFilterDisabled}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  categoryFilterDisabled && "cursor-not-allowed opacity-40",
                  active && !categoryFilterDisabled
                    ? "bg-tk-primary text-white"
                    : "bg-tk-hover text-tk-text-muted hover:text-tk-text",
                )}
              >
                {CATEGORIE_LABELS[c]}
              </button>
            );
          })}
          {categories.length > 0 && !categoryFilterDisabled && (
            <button
              type="button"
              onClick={() => update({ categories: null })}
              className="rounded-md px-2 py-1 text-xs text-tk-text-faint hover:text-tk-text"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-tk-border pt-3">
        {(["projets", "leads", "revenus", "aides"] as TabKey[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => update({ tab: t })}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "bg-tk-text text-tk-surface"
                : "text-tk-text-muted hover:bg-tk-hover hover:text-tk-text",
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
