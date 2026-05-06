"use client";

/**
 * Tableau de pilotage Décret Tertiaire (DEET).
 *
 * Agrège tous les audits dont `donnees.deet_applicable === "Oui …"` et
 * affiche pour chacun la trajectoire de réduction (baseline → 2030 → 2040 →
 * 2050) avec son statut d'alignement.
 */

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Building2,
  CalendarClock,
  Download,
  Loader2,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/hooks/useLocalStorage";
import { toast } from "sonner";

type Statut = "EN_ECART" | "ALIGNE" | "EN_AVANCE" | "INDETERMINE";

interface DeetSummary {
  id: string;
  titre: string;
  reference: string;
  clientNom: string | null;
  surfaceHabitable: number | null;
  zone: string | null;
  baseline: { annee: number; kwh_m2: number } | null;
  objectifs: { 2030: number; 2040: number; 2050: number } | null;
  projection: number | null;
  consoActuelle: number | null;
  statut: Statut;
  nextDeclaration: string;
  updatedAt: string;
}

const STATUT_CONFIG: Record<Statut, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  ALIGNE:       { label: "Aligné",       className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  EN_AVANCE:    { label: "En avance",    className: "bg-sky-100 text-sky-700 border-sky-200",           icon: TrendingDown },
  EN_ECART:     { label: "Écart",        className: "bg-rose-100 text-rose-700 border-rose-200",         icon: AlertTriangle },
  INDETERMINE:  { label: "À compléter",  className: "bg-zinc-100 text-zinc-600 border-zinc-200",         icon: AlertTriangle },
};

interface Filters {
  search: string;
  statut: "TOUS" | Statut;
}

