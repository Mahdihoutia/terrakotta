"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Clock,
  MapPin,
  Trash2,
  Pencil,
  X,
  Loader2,
  UserCheck,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

type EvenementType =
  | "VISITE"
  | "VISITE_TECHNIQUE"
  | "RECEPTION_CHANTIER"
  | "AUDIT_ENERGETIQUE"
  | "REUNION_CHANTIER"
  | "RDV_CLIENT"
  | "REUNION"
  | "AUTRE";

type CalendarView = "month" | "week" | "day";

interface AssignedEntity {
  id: string;
  nom: string;
  prenom?: string | null;
  type: string;
}

interface Evenement {
  id: string;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  type: EvenementType;
  lieu?: string | null;
  commentaire?: string | null;
  clientId?: string | null;
  leadId?: string | null;
  client?: AssignedEntity | null;
  lead?: AssignedEntity | null;
}

interface FormData {
  titre: string;
  heureDebut: string;
  heureFin: string;
  type: EvenementType;
  lieu: string;
  commentaire: string;
  assignType: "none" | "client" | "lead";
  assignId: string;
}

const EMPTY_FORM: FormData = {
  titre: "",
  heureDebut: "09:00",
  heureFin: "10:00",
  type: "RDV_CLIENT",
  lieu: "",
  commentaire: "",
  assignType: "none",
  assignId: "",
};

