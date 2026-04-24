"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  UserPlus,
  Hammer,
  ArrowRight,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Evenement {
  id: string;
  titre: string;
  date: string;
  heureDebut: string;
  type: string;
  lieu?: string | null;
  client?: { nom: string; prenom?: string | null } | null;
  lead?: { nom: string; prenom?: string | null } | null;
}

interface Lead {
  id: string;
  nom: string;
  prenom?: string | null;
  raisonSociale?: string | null;
  statut: string;
  dateCreation?: string;
  createdAt?: string;
}

interface Projet {
  id: string;
  titre: string;
  statut: string;
  dateFin: string | null;
  client?: { nom: string; prenom?: string | null } | null;
}

interface Data {
  rdv: Evenement[];
  leads: Lead[];
  projets: Projet[];
}

const WEEKDAY = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTH = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function formatEventDate(iso: string, heure: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  let day: string;
  if (diff === 0) day = "Aujourd'hui";
  else if (diff === 1) day = "Demain";
  else if (diff > 1 && diff < 7)
    day = WEEKDAY[d.getDay()] + " " + d.getDate();
  else day = `${d.getDate()} ${MONTH[d.getMonth()]}`;
  return `${day} · ${heure.slice(0, 5)}`;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return `${d.getDate()} ${MONTH[d.getMonth()]}`;
}

function formatDeadline(iso: string | null): {
  label: string;
  tone: "danger" | "warn" | "muted";
} {
  if (!iso) return { label: "sans échéance", tone: "muted" };
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `en retard de ${-diff} j`, tone: "danger" };
  if (diff === 0) return { label: "échéance aujourd'hui", tone: "danger" };
  if (diff === 1) return { label: "échéance demain", tone: "warn" };
  if (diff <= 7) return { label: `dans ${diff} j`, tone: "warn" };
  return { label: `${d.getDate()} ${MONTH[d.getMonth()]}`, tone: "muted" };
}

function leadDisplayName(l: Lead): string {
  if (l.raisonSociale) return l.raisonSociale;
  return [l.prenom, l.nom].filter(Boolean).join(" ") || l.nom;
}

function clientOf(e: Evenement): string | null {
  const c = e.client ?? e.lead;
  if (!c) return null;
  return [c.prenom, c.nom].filter(Boolean).join(" ") || c.nom;
}

