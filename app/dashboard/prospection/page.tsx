"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/dashboard/StatusBadge";
import {
  Search, Loader2, Star, MapPin, Building2, Filter, ArrowRight,
  Radar, Globe, BookOpen, Sparkles, Users, TrendingUp, Target,
  Download, RefreshCw, Phone, Mail, ExternalLink, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, LeadSource } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  PAGES_JAUNES: { label: "Pages Jaunes", icon: BookOpen, color: "text-yellow-600 bg-yellow-100" },
  SOCIETE_COM: { label: "societe.com", icon: Building2, color: "text-blue-600 bg-blue-100" },
  WEB_SCRAPING: { label: "Web / API", icon: Globe, color: "text-emerald-600 bg-emerald-100" },
  SIRENE: { label: "SIRENE (INSEE)", icon: Building2, color: "text-indigo-600 bg-indigo-100" },
  BODACC: { label: "BODACC", icon: BookOpen, color: "text-orange-600 bg-orange-100" },
  DPE_ADEME: { label: "DPE ADEME", icon: Target, color: "text-red-600 bg-red-100" },
  BOAMP: { label: "Marchés Publics", icon: Building2, color: "text-teal-600 bg-teal-100" },
  PERMIS_CONSTRUIRE: { label: "Permis Construire", icon: Building2, color: "text-violet-600 bg-violet-100" },
  LINKEDIN: { label: "LinkedIn", icon: Users, color: "text-sky-700 bg-sky-100" },
  INFOGREFFE: { label: "Infogreffe", icon: Building2, color: "text-rose-600 bg-rose-100" },
  PAPPERS: { label: "Pappers", icon: Globe, color: "text-cyan-600 bg-cyan-100" },
  CADASTRE_DVF: { label: "Cadastre / DVF", icon: MapPin, color: "text-lime-700 bg-lime-100" },
  FRANCE_TRAVAIL: { label: "France Travail", icon: TrendingUp, color: "text-fuchsia-600 bg-fuchsia-100" },
  ANNONCES_LEGALES: { label: "Annonces Légales", icon: BookOpen, color: "text-amber-700 bg-amber-100" },
};

const ROLE_OPTIONS = [
  "Gestionnaire Technique",
  "Gestionnaire de copropriété",
  "Property Manager",
  "Syndic de copropriété",
  "Maire",
  "Adjoint au Maire",
  "Directeur technique",
  "Responsable patrimoine",
  "Dirigeant",
  "Gestionnaire de patrimoine",
  "CEO / Directeur général",
  "Apporteur d'affaires immobilier",
];

const DEPT_OPTIONS = [
  { value: "75", label: "75 — Paris" },
  { value: "77", label: "77 — Seine-et-Marne" },
  { value: "78", label: "78 — Yvelines" },
  { value: "91", label: "91 — Essonne" },
  { value: "92", label: "92 — Hauts-de-Seine" },
  { value: "93", label: "93 — Seine-Saint-Denis" },
  { value: "94", label: "94 — Val-de-Marne" },
  { value: "95", label: "95 — Val-d'Oise" },
  { value: "60", label: "60 — Oise" },
  { value: "45", label: "45 — Loiret" },
  { value: "51", label: "51 — Marne" },
  { value: "28", label: "28 — Eure-et-Loir" },
  { value: "10", label: "10 — Aube" },
  { value: "02", label: "02 — Aisne" },
  { value: "89", label: "89 — Yonne" },
];

// ─── Stars component ────────────────────────────────────────────

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < score
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-tk-border",
          )}
        />
      ))}
    </div>
  );
}

// ─── Stats type ──────────────────────────────────────────────────

interface ProspectionStats {
  total: number;
  bySource: Array<{ source: string; count: number }>;
  byScore: Array<{ score: number; count: number }>;
  byRole: Array<{ role: string | null; count: number }>;
  byDepartement: Array<{ dept: string | null; count: number }>;
  recent: Lead[];
}

// ─── Main page ──────────────────────────────────────────────────

