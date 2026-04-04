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
  User,
  Trash2,
  Pencil,
  X,
  Loader2,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

type EvenementType = "VISITE" | "RDV_CLIENT" | "REUNION" | "AUTRE";

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
  VISITE: { label: "Visite technique", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", dot: "bg-blue-500" },
  RDV_CLIENT: { label: "RDV client", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", dot: "bg-amber-500" },
  REUNION: { label: "Réunion", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", dot: "bg-violet-500" },
  AUTRE: { label: "Autre", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300", dot: "bg-zinc-400" },
};

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

function entityName(e: AssignedEntity): string {
  return e.prenom ? `${e.prenom} ${e.nom}` : e.nom;
}

// ─── Page ───────────────────────────────────────────────────────

export default function CalendrierPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground capitalize">
            {formatDateFr(selectedDate)}
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau RDV
        </Button>
      </div>

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

        {/* RDVs du jour + formulaire */}
        <div className="space-y-4">
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

          {/* Liste des RDVs */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : rdvsJour.length === 0 ? (
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
              {rdvsJour.map((evt, i) => {
                const cfg = TYPE_CONFIG[evt.type];
                const assigned = evt.client || evt.lead;
                const assignLabel = evt.client ? "Client" : evt.lead ? "Lead" : null;

                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