// ─── Config ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EvenementType, { label: string; color: string; dot: string }> = {
  VISITE: { label: "Visite", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", dot: "bg-blue-500" },
  VISITE_TECHNIQUE: { label: "Visite technique", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300", dot: "bg-teal-500" },
  RECEPTION_CHANTIER: { label: "Réception chantier", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", dot: "bg-green-500" },
  AUDIT_ENERGETIQUE: { label: "Audit énergétique", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", dot: "bg-orange-500" },
  REUNION_CHANTIER: { label: "Réunion de chantier", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", dot: "bg-indigo-500" },
  RDV_CLIENT: { label: "RDV client", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", dot: "bg-amber-500" },
  REUNION: { label: "Réunion", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", dot: "bg-violet-500" },
  AUTRE: { label: "Autre", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300", dot: "bg-zinc-400" },
};

const VIEW_LABELS: Record<CalendarView, string> = {
  month: "Mois",
  week: "Semaine",
  day: "Jour",
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h à 20h
const HOUR_HEIGHT = 64; // px par heure

// ─── Helpers ────────────────────────────────────────────────────

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatMoisKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShortFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function entityName(e: AssignedEntity): string {
  return e.prenom ? `${e.prenom} ${e.nom}` : e.nom;
}

function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekDays(d: Date): Date[] {
  const monday = getMonday(d);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function eventTopAndHeight(heureDebut: string, heureFin: string): { top: number; height: number } {
  const startMin = timeToMinutes(heureDebut);
  const endMin = timeToMinutes(heureFin);
  const originMin = 7 * 60; // 7h00
  const top = ((startMin - originMin) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

// ─── Page ───────────────────────────────────────────────────────

export default function CalendrierPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentView, setCurrentView] = useState<CalendarView>("month");

  // Formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  // Clients & Leads pour l'assignation
  const [clients, setClients] = useState<AssignedEntity[]>([]);
  const [leads, setLeads] = useState<AssignedEntity[]>([]);

  const selectedKey = formatDateKey(selectedDate);
  const moisKey = formatMoisKey(selectedDate);

  // ─── Fetch événements du mois ─────────────────────────────

  const fetchEvenements = useCallback(async () => {
    try {
      const res = await fetch(`/api/evenements?mois=${moisKey}`);
      if (res.ok) {
        const data: Evenement[] = await res.json();
        setEvenements(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [moisKey]);

  useEffect(() => {
    setLoading(true);
    fetchEvenements();
  }, [fetchEvenements]);

  // ─── Fetch clients & leads (une seule fois) ──────────────

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/leads").then((r) => r.json()),
    ])
      .then(([c, l]) => {
        setClients(
          (c as AssignedEntity[]).map((x) => ({ id: x.id, nom: x.nom, prenom: x.prenom, type: x.type }))
        );
        setLeads(
          (l as AssignedEntity[]).map((x) => ({ id: x.id, nom: x.nom, prenom: x.prenom, type: x.type }))
        );
      })
      .catch(() => {});
  }, []);

  // ─── Événements du jour ───────────────────────────────────

  const rdvsJour = useMemo(
    () =>
      evenements
        .filter((e) => e.date.startsWith(selectedKey))
        .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
    [evenements, selectedKey]
  );

  const datesAvecRdv = useMemo(() => {
    const map = new Map<string, string[]>();
    evenements.forEach((e) => {
      const key = e.date.substring(0, 10);
      const types = map.get(key) || [];
      types.push(e.type);
      map.set(key, types);
    });
    return map;
  }, [evenements]);

  // ─── Semaine courante ─────────────────────────────────────

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const eventsForDay = useCallback(
    (date: Date) => {
      const key = formatDateKey(date);
      return evenements
        .filter((e) => e.date.startsWith(key))
        .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    },
    [evenements]
  );

  // ─── Navigation semaine/jour ──────────────────────────────

  function navigatePrev() {
    const d = new Date(selectedDate);
    if (currentView === "week") {
      d.setDate(d.getDate() - 7);
    } else if (currentView === "day") {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d);
  }

  function navigateNext() {
    const d = new Date(selectedDate);
    if (currentView === "week") {
      d.setDate(d.getDate() + 7);
    } else if (currentView === "day") {
      d.setDate(d.getDate() + 1);
    }
    setSelectedDate(d);
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  // ─── Ouvrir le formulaire ─────────────────────────────────

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(evt: Evenement) {
    setEditingId(evt.id);
    setForm({
      titre: evt.titre,
      heureDebut: evt.heureDebut,
      heureFin: evt.heureFin,
      type: evt.type,
      lieu: evt.lieu || "",
      commentaire: evt.commentaire || "",
      assignType: evt.clientId ? "client" : evt.leadId ? "lead" : "none",
      assignId: evt.clientId || evt.leadId || "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  // ─── Sauvegarder (créer ou modifier) ─────────────────────

  async function handleSave() {
    if (!form.titre.trim()) return;
    setSaving(true);

    const payload = {
      titre: form.titre,
      date: selectedKey,
      heureDebut: form.heureDebut,
      heureFin: form.heureFin,
      type: form.type,
      lieu: form.lieu || null,
      commentaire: form.commentaire || null,
      clientId: form.assignType === "client" ? form.assignId : null,
      leadId: form.assignType === "lead" ? form.assignId : null,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/evenements/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated: Evenement = await res.json();
          setEvenements((prev) =>
            prev.map((e) => (e.id === editingId ? updated : e))
          );
        }
      } else {
        const res = await fetch("/api/evenements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created: Evenement = await res.json();
          setEvenements((prev) => [...prev, created]);
        }
      }
      closeForm();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  // ─── Supprimer ────────────────────────────────────────────

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/evenements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvenements((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  // ─── Mettre à jour le formulaire ──────────────────────────

  function updateForm(patch: Partial<FormData>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      // Reset assignId when changing assignType
      if (patch.assignType && patch.assignType !== prev.assignType) {
        next.assignId = "";
      }
      return next;
    });
  }

  const assignOptions = form.assignType === "client" ? clients : form.assignType === "lead" ? leads : [];

  // ─── Composant : Carte événement (liste du mois) ─────────

  function EventCard({ evt, index }: { evt: Evenement; index: number }) {
    const cfg = TYPE_CONFIG[evt.type];
    const assigned = evt.client || evt.lead;
    const assignLabel = evt.client ? "Client" : evt.lead ? "Lead" : null;

    return (
      <motion.div
        key={evt.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="group relative overflow-hidden">
          <div className={cn("absolute left-0 top-0 h-full w-1", cfg.dot)} />
          <CardContent className="p-4 pl-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={cn("text-xs", cfg.color)}>
                    {cfg.label}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {evt.heureDebut} — {evt.heureFin}
                  </span>
                </div>
                <h3 className="font-semibold text-sm">{evt.titre}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {assigned && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {evt.client ? (
                        <UserCheck className="h-3 w-3 text-tk-primary" />
                      ) : (
                        <Users className="h-3 w-3 text-blue-500" />
                      )}
                      <span className="font-medium">{assignLabel}</span>: {entityName(assigned)}
                    </span>
                  )}
                  {evt.lieu && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {evt.lieu}
                    </span>
                  )}
                </div>
                {evt.commentaire && (
                  <p className="text-xs text-muted-foreground leading-relaxed rounded-lg bg-muted/50 p-2.5 mt-1">
                    {evt.commentaire}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0 ml-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(evt)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(evt.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── Composant : Bloc événement (semaine / jour) ──────────

  function TimelineEvent({ evt, compact = false }: { evt: Evenement; compact?: boolean }) {
    const cfg = TYPE_CONFIG[evt.type];
    const { top, height } = eventTopAndHeight(evt.heureDebut, evt.heureFin);

    return (
      <div
        className={cn(
          "absolute left-0.5 right-0.5 rounded-md border px-1.5 py-1 overflow-hidden cursor-pointer group/evt transition-shadow hover:shadow-md",
          cfg.color,
          "border-current/10"
        )}
        style={{ top: `${top}px`, height: `${height}px`, minHeight: "24px" }}
        onClick={() => openEdit(evt)}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <p className={cn("font-medium leading-tight truncate", compact ? "text-[10px]" : "text-xs")}>
            {evt.titre}
          </p>
          {height >= 40 && (
            <span className={cn("leading-tight text-current/70 truncate", compact ? "text-[9px]" : "text-[11px]")}>
              {evt.heureDebut} — {evt.heureFin}
            </span>
          )}
          {height >= 60 && !compact && (
            <Badge className={cn("text-[9px] px-1 py-0 mt-0.5 w-fit", cfg.color)}>
              {cfg.label}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // ─── Composant : Grille horaire (colonnes) ────────────────

  function HourGrid({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
      <div className={cn("relative", className)} style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
        {/* Lignes horizontales */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/40"
            style={{ top: `${(h - 7) * HOUR_HEIGHT}px` }}
          />
        ))}
        {children}
      </div>
    );
  }

  // ─── Vue Semaine ──────────────────────────────────────────

  function WeekView() {
    return (
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[700px]">
            {/* En-tête des jours */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
              <div className="p-2 text-xs text-muted-foreground" />
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={formatDateKey(day)}
                    onClick={() => {
                      setSelectedDate(day);
                      setCurrentView("day");
                    }}
                    className={cn(
                      "p-2 text-center text-sm border-l transition-colors hover:bg-muted/50",
                      isToday && "bg-primary/5 font-semibold",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    <span className="capitalize">{formatDateShortFr(day)}</span>
                    {isToday && (
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Grille horaire */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {/* Colonne des heures */}
              <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 text-[11px] text-muted-foreground text-right pr-2 -translate-y-1/2"
                    style={{ top: `${(h - 7) * HOUR_HEIGHT}px` }}
                  >
                    {h}h
                  </div>
                ))}
              </div>

              {/* Colonnes des jours */}
              {weekDays.map((day) => {
                const dayEvents = eventsForDay(day);
                return (
                  <div key={formatDateKey(day)} className="border-l">
                    <HourGrid>
                      {dayEvents.map((evt) => (
                        <TimelineEvent key={evt.id} evt={evt} compact />
                      ))}
                    </HourGrid>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Vue Jour ─────────────────────────────────────────────

  function DayView() {
    const dayEvents = eventsForDay(selectedDate);

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base capitalize">
            {formatDayLabel(selectedDate)}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-y-auto">
          <div className="grid grid-cols-[60px_1fr]">
            {/* Colonne des heures */}
            <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 text-[11px] text-muted-foreground text-right pr-2 -translate-y-1/2"
                  style={{ top: `${(h - 7) * HOUR_HEIGHT}px` }}
                >
                  {h}h
                </div>
              ))}
            </div>

            {/* Colonne des événements */}
            <div className="border-l">
              <HourGrid>
                {dayEvents.map((evt) => (
                  <TimelineEvent key={evt.id} evt={evt} />
                ))}

                {/* Indicateur heure courante */}
                {isSameDay(selectedDate, new Date()) && (() => {
                  const now = new Date();
                  const minutes = now.getHours() * 60 + now.getMinutes();
                  const originMin = 7 * 60;
                  if (minutes >= originMin && minutes <= 20 * 60) {
                    const top = ((minutes - originMin) / 60) * HOUR_HEIGHT;
                    return (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none"
                        style={{ top: `${top}px` }}
                      >
                        <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
                      </div>
                    );
                  }
                  return null;
                })()}
              </HourGrid>
            </div>
          </div>

          {/* Liste détaillée sous la timeline */}
          {dayEvents.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {dayEvents.length} événement{dayEvents.length > 1 ? "s" : ""}
              </h4>
              {dayEvents.map((evt, i) => (
                <EventCard key={evt.id} evt={evt} index={i} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Formulaire (partagé) ─────────────────────────────────

  function EventForm() {
    return (
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {editingId ? "Modifier le rendez-vous" : "Nouveau rendez-vous"} — {formatDateFr(selectedDate)}
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Titre */}
                  <div className="col-span-full space-y-1.5">
                    <label className="text-sm font-medium">Titre</label>
                    <input
                      type="text"
                      value={form.titre}
                      onChange={(e) => updateForm({ titre: e.target.value })}
                      placeholder="Ex: Visite technique — Nom du client"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Heures */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Heure début</label>
                    <input
                      type="time"
                      value={form.heureDebut}
                      onChange={(e) => updateForm({ heureDebut: e.target.value })}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Heure fin</label>
                    <input
                      type="time"
                      value={form.heureFin}
                      onChange={(e) => updateForm({ heureFin: e.target.value })}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => updateForm({ type: e.target.value as EvenementType })}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assignation Client / Lead */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Assigner à</label>
                    <select
                      value={form.assignType}
                      onChange={(e) => updateForm({ assignType: e.target.value as FormData["assignType"] })}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="none">— Aucun —</option>
                      <option value="client">Client</option>
                      <option value="lead">Lead</option>
                    </select>
                  </div>

                  {/* Sélection du client ou lead */}
                  {form.assignType !== "none" && (
                    <div className="col-span-full space-y-1.5">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        {form.assignType === "client" ? (
                          <><UserCheck className="h-3.5 w-3.5" /> Choisir un client</>
                        ) : (
                          <><Users className="h-3.5 w-3.5" /> Choisir un lead</>
                        )}
                      </label>
                      <select
                        value={form.assignId}
                        onChange={(e) => updateForm({ assignId: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      >
                        <option value="">— Sélectionner —</option>
                        {assignOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {entityName(opt)} ({opt.type.toLowerCase()})
                          </option>
                        ))}
                      </select>
                      {assignOptions.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Aucun {form.assignType === "client" ? "client" : "lead"} trouvé
                        </p>
                      )}
                    </div>
                  )}

                  {/* Lieu */}
                  <div className="col-span-full space-y-1.5">
                    <label className="text-sm font-medium">Lieu</label>
                    <input
                      type="text"
                      value={form.lieu}
                      onChange={(e) => updateForm({ lieu: e.target.value })}
                      placeholder="Adresse du rendez-vous"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Commentaire */}
                  <div className="col-span-full space-y-1.5">
                    <label className="text-sm font-medium">Commentaire</label>
                    <textarea
                      value={form.commentaire}
                      onChange={(e) => updateForm({ commentaire: e.target.value })}
                      rows={3}
                      placeholder="Notes, matériel à apporter, points à vérifier..."
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving || !form.titre.trim()}>
                    {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    {editingId ? "Enregistrer" : "Ajouter le RDV"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={closeForm}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* En-tête avec titre, sélecteur de vue et bouton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground capitalize">
            {formatDateFr(selectedDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sélecteur de vue */}
          <div className="flex rounded-lg border bg-muted/30 p-0.5">
            {(["month", "week", "day"] as CalendarView[]).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  currentView === view
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {VIEW_LABELS[view]}
              </button>
            ))}
          </div>

          {/* Navigation semaine/jour */}
          {currentView !== "month" && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToToday}>
                Aujourd&apos;hui
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      <EventForm />

      {/* Contenu selon la vue */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : currentView === "month" ? (
        /* ── Vue Mois ── */
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Calendrier */}
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                onMonthChange={(d) => setSelectedDate(d)}
                className="w-full"
                components={{
                  DayButton: ({ day, modifiers, ...props }) => {
                    const key = formatDateKey(day.date);
                    const types = datesAvecRdv.get(key);
                    return (
                      <button
                        {...props}
                        className={cn(
                          "relative flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors",
                          modifiers.selected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : modifiers.today
                              ? "bg-muted font-medium"
                              : "hover:bg-muted/60",
                          modifiers.outside && "text-muted-foreground/40"
                        )}
                      >
                        {day.date.getDate()}
                        {types && types.length > 0 && (
                          <span className="absolute bottom-0.5 flex gap-0.5">
                            {[...new Set(types)].slice(0, 3).map((t, i) => (
                              <span
                                key={i}
                                className={cn("h-1 w-1 rounded-full", TYPE_CONFIG[t as EvenementType]?.dot || "bg-zinc-400")}
                              />
                            ))}
                          </span>
                        )}
                      </button>
                    );
                  },
                }}
              />

              {/* Légende */}
              <div className="mt-4 flex flex-wrap gap-3 border-t pt-4">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                    <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* RDVs du jour */}
          <div className="space-y-4">
            {rdvsJour.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm font-medium">Aucun rendez-vous</p>
                  <p className="text-xs text-muted-foreground">
                    Pas de RDV prévu pour cette date
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={openCreate}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Ajouter un RDV
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {rdvsJour.map((evt, i) => (
                  <EventCard key={evt.id} evt={evt} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : currentView === "week" ? (
        <WeekView />
      ) : (
        <DayView />
      )}
    </div>
  );
}
