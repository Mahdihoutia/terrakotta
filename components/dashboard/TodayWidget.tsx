"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flag,
  FileText,
  CalendarClock,
  UserPlus,
  ArrowUpRight,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showNetworkError } from "@/lib/api-errors";

// ─── Types ───────────────────────────────────────────────────────

interface JalonItem {
  id: string;
  titre: string;
  echeance: string;
  projet: { id: string; titre: string };
}

interface DevisItem {
  id: string;
  numero: string;
  objet: string | null;
  montantTTC: number;
  updatedAt: string;
  client: {
    id: string;
    nom: string;
    prenom: string | null;
    email: string | null;
  };
}

interface EvenementItem {
  id: string;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  type: string;
  lieu: string | null;
  client: { id: string; nom: string; prenom: string | null } | null;
  lead: { id: string; nom: string; prenom: string | null } | null;
}

interface LeadItem {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  score: number;
  dateCreation: string;
}

interface TodayResponse {
  jalons: JalonItem[];
  devis: DevisItem[];
  evenements: EvenementItem[];
  leads: LeadItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function fullName(p: { nom: string; prenom: string | null }): string {
  return p.prenom ? `${p.prenom} ${p.nom}` : p.nom;
}

function daysSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Renvoie un libellé d'urgence + style pour un jalon. */
function jalonUrgency(iso: string): { label: string; tone: string } {
  const echeance = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (echeance < startOfToday) {
    return {
      label: "EN RETARD",
      tone: "bg-red-500/15 text-red-400 border border-red-500/20",
    };
  }
  if (echeance <= endOfToday) {
    return {
      label: "AUJOURD'HUI",
      tone: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    };
  }
  return {
    label: "DEMAIN",
    tone: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  };
}

function formatHour(time: string): string {
  // "HH:mm" → "HH h mm" or strip
  return time;
}

/** Construit un mailto pour relance devis. */
function buildRelanceMailto(d: DevisItem): string {
  if (!d.client.email) return "";
  const prenom = d.client.prenom ?? "";
  const nom = d.client.nom;
  const subject = `Relance devis ${d.numero}`;
  const body =
    `Bonjour ${prenom} ${nom},\n\n` +
    `Je reviens vers vous concernant le devis ${d.numero}` +
    (d.objet ? ` pour ${d.objet}` : "") +
    `.\n\nReste disponible pour toute question.\n\nCordialement.`;
  return `mailto:${d.client.email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

// ─── Card wrapper ────────────────────────────────────────────────

interface CardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  href: string;
  hrefLabel: string;
  children: React.ReactNode;
}

function TodayCard({ icon, title, count, href, hrefLabel, children }: CardProps) {
  return (
    <div className="flex h-[340px] flex-col rounded-2xl border border-tk-border bg-tk-surface">
      <div className="flex items-center justify-between border-b border-tk-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tk-hover text-tk-text-secondary">
            {icon}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-tk-text">{title}</p>
            <p className="text-[11px] text-tk-text-faint">
              {count} {count > 1 ? "éléments" : "élément"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">{children}</div>
      <div className="border-t border-tk-border px-4 py-2.5">
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-tk-text-secondary hover:text-tk-text"
        >
          {hrefLabel}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="flex h-full items-center justify-center px-4 py-8 text-center">
      <p className="text-xs text-tk-text-faint">{children}</p>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────

export default function TodayWidget() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard/today");
        if (!res.ok) {
          // L'endpoint renvoie déjà des listes vides en cas d'erreur DB,
          // donc un res.ok = false reste exceptionnel.
          if (!cancelled) setData({ jalons: [], devis: [], evenements: [], leads: [] });
          return;
        }
        const json = (await res.json()) as TodayResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        showNetworkError(err, "Impossible de charger les tâches du jour");
        if (!cancelled) setData({ jalons: [], devis: [], evenements: [], leads: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-2xl border border-tk-border bg-tk-surface">
        <Loader2 className="h-5 w-5 animate-spin text-tk-text-faint" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* ── Jalons ──────────────────────────────────────────── */}
      <TodayCard
        icon={<Flag className="h-3.5 w-3.5" />}
        title="Jalons à traiter"
        count={data.jalons.length}
        href="/dashboard/projets"
        hrefLabel="Voir les projets"
      >
        {data.jalons.length === 0 ? (
          <EmptyState>Rien à faire aujourd&apos;hui.</EmptyState>
        ) : (
          <ul className="space-y-1">
            {data.jalons.map((j) => {
              const u = jalonUrgency(j.echeance);
              return (
                <li key={j.id}>
                  <Link
                    href={`/dashboard/projets/${j.projet.id}`}
                    className="block rounded-lg px-2 py-2 transition-colors hover:bg-tk-hover"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-tk-text">
                        {j.titre}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                          u.tone
                        )}
                      >
                        {u.label}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[11px] text-tk-text-faint">
                      {j.projet.titre}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </TodayCard>

      {/* ── Devis à relancer ────────────────────────────────── */}
      <TodayCard
        icon={<FileText className="h-3.5 w-3.5" />}
        title="Devis à relancer"
        count={data.devis.length}
        href="/dashboard/devis"
        hrefLabel="Voir les devis"
      >
        {data.devis.length === 0 ? (
          <EmptyState>Aucun devis en attente de relance.</EmptyState>
        ) : (
          <ul className="space-y-1">
            {data.devis.map((d) => {
              const days = daysSince(d.updatedAt);
              const mailto = buildRelanceMailto(d);
              return (
                <li
                  key={d.id}
                  className="rounded-lg px-2 py-2 transition-colors hover:bg-tk-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/devis/${d.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="font-mono text-xs font-medium text-tk-text">
                        {d.numero}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-tk-text-faint">
                        {fullName(d.client)} · {formatCurrency(d.montantTTC)} TTC
                      </p>
                      <p className="text-[10px] text-tk-text-faint">
                        envoyé il y a {days} j
                      </p>
                    </Link>
                    {mailto && (
                      <a
                        href={mailto}
                        className="shrink-0 rounded-md border border-tk-border bg-tk-surface px-2 py-1 text-[10px] font-medium text-tk-text-secondary transition-colors hover:bg-tk-hover hover:text-tk-text"
                      >
                        Relancer
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </TodayCard>

      {/* ── RDV du jour ─────────────────────────────────────── */}
      <TodayCard
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        title="RDV du jour"
        count={data.evenements.length}
        href="/dashboard/calendrier"
        hrefLabel="Voir le calendrier"
      >
        {data.evenements.length === 0 ? (
          <EmptyState>Aucun rendez-vous aujourd&apos;hui.</EmptyState>
        ) : (
          <ul className="space-y-1">
            {data.evenements.map((e) => {
              const personne = e.client
                ? fullName(e.client)
                : e.lead
                ? fullName(e.lead)
                : null;
              return (
                <li
                  key={e.id}
                  className="rounded-lg px-2 py-2 transition-colors hover:bg-tk-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium text-tk-text">
                      {e.titre}
                    </p>
                    <span className="shrink-0 tabular-nums rounded-md bg-tk-hover px-1.5 py-0.5 text-[10px] font-medium text-tk-text-secondary">
                      {formatHour(e.heureDebut)}
                    </span>
                  </div>
                  {personne && (
                    <p className="line-clamp-1 text-[11px] text-tk-text-faint">
                      {personne}
                    </p>
                  )}
                  {e.lieu && (
                    <p className="line-clamp-1 text-[10px] text-tk-text-faint">
                      {e.lieu}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </TodayCard>

      {/* ── Leads à rappeler ────────────────────────────────── */}
      <TodayCard
        icon={<UserPlus className="h-3.5 w-3.5" />}
        title="Leads à rappeler"
        count={data.leads.length}
        href="/dashboard/leads"
        hrefLabel="Voir les leads"
      >
        {data.leads.length === 0 ? (
          <EmptyState>Aucun lead nouveau récent.</EmptyState>
        ) : (
          <ul className="space-y-1">
            {data.leads.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/dashboard/leads`}
                  className="block rounded-lg px-2 py-2 transition-colors hover:bg-tk-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-medium text-tk-text">
                      {fullName(l)}
                    </p>
                    <span className="flex shrink-0 items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < l.score
                              ? "fill-amber-400 text-amber-400"
                              : "text-tk-border"
                          )}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-[11px] text-tk-text-faint">
                    {l.email}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </TodayCard>
    </div>
  );
}