export default function ProspectionPage() {
  const [stats, setStats] = useState<ProspectionStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Search config
  const [showConfig, setShowConfig] = useState(false);
  const [selectedSources, setSelectedSources] = useState<LeadSource[]>(["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING", "SIRENE", "BODACC", "DPE_ADEME", "BOAMP", "PERMIS_CONSTRUIRE", "LINKEDIN", "INFOGREFFE", "PAPPERS", "CADASTRE_DVF", "FRANCE_TRAVAIL", "ANNONCES_LEGALES"]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [surfaceMin, setSurfaceMin] = useState(1000);
  const [maxResults, setMaxResults] = useState(20);

  // Filters
  const [filterSource, setFilterSource] = useState<string>("TOUS");
  const [filterScore, setFilterScore] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Result feedback
  const [lastResult, setLastResult] = useState<{ found: number; saved: number; duplicates: number } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, leadsRes] = await Promise.all([
        fetch("/api/prospection"),
        fetch("/api/leads?statut=TOUS"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (leadsRes.ok) {
        const leadsData: Lead[] = await leadsRes.json();
        // Only show prospection leads
        const prospectionSources = ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING", "SIRENE", "BODACC", "DPE_ADEME", "BOAMP", "PERMIS_CONSTRUIRE", "LINKEDIN", "INFOGREFFE", "PAPPERS", "CADASTRE_DVF", "FRANCE_TRAVAIL", "ANNONCES_LEGALES"];
        const prospectionLeads = leadsData.filter(
          (l) => prospectionSources.includes(l.source),
        );
        setLeads(prospectionLeads);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSearch() {
    setSearching(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/prospection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources: selectedSources,
          roles: selectedRoles.length > 0 ? selectedRoles : undefined,
          departements: selectedDepts.length > 0 ? selectedDepts : undefined,
          surfaceMin,
          maxResults,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastResult({ found: data.found, saved: data.saved, duplicates: data.duplicates });
        await fetchData();
      }
    } finally {
      setSearching(false);
    }
  }

  // Filter leads
  const filteredLeads = leads.filter((l) => {
    if (filterSource !== "TOUS" && l.source !== filterSource) return false;
    if (filterScore !== null && (l.score ?? 0) < filterScore) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeads = filteredLeads.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSource, filterScore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-tk-text-faint" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tk-text flex items-center gap-2">
            <Radar className="h-6 w-6 text-blue-500" />
            Prospection
          </h1>
          <p className="text-tk-text-faint">
            Agent de prospection automatique — {leads.length} leads trouvés
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="border-tk-border bg-tk-surface text-tk-text-secondary hover:bg-tk-hover"
          >
            <Filter className="mr-2 h-4 w-4" />
            Configurer
          </Button>
          <Button size="sm" onClick={handleSearch} disabled={searching}>
            {searching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Lancer la prospection
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Users className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-tk-text">{stats?.total ?? 0}</p>
                <p className="text-xs text-tk-text-faint">Leads prospectés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Star className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-tk-text">
                  {leads.filter((l) => (l.score ?? 0) >= 4).length}
                </p>
                <p className="text-xs text-tk-text-faint">Leads 4+ étoiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-tk-text">
                  {leads.filter((l) => l.statut === "CONTACTE" || l.statut === "QUALIFIE").length}
                </p>
                <p className="text-xs text-tk-text-faint">En cours de suivi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Target className="h-4 w-4 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-tk-text">
                  {stats?.bySource?.length ?? 0}
                </p>
                <p className="text-xs text-tk-text-faint">Sources actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last result feedback */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-tk-text">
                  Prospection terminée : {lastResult.found} résultats trouvés
                </p>
                <p className="text-xs text-tk-text-faint">
                  {lastResult.saved} nouveaux leads enregistrés · {lastResult.duplicates} doublons ignorés
                </p>
              </div>
              <button
                onClick={() => setLastResult(null)}
                className="ml-auto text-tk-text-faint hover:text-tk-text"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Config Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-tk-text">Configuration de la prospection</h3>

              {/* Sources */}
              <div>
                <label className="text-xs font-medium text-tk-text-muted mb-2 block">Sources de recherche</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(SOURCE_LABELS) as [LeadSource, typeof SOURCE_LABELS[string]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const selected = selectedSources.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedSources(
                          selected
                            ? selectedSources.filter((s) => s !== key)
                            : [...selectedSources, key],
                        )}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                          selected
                            ? "border-blue-500/30 bg-blue-500/10 text-tk-text font-medium"
                            : "border-tk-border bg-tk-surface text-tk-text-muted hover:bg-tk-hover",
                        )}
                      >
                        <div className={cn("rounded-md p-1", cfg.color)}>
                          <Icon className="h-3 w-3" />
                        </div>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Roles cibles */}
              <div>
                <label className="text-xs font-medium text-tk-text-muted mb-2 block">
                  Rôles cibles (vide = tous)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_OPTIONS.map((role) => {
                    const selected = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRoles(
                          selected
                            ? selectedRoles.filter((r) => r !== role)
                            : [...selectedRoles, role],
                        )}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selected
                            ? "border-blue-500/30 bg-blue-500/10 text-tk-text font-medium"
                            : "border-tk-border text-tk-text-muted hover:bg-tk-hover",
                        )}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Départements */}
              <div>
                <label className="text-xs font-medium text-tk-text-muted mb-2 block">
                  Départements (vide = IDF + 100km)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEPT_OPTIONS.map((dept) => {
                    const selected = selectedDepts.includes(dept.value);
                    return (
                      <button
                        key={dept.value}
                        onClick={() => setSelectedDepts(
                          selected
                            ? selectedDepts.filter((d) => d !== dept.value)
                            : [...selectedDepts, dept.value],
                        )}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selected
                            ? "border-blue-500/30 bg-blue-500/10 text-tk-text font-medium"
                            : "border-tk-border text-tk-text-muted hover:bg-tk-hover",
                        )}
                      >
                        {dept.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Surface & Max results */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-tk-text-muted mb-1.5 block">
                    Surface min. bâtiment (m²)
                  </label>
                  <input
                    type="number"
                    value={surfaceMin}
                    onChange={(e) => setSurfaceMin(Number(e.target.value) || 1000)}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-tk-text-muted mb-1.5 block">
                    Nombre max. de résultats
                  </label>
                  <input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value) || 20)}
                    className="w-full rounded-lg border border-tk-border bg-tk-surface px-3 py-2 text-sm text-tk-text"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        {/* Sources — wrapped grid */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-3.5 w-3.5 text-tk-text-faint" />
            <span className="text-xs font-medium text-tk-text-muted">Sources</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["TOUS", ...Object.keys(SOURCE_LABELS)].map((s) => {
              const cfg = SOURCE_LABELS[s];
              const Icon = cfg?.icon;
              const isActive = filterSource === s;
              const count = s === "TOUS"
                ? leads.length
                : leads.filter((l) => l.source === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilterSource(s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                    isActive
                      ? "border-blue-500/30 bg-blue-500/10 text-tk-text font-medium"
                      : "border-tk-border bg-tk-surface text-tk-text-muted hover:bg-tk-hover hover:text-tk-text-secondary",
                  )}
                >
                  {Icon && (
                    <div className={cn("rounded p-0.5", isActive ? "text-blue-500" : cfg?.color)}>
                      <Icon className="h-3 w-3" />
                    </div>
                  )}
                  {s === "TOUS" ? "Tous" : cfg?.label ?? s}
                  <span className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                    isActive ? "bg-blue-500/20 text-blue-400" : "bg-tk-hover text-tk-text-faint",
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Score — inline */}
        <div className="flex items-center gap-3 pt-1 border-t border-tk-border">
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-tk-text-faint" />
            <span className="text-xs font-medium text-tk-text-muted">Score min.</span>
          </div>
          <div className="flex gap-1">
            {[null, 3, 4, 5].map((score) => (
              <button
                key={score ?? "all"}
                onClick={() => setFilterScore(score)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                  filterScore === score
                    ? "border-amber-500/30 bg-amber-500/10 text-tk-text font-medium"
                    : "border-tk-border bg-tk-surface text-tk-text-muted hover:bg-tk-hover",
                )}
              >
                {score === null ? "Tous" : `${score}+ ★`}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-tk-text-faint">
            {filteredLeads.length} résultat{filteredLeads.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Results table */}
      <div className="glass rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto overflow-x-auto max-h-[calc(100vh-420px)] min-h-[380px] scroll-smooth [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-tk-border [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-tk-text-faint/40">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-tk-surface/95 backdrop-blur-sm">
            <TableRow className="border-tk-border hover:bg-transparent">
              <TableHead>Score</TableHead>
              <TableHead>Entreprise / Contact</TableHead>
              <TableHead>Rôle cible</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Localisation</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.map((lead) => {
              const sourceCfg = SOURCE_LABELS[lead.source];
              const SourceIcon = sourceCfg?.icon ?? Globe;
              return (
                <TableRow key={lead.id} className="group border-tk-border hover:bg-tk-hover">
                  <TableCell>
                    <StarRating score={lead.score ?? 0} />
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/leads/${lead.id}`} className="block">
                      <p className="font-medium text-tk-text">
                        {lead.raisonSociale || (lead.prenom ? `${lead.prenom} ${lead.nom}` : lead.nom)}
                      </p>
                      {lead.raisonSociale && (
                        <p className="text-[10px] text-tk-text-faint">
                          {lead.prenom ? `${lead.prenom} ${lead.nom}` : lead.nom}
                        </p>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-tk-hover px-2 py-0.5 text-[10px] text-tk-text-muted">
                      {lead.roleCible || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-xs text-tk-text-secondary">
                        <Mail className="h-3 w-3 text-tk-text-faint" /> {lead.email}
                      </span>
                      {lead.telephone && (
                        <span className="flex items-center gap-1 text-xs text-tk-text-muted">
                          <Phone className="h-3 w-3" /> {lead.telephone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-tk-text-muted">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {lead.adresse
                          ? `${lead.adresse}${lead.ville ? `, ${lead.ville}` : ""}${lead.codePostal ? ` ${lead.codePostal}` : ""}`
                          : lead.ville
                            ? `${lead.ville}${lead.departement ? ` (${lead.departement})` : ""}`
                            : lead.departement || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("rounded-md p-1", sourceCfg?.color ?? "bg-gray-100")}>
                        <SourceIcon className="h-3 w-3" />
                      </div>
                      <span className="text-xs text-tk-text-muted">{sourceCfg?.label ?? lead.source}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge statut={lead.statut} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/leads/${lead.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-tk-text-muted hover:text-tk-text">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      {lead.sourceUrl && (
                        <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-tk-text-muted hover:text-blue-400">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedLeads.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Radar className="h-10 w-10 text-tk-text-faint/30" />
                    <p className="text-tk-text-faint">
                      {leads.length === 0
                        ? "Aucun lead trouvé. Lancez votre première prospection !"
                        : "Aucun lead pour ces filtres"}
                    </p>
                    {leads.length === 0 && (
                      <Button size="sm" onClick={handleSearch} disabled={searching}>
                        <Search className="mr-2 h-4 w-4" />
                        Lancer la prospection
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-tk-border px-4 py-3">
            <p className="text-xs text-tk-text-faint">
              {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filteredLeads.length)} sur {filteredLeads.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="rounded-lg border border-tk-border px-2 py-1.5 text-xs text-tk-text-muted hover:bg-tk-hover disabled:opacity-30 disabled:pointer-events-none"
              >
                1
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-tk-border p-1.5 text-tk-text-muted hover:bg-tk-hover disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-3 py-1.5 text-xs font-medium text-tk-text">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg border border-tk-border p-1.5 text-tk-text-muted hover:bg-tk-hover disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="rounded-lg border border-tk-border px-2 py-1.5 text-xs text-tk-text-muted hover:bg-tk-hover disabled:opacity-30 disabled:pointer-events-none"
              >
                {totalPages}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Distribution by role & department */}
      {stats && (stats.byRole.length > 0 || stats.byDepartement.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {stats.byRole.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-tk-text mb-4">Répartition par rôle cible</h3>
              <div className="space-y-2">
                {stats.byRole.map((r) => (
                  <div key={r.role} className="flex items-center justify-between">
                    <span className="text-sm text-tk-text-secondary">{r.role || "Non défini"}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-blue-500/20 w-24 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.min(100, (r.count / (stats.total || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-tk-text-muted w-8 text-right">{r.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.byDepartement.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-tk-text mb-4">Répartition par département</h3>
              <div className="space-y-2">
                {stats.byDepartement.map((d) => (
                  <div key={d.dept} className="flex items-center justify-between">
                    <span className="text-sm text-tk-text-secondary">{d.dept || "Non défini"}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-emerald-500/20 w-24 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, (d.count / (stats.total || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-tk-text-muted w-8 text-right">{d.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