export default function NotificationPopover({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Data>({ rdv: [], leads: [], projets: [] });
  const [loading, setLoading] = useState(false);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (panelRef.current.contains(target)) return;
      // Ignore clicks on the bell trigger (it toggles itself)
      const trigger = document.querySelector("[data-notification-trigger]");
      if (trigger && trigger.contains(target)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Fetch on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    const mois = new Date().toISOString().slice(0, 7);
    const nextMonth = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 7);
    })();

    Promise.all([
      fetch(`/api/evenements?mois=${mois}`).then((r) =>
        r.ok ? r.json() : [],
      ),
      fetch(`/api/evenements?mois=${nextMonth}`).then((r) =>
        r.ok ? r.json() : [],
      ),
      fetch(`/api/leads`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/projets?statut=EN_COURS`).then((r) =>
        r.ok ? r.json() : [],
      ),
    ])
      .then(([evA, evB, leads, projets]: [Evenement[], Evenement[], Lead[], Projet[]]) => {
        if (cancelled) return;
        const now = new Date();
        const rdv = [...evA, ...evB]
          .filter((e) => new Date(e.date) >= new Date(now.toDateString()))
          .sort((a, b) => {
            const da = new Date(a.date).getTime();
            const db = new Date(b.date).getTime();
            if (da !== db) return da - db;
            return a.heureDebut.localeCompare(b.heureDebut);
          })
          .slice(0, 4);

        const newLeads = leads
          .filter((l) => l.statut === "NOUVEAU")
          .sort((a, b) => {
            const da = a.dateCreation ?? a.createdAt ?? "";
            const db = b.dateCreation ?? b.createdAt ?? "";
            return db.localeCompare(da);
          })
          .slice(0, 4);

        const toFinish = projets
          .sort((a, b) => {
            const da = a.dateFin ? new Date(a.dateFin).getTime() : Infinity;
            const db = b.dateFin ? new Date(b.dateFin).getTime() : Infinity;
            return da - db;
          })
          .slice(0, 4);

        setData({ rdv, leads: newLeads, projets: toFinish });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const totalCount = useMemo(
    () => data.rdv.length + data.leads.length + data.projets.length,
    [data],
  );

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-4 top-[56px] z-50 w-[380px] overflow-hidden rounded-xl border border-tk-border bg-tk-surface shadow-2xl ring-1 ring-black/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-tk-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[0.8rem] font-semibold text-tk-text">
            Notifications
          </span>
          {totalCount > 0 && (
            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-tk-primary/10 px-1.5 text-[0.68rem] font-semibold text-tk-primary">
              {totalCount}
            </span>
          )}
        </div>
        <span className="text-[0.7rem] text-tk-text-muted">
          Activité récente
        </span>
      </div>

      {/* Body */}
      <div className="max-h-[480px] overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : totalCount === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Section
              icon={<CalendarDays className="h-[13px] w-[13px]" />}
              title="Rendez-vous à venir"
              count={data.rdv.length}
              href="/dashboard/calendrier"
              onNavigate={onClose}
            >
              {data.rdv.map((e) => (
                <Link
                  key={e.id}
                  href="/dashboard/calendrier"
                  onClick={onClose}
                  className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-tk-bg"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-tk-primary/10 text-tk-primary">
                    <CalendarDays className="h-[13px] w-[13px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.78rem] font-medium text-tk-text">
                      {e.titre}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-tk-text-muted">
                      <span>{formatEventDate(e.date, e.heureDebut)}</span>
                      {clientOf(e) && (
                        <>
                          <span className="text-tk-text-faint">·</span>
                          <span className="truncate">{clientOf(e)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </Section>

            {data.leads.length > 0 && (
              <div className="border-t border-tk-border" />
            )}

            <Section
              icon={<UserPlus className="h-[13px] w-[13px]" />}
              title="Nouveaux leads"
              count={data.leads.length}
              href="/dashboard/leads"
              onNavigate={onClose}
            >
              {data.leads.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/leads/${l.id}`}
                  onClick={onClose}
                  className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-tk-bg"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <UserPlus className="h-[13px] w-[13px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.78rem] font-medium text-tk-text">
                      {leadDisplayName(l)}
                    </div>
                    <div className="mt-0.5 text-[0.7rem] text-tk-text-muted">
                      {formatRelative(l.dateCreation ?? l.createdAt ?? "")}
                    </div>
                  </div>
                  <ArrowRight className="mt-2 h-3 w-3 shrink-0 text-tk-text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </Section>

            {data.projets.length > 0 && (
              <div className="border-t border-tk-border" />
            )}

            <Section
              icon={<Hammer className="h-[13px] w-[13px]" />}
              title="Projets à terminer"
              count={data.projets.length}
              href="/dashboard/projets"
              onNavigate={onClose}
            >
              {data.projets.map((p) => {
                const dl = formatDeadline(p.dateFin);
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/projets/${p.id}`}
                    onClick={onClose}
                    className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-tk-bg"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Hammer className="h-[13px] w-[13px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.78rem] font-medium text-tk-text">
                        {p.titre}
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 text-[0.7rem]",
                          dl.tone === "danger" &&
                            "text-red-600 dark:text-red-400",
                          dl.tone === "warn" &&
                            "text-amber-600 dark:text-amber-400",
                          dl.tone === "muted" && "text-tk-text-muted",
                        )}
                      >
                        {dl.label}
                      </div>
                    </div>
                    <ArrowRight className="mt-2 h-3 w-3 shrink-0 text-tk-text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                );
              })}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  count,
  href,
  onNavigate,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-tk-text-muted">
          <span className="text-tk-text-faint">{icon}</span>
          {title}
        </div>
        <Link
          href={href}
          onClick={onNavigate}
          className="text-[0.68rem] font-medium text-tk-primary hover:underline"
        >
          Tout voir
        </Link>
      </div>
      <div>{children}</div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 p-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md p-2"
        >
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-md bg-tk-bg" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-3/4 animate-pulse rounded bg-tk-bg" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-tk-bg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tk-bg text-tk-text-faint">
        <Inbox className="h-4 w-4" />
      </div>
      <div className="mt-3 text-[0.8rem] font-medium text-tk-text">
        Tout est à jour
      </div>
      <div className="mt-0.5 text-[0.72rem] text-tk-text-muted">
        Aucun rendez-vous, lead ou projet à traiter.
      </div>
    </div>
  );
}
