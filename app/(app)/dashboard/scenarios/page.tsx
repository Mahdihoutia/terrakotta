"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarClock, Sparkles, Plus, Trash2 } from "lucide-react";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

type CellState = "OCC" | "RED" | "INOCC";
type Pattern = CellState[][];

interface Scenario {
  id: string;
  nom: string;
  description: string | null;
  preset: boolean;
  /** L'API renvoie déjà le pattern parsé (matrice 7×24). */
  pattern: Pattern;
  /** Compat : certains anciens consommateurs envoyaient un patternJson string. */
  patternJson?: string;
  createdAt: string;
}

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function patternVide(): Pattern {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => "INOCC" as const));
}

/** Normalise un pattern reçu (array ou JSON string en fallback). */
function normalizePattern(s: Scenario): Pattern {
  if (Array.isArray(s.pattern) && s.pattern.length === 7) {
    return s.pattern;
  }
  if (typeof s.patternJson === "string") {
    try {
      const p = JSON.parse(s.patternJson);
      if (Array.isArray(p) && p.length === 7) return p as Pattern;
    } catch {
      /* ignore */
    }
  }
  return patternVide();
}

function colorForState(s: "OCC" | "RED" | "INOCC"): string {
  if (s === "OCC") return "bg-emerald-500";
  if (s === "RED") return "bg-amber-500";
  return "bg-slate-200 dark:bg-slate-800";
}

export default function ScenariosPage() {
  const [list, setList] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMigrationPending(false);
    try {
      const res = await fetch("/api/scenarios");
      if (res.status === 503) {
        setMigrationPending(true);
        return;
      }
      if (!res.ok) {
        await showApiError(res, "Chargement des scénarios impossible");
        return;
      }
      const data = (await res.json()) as Scenario[];
      setList(data);
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-scenarios", { method: "POST" });
      if (!res.ok) {
        await showApiError(res, "Import des presets impossible");
        return;
      }
      toast.success("Presets de scénarios importés");
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce scénario ?")) return;
    try {
      const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      if (!res.ok) {
        await showApiError(res, "Suppression impossible");
        return;
      }
      toast.success("Scénario supprimé");
      await refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    }
  }

  const presets = list.filter((s) => s.preset);
  const customs = list.filter((s) => !s.preset);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-700">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Scénarios d&apos;occupation</h1>
            <p className="text-sm text-muted-foreground">
              Profils hebdomadaires utilisés pour le calcul thermique multi-zones
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {list.length === 0 && !loading && !migrationPending && (
            <Button onClick={handleSeed} disabled={seeding} variant="outline">
              {seeding ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              Importer les presets
            </Button>
          )}
          <Button disabled title="À venir — édition d'un scénario custom via la grille 7×24">
            <Plus className="mr-1 h-4 w-4" />
            Nouveau scénario
          </Button>
        </div>
      </div>

      {migrationPending && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-900">
            <p className="font-medium">Migration de base de données requise</p>
            <p className="mt-1 text-xs">
              Exécute le SQL{" "}
              <code className="font-mono">
                prisma/migrations/_manual/2026_04_28_add_zoning_thermique.sql
              </code>{" "}
              dans Supabase puis recharge cette page.
            </p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 && !migrationPending ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">
              Aucun scénario d&apos;occupation
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Importe les 6 presets standards (bureaux, commerce, logement, scolaire…) pour démarrer.
            </p>
            <Button onClick={handleSeed} disabled={seeding} className="mt-4">
              {seeding ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              Importer les presets
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {presets.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Presets standards ({presets.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {presets.map((s) => (
                  <ScenarioCard key={s.id} scenario={s} />
                ))}
              </div>
            </section>
          )}
          {customs.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Scénarios personnalisés ({customs.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {customs.map((s) => (
                  <ScenarioCard
                    key={s.id}
                    scenario={s}
                    onDelete={() => handleDelete(s.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ScenarioCard({
  scenario,
  onDelete,
}: {
  scenario: Scenario;
  onDelete?: () => void;
}) {
  const pattern = normalizePattern(scenario);
  const totalOcc = pattern.flat().filter((c) => c === "OCC").length;
  const totalRed = pattern.flat().filter((c) => c === "RED").length;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{scenario.nom}</h3>
              {scenario.preset && (
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                  Preset
                </Badge>
              )}
            </div>
            {scenario.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{scenario.description}</p>
            )}
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Heatmap 7×24 */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[28px_repeat(24,1fr)] gap-px text-[8px]">
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div
                key={h}
                className="text-center text-muted-foreground"
                style={{ minWidth: "10px" }}
              >
                {h % 6 === 0 ? h : ""}
              </div>
            ))}
            {pattern.map((row, j) => (
              <div key={j} className="contents">
                <div className="text-[9px] text-muted-foreground self-center pr-1">
                  {JOURS[j]}
                </div>
                {row.map((cell, h) => (
                  <div
                    key={h}
                    className={`h-3 ${colorForState(cell)} rounded-[1px]`}
                    title={`${JOURS[j]} ${h}h — ${cell}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />
            Occupé : {totalOcc}h/sem
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-amber-500" />
            Réduit : {totalRed}h/sem
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm bg-slate-300" />
            Inoccupé : {168 - totalOcc - totalRed}h/sem
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
