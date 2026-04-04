"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Rdv {
  id: string;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  lieu?: string;
  client?: string;
  type: "VISITE" | "RDV_CLIENT" | "REUNION" | "AUTRE";
  commentaire?: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  VISITE: { label: "Visite technique", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  RDV_CLIENT: { label: "RDV client", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  REUNION: { label: "Réunion", color: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  AUTRE: { label: "Autre", color: "bg-zinc-100 text-zinc-700", dot: "bg-zinc-400" },
};

const DEMO_RDVS: Rdv[] = [
  {
    id: "1",
    titre: "Visite technique — Résidence Le Parc",
    date: "2026-04-02",
    heureDebut: "09:00",
    heureFin: "11:00",
    lieu: "12 rue des Oliviers, 13100 Aix-en-Provence",
    client: "Résidence Le Parc",
    type: "VISITE",
    commentaire: "Apporter le thermomètre infrarouge. Vérifier l'isolation des combles et l'état de la VMC.",
  },
  {
    id: "2",
    titre: "Présentation devis — Dupont",
    date: "2026-04-02",
    heureDebut: "14:00",
    heureFin: "15:00",
    client: "Marie Dupont",
    type: "RDV_CLIENT",
    commentaire: "Devis isolation combles + remplacement chaudière. Budget estimé 15k€.",
  },
  {
    id: "3",
    titre: "Réunion mairie — DPE collectif",
    date: "2026-04-03",
    heureDebut: "10:00",
    heureFin: "12:00",
    lieu: "Mairie de Salon-de-Provence",
    client: "Mairie de Salon",
    type: "REUNION",
    commentaire: "Présentation des résultats d'audit énergétique du patrimoine communal.",
  },
  {
    id: "4",
    titre: "Relevé thermique — Martin",
    date: "2026-04-07",
    heureDebut: "08:30",
    heureFin: "10:30",
    lieu: "45 avenue Jean Jaurès, 13400 Aubagne",
    client: "Jean-Pierre Martin",
    type: "VISITE",
  },
  {
    id: "5",
    titre: "Suivi chantier SCI Les Oliviers",
    date: "2026-04-10",
    heureDebut: "09:00",
    heureFin: "11:30",
    lieu: "Résidence Les Oliviers, 13008 Marseille",
    client: "SCI Les Oliviers",
    type: "VISITE",
    commentaire: "Vérifier l'avancement de l'isolation par l'extérieur. Photos à prendre pour le rapport.",
  },
  {
    id: "6",
    titre: "Appel partenaire CEE",
    date: "2026-04-04",
    heureDebut: "16:00",
    heureFin: "16:30",
    type: "AUTRE",
    commentaire: "Discuter des nouveaux barèmes CEE pour le T2 2026.",
  },
];

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CalendrierPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [rdvs, setRdvs] = useState<Rdv[]>(DEMO_RDVS);

  const [newRdv, setNewRdv] = useState({
    titre: "",
    heureDebut: "09:00",
    heureFin: "10:00",
    lieu: "",
    client: "",
    type: "RDV_CLIENT" as Rdv["type"],
    commentaire: "",
  });

  const selectedKey = formatDateKey(selectedDate);

  const rdvsJour = useMemo(
    () => rdvs.filter((r) => r.date === selectedKey).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
    [rdvs, selectedKey]
  );

  const datesAvecRdv = useMemo(() => {
    const map = new Map<string, string[]>();
    rdvs.forEach((r) => {
      const types = map.get(r.date) || [];
      types.push(r.type);
      map.set(r.date, types);
    });
    return map;
  }, [rdvs]);

  function handleAddRdv() {
    if (!newRdv.titre.trim()) return;
    const rdv: Rdv = {
      id: crypto.randomUUID(),
      ...newRdv,
      date: selectedKey,
    };
    setRdvs((prev) => [...prev, rdv]);
    setNewRdv({
      titre: "",
      heureDebut: "09:00",
      heureFin: "10:00",
      lieu: "",
      client: "",
      type: "RDV_CLIENT",
      commentaire: "",
    });
    setShowForm(false);
  }

  function handleDeleteRdv(id: string) {
    setRdvs((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground capitalize">
            {formatDateFr(selectedDate)}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
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
                              className={cn("h-1 w-1 rounded-full", TYPE_CONFIG[t]?.dot || "bg-zinc-400")}
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
                    <CardTitle className="text-base">
                      Nouveau rendez-vous — {formatDateFr(selectedDate)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="col-span-full space-y-1.5">
                        <label className="text-sm font-medium">Titre</label>
                        <input
                          type="text"
                          value={newRdv.titre}
                          onChange={(e) => setNewRdv({ ...newRdv, titre: e.target.value })}
                          placeholder="Ex: Visite technique — Nom du client"
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Heure début</label>
                        <input
                          type="time"
                          value={newRdv.heureDebut}
                          onChange={(e) => setNewRdv({ ...newRdv, heureDebut: e.target.value })}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Heure fin</label>
                        <input
                          type="time"
                          value={newRdv.heureFin}
                          onChange={(e) => setNewRdv({ ...newRdv, heureFin: e.target.value })}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Type</label>
                        <select
                          value={newRdv.type}
                          onChange={(e) => setNewRdv({ ...newRdv, type: e.target.value as Rdv["type"] })}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        >
                          <option value="VISITE">Visite technique</option>
                          <option value="RDV_CLIENT">RDV client</option>
                          <option value="REUNION">Réunion</option>
                          <option value="AUTRE">Autre</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Client</label>
                        <input
                          type="text"
                          value={newRdv.client}
                          onChange={(e) => setNewRdv({ ...newRdv, client: e.target.value })}
                          placeholder="Nom du client"
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="col-span-full space-y-1.5">
                        <label className="text-sm font-medium">Lieu</label>
                        <input
                          type="text"
                          value={newRdv.lieu}
                          onChange={(e) => setNewRdv({ ...newRdv, lieu: e.target.value })}
                          placeholder="Adresse du rendez-vous"
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="col-span-full space-y-1.5">
                        <label className="text-sm font-medium">Commentaire</label>
                        <textarea
                          value={newRdv.commentaire}
                          onChange={(e) => setNewRdv({ ...newRdv, commentaire: e.target.value })}
                          rows={3}
                          placeholder="Notes, matériel à apporter, points à vérifier..."
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddRdv}>
                        Ajouter le RDV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Liste des RDVs */}
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
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Ajouter un RDV
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rdvsJour.map((rdv, i) => {
                const cfg = TYPE_CONFIG[rdv.type];
                return (
                  <motion.div
                    key={rdv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="group relative overflow-hidden">
                      <div className={cn("absolute left-0 top-0 h-full w-1", cfg.dot)} />
                      <CardContent className="p-4 pl-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-xs", cfg.color)}>
                                {cfg.label}
                              </Badge>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {rdv.heureDebut} — {rdv.heureFin}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm">{rdv.titre}</h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {rdv.client && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {rdv.client}
                                </span>
                              )}
                              {rdv.lieu && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {rdv.lieu}
                                </span>
                              )}
                            </div>
                            {rdv.commentaire && (
                              <p className="text-xs text-muted-foreground leading-relaxed rounded-lg bg-muted/50 p-2.5 mt-1">
                                {rdv.commentaire}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => handleDeleteRdv(rdv.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