export default function DeetPage() {
  const [items, setItems] = useState<DeetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useLocalStorage<Filters>("kilowater:deet:filters", {
    search: "",
    statut: "TOUS",
  });
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/deet");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as DeetSummary[];
        if (alive) setItems(data);
      } catch (err) {
        console.error(err);
        if (alive) setError("Impossible de charger les données DEET.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return items.filter((it) => {
      if (filters.statut !== "TOUS" && it.statut !== filters.statut) return false;
      if (!q) return true;
      return (
        it.titre.toLowerCase().includes(q) ||
        it.reference.toLowerCase().includes(q) ||
        (it.clientNom ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, filters]);

  const kpis = useMemo(() => {
    const totalSurface = items.reduce((s, i) => s + (i.surfaceHabitable ?? 0), 0);
    const ecart = items.filter((i) => i.statut === "EN_ECART").length;
    return {
      total: items.length,
      surface: totalSurface,
      ecart,
      // Toutes les déclarations OPERAT tombent à la même date du calendrier ;
      // on remonte juste celle de la première ligne (toutes identiques côté API).
      nextDeclaration: items[0]?.nextDeclaration ?? "—",
    };
  }, [items]);

  function exportCsv() {
    if (items.length === 0) {
      toast.warning("Aucune donnée DEET à exporter.");
      return;
    }
    // Format minimal compatible OPERAT (à enrichir avec SIRET, identifiant
    // bâtiment et entité fonctionnelle dans la phase B1).
    const header = "siret;reference;titre;surface;conso_kwh_m2;annee_baseline;baseline_kwh_m2;projection_kwh_m2";
    const lines = items.map((i) =>
      [
        "", // SIRET non saisi à ce stade
        i.reference,
        (i.titre || "").replace(/;/g, ","),
        i.surfaceHabitable ?? "",
        i.consoActuelle ?? "",
        i.baseline?.annee ?? "",
        i.baseline?.kwh_m2 ?? "",
        i.projection ?? "",
      ].join(";"),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deet-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV généré.");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Décret Tertiaire — Trajectoire DEET
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} bâtiment{items.length > 1 ? "s" : ""} soumis · {kpis.ecart} alerte{kpis.ecart > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exporter pour OPERAT
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Bâtiments DEET"
          value={kpis.total.toString()}
          icon={Building2}
          accent="text-blue-600"
        />
        <KpiCard
          label="Surface cumulée"
          value={`${Math.round(kpis.surface).toLocaleString("fr-FR")} m²`}
          icon={Building2}
          accent="text-violet-600"
        />
        <KpiCard
          label="En écart trajectoire"
          value={kpis.ecart.toString()}
          icon={AlertTriangle}
          accent={kpis.ecart > 0 ? "text-rose-600" : "text-emerald-600"}
        />
        <KpiCard
          label="Prochaine déclaration OPERAT"
          value={kpis.nextDeclaration}
          icon={CalendarClock}
          accent="text-amber-600"
        />
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, titre ou client…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          <select
            value={filters.statut}
            onChange={(e) => setFilters({ ...filters, statut: e.target.value as Filters["statut"] })}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="TOUS">Tous statuts</option>
            <option value="ALIGNE">Aligné</option>
            <option value="EN_AVANCE">En avance</option>
            <option value="EN_ECART">Écart</option>
            <option value="INDETERMINE">À compléter</option>
          </select>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bâtiments soumis au Décret Tertiaire</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-sm text-rose-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Aucun bâtiment DEET</p>
              <p>Renseignez la section « Décret Tertiaire » d&apos;un audit pour le voir apparaître ici.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bâtiment</TableHead>
                  <TableHead className="text-right">Surface</TableHead>
                  <TableHead className="text-right">Conso actuelle</TableHead>
                  <TableHead className="text-right">Baseline</TableHead>
                  <TableHead className="text-right">Objectif 2030</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Prochaine OPERAT</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => {
                  const statut = STATUT_CONFIG[it.statut];
                  const Icon = statut.icon;
                  const open = openId === it.id;
                  const reductionPct = it.baseline && it.objectifs
                    ? Math.round((1 - it.objectifs[2030] / it.baseline.kwh_m2) * 100)
                    : null;
                  return (
                    <Fragment key={it.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setOpenId(open ? null : it.id)}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <Link
                              href={`/dashboard/documents?open=${it.id}`}
                              className="font-medium text-foreground hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {it.titre}
                            </Link>
                            <span className="text-[11px] text-muted-foreground">
                              {it.reference}{it.clientNom ? ` · ${it.clientNom}` : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {it.surfaceHabitable != null ? `${Math.round(it.surfaceHabitable).toLocaleString("fr-FR")} m²` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {it.consoActuelle != null ? `${Math.round(it.consoActuelle)} kWh/m²` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {it.baseline ? `${Math.round(it.baseline.kwh_m2)} kWh (${it.baseline.annee})` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {it.objectifs ? (
                            <span>
                              {Math.round(it.objectifs[2030])} kWh
                              {reductionPct != null && (
                                <span className="ml-1 text-[11px] text-muted-foreground">−{reductionPct}%</span>
                              )}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1 border", statut.className)}>
                            <Icon className="h-3 w-3" />
                            {statut.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {it.nextDeclaration}
                        </TableCell>
                        <TableCell>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              open && "rotate-90",
                            )}
                          />
                        </TableCell>
                      </TableRow>
                      {open && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={8} className="py-4">
                            <TrajectoryChart item={it} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

function KpiCard({ label, value, icon: Icon, accent }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
        </div>
        <Icon className={cn("h-5 w-5", accent)} />
      </CardContent>
    </Card>
  );
}

// ─── Trajectory chart (recharts) ────────────────────────────────────

function TrajectoryChart({ item }: { item: DeetSummary }) {
  if (!item.baseline || !item.objectifs) {
    return (
      <p className="text-sm text-muted-foreground">
        Trajectoire non disponible — baseline ou objectifs manquants.
      </p>
    );
  }

  const data: Array<{ annee: number; trajectoire: number; reel?: number; projection?: number }> = [
    { annee: item.baseline.annee, trajectoire: item.baseline.kwh_m2 },
    { annee: 2030, trajectoire: item.objectifs[2030] },
    { annee: 2040, trajectoire: item.objectifs[2040] },
    { annee: 2050, trajectoire: item.objectifs[2050] },
  ];

  const currentYear = new Date().getFullYear();
  if (item.consoActuelle != null) {
    data.push({ annee: currentYear, trajectoire: 0, reel: item.consoActuelle });
  }
  if (item.projection != null) {
    data.push({ annee: currentYear + 1, trajectoire: 0, projection: item.projection });
  }
  // Sort by year + dedupe trajectoire on years where we only have reel/projection
  data.sort((a, b) => a.annee - b.annee);

  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
        Trajectoire de réduction — {item.titre}
      </p>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="annee" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} label={{ value: "kWh/m²·an", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#6b7280" } }} />
            <RechartsTooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine x={currentYear} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Aujourd'hui", fontSize: 10, fill: "#64748b" }} />
            <Line
              type="monotone"
              dataKey="trajectoire"
              name="Trajectoire DEET"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            {item.consoActuelle != null && (
              <Line
                type="monotone"
                dataKey="reel"
                name="Conso actuelle"
                stroke="#e11d48"
                strokeWidth={2}
                dot={{ r: 5 }}
              />
            )}
            {item.projection != null && (
              <Line
                type="monotone"
                dataKey="projection"
                name="Projection après travaux"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
