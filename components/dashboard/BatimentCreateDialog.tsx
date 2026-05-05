"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X, Search, Library, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ZONES = [
  "H1a — Nord",
  "H1b — Nord-Est",
  "H1c — Est",
  "H2a — Nord-Ouest",
  "H2b — Ouest",
  "H2c — Sud-Ouest",
  "H2d — Centre",
  "H3 — Méditerranée",
];

interface BatimentLite {
  id: string;
  nom: string;
  description: string | null;
  zoneClimatique: string;
  projetId: string | null;
  zonesCount: number;
}

interface Props {
  projetId: string;
}

export default function BatimentCreateDialog({ projetId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"CREATE" | "LIBRARY">("CREATE");
  const [submitting, setSubmitting] = useState(false);

  // Form (CREATE mode)
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [zoneClimatique, setZoneClimatique] = useState(ZONES[0]);
  const [altitude, setAltitude] = useState("");
  const [orientation, setOrientation] = useState("");

  // Library (LIBRARY mode)
  const [library, setLibrary] = useState<BatimentLite[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [attaching, setAttaching] = useState<string | null>(null);

  function reset() {
    setNom(""); setDescription(""); setZoneClimatique(ZONES[0]);
    setAltitude(""); setOrientation(""); setSearch("");
  }

  // Fetch library when opening LIBRARY mode
  useEffect(() => {
    if (!open || mode !== "LIBRARY") return;
    setLibraryLoading(true);
    fetch("/api/batiments")
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((data: Array<{ id: string; nom: string; description: string | null; zoneClimatique: string; projetId: string | null; zones?: { id: string }[] }>) => {
        // Garder ceux qui ne sont pas déjà dans CE projet
        const filtered = data
          .filter((b) => b.projetId !== projetId)
          .map((b) => ({
            id: b.id,
            nom: b.nom,
            description: b.description,
            zoneClimatique: b.zoneClimatique,
            projetId: b.projetId,
            zonesCount: b.zones?.length ?? 0,
          }));
        setLibrary(filtered);
      })
      .catch(() => toast.error("Chargement de la bibliothèque impossible"))
      .finally(() => setLibraryLoading(false));
  }, [open, mode, projetId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error("Nom du bâtiment requis");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/batiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          description: description.trim() || null,
          zoneClimatique,
          altitude: altitude ? Number(altitude) : null,
          orientation: orientation.trim() || null,
          projetId,
        }),
      });
      if (!res.ok) {
        await showApiError(res, "Création impossible");
        return;
      }
      toast.success("Bâtiment créé");
      reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAttach(batimentId: string, currentProjetId: string | null) {
    if (currentProjetId) {
      const ok = confirm(
        "Ce bâtiment est déjà rattaché à un autre projet. Le déplacer vers ce projet ?",
      );
      if (!ok) return;
    }
    setAttaching(batimentId);
    try {
      const res = await fetch(`/api/batiments/${batimentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projetId }),
      });
      if (!res.ok) {
        await showApiError(res, "Rattachement impossible");
        return;
      }
      toast.success("Bâtiment rattaché au projet");
      setOpen(false);
      router.refresh();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setAttaching(null);
    }
  }

  const libraryFiltered = library.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.nom.toLowerCase().includes(q) ||
      (b.description ?? "").toLowerCase().includes(q) ||
      b.zoneClimatique.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="h-8">
        <Plus className="mr-1 h-3.5 w-3.5" />
        Nouveau bâtiment
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-xl border border-tk-border bg-tk-surface shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-[15px] font-semibold text-tk-text">Ajouter un bâtiment au projet</h2>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-tk-text-faint hover:bg-tk-hover">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-tk-border px-5 -mt-1">
              <TabBtn active={mode === "CREATE"} onClick={() => setMode("CREATE")} icon={FilePlus} label="Créer" />
              <TabBtn active={mode === "LIBRARY"} onClick={() => setMode("LIBRARY")} icon={Library} label="Depuis bibliothèque" />
            </div>

            {mode === "CREATE" ? (
              <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  <Field label="Nom *">
                    <input
                      type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                      placeholder="Ex: Maison principale, Bâtiment A"
                      className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px]"
                      autoFocus
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Zone climatique *">
                      <select
                        value={zoneClimatique}
                        onChange={(e) => setZoneClimatique(e.target.value)}
                        className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-2 text-[13px]"
                      >
                        {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </Field>
                    <Field label="Altitude (m)">
                      <input
                        type="number" value={altitude} onChange={(e) => setAltitude(e.target.value)}
                        placeholder="120"
                        className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px] tabular-nums"
                      />
                    </Field>
                  </div>

                  <Field label="Orientation principale">
                    <input
                      type="text" value={orientation} onChange={(e) => setOrientation(e.target.value)}
                      placeholder="Ex: Sud-Ouest"
                      className="h-9 w-full rounded-md border border-tk-border bg-tk-input px-3 text-[13px]"
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Notes contextuelles…"
                      rows={2}
                      className="w-full resize-none rounded-md border border-tk-border bg-tk-input px-3 py-2 text-[13px]"
                    />
                  </Field>
                </div>

                <div className="flex justify-end gap-2 border-t border-tk-border px-5 py-3">
                  <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                    Annuler
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
                    Créer
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="px-5 py-3 border-b border-tk-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tk-text-faint" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher par nom, zone, description…"
                      className="h-8 w-full rounded-md border border-tk-border bg-tk-input pl-8 pr-2 text-[12px]"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2">
                  {libraryLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-tk-text-faint" />
                    </div>
                  ) : libraryFiltered.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <Library className="mx-auto h-6 w-6 text-tk-text-faint/40" />
                      <p className="mt-2 text-[12px] font-medium text-tk-text">Aucun bâtiment disponible</p>
                      <p className="mt-1 text-[11px] text-tk-text-muted">
                        {search
                          ? "Aucun résultat pour cette recherche."
                          : "Aucun bâtiment dans la bibliothèque. Crée-en un dans l'onglet Créer."}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {libraryFiltered.map((b) => {
                        const isAttaching = attaching === b.id;
                        const isAttached = b.projetId !== null;
                        return (
                          <li key={b.id}>
                            <button
                              type="button"
                              onClick={() => handleAttach(b.id, b.projetId)}
                              disabled={isAttaching}
                              className="w-full text-left px-3 py-2.5 rounded-md hover:bg-tk-hover transition-colors flex items-center gap-3 disabled:opacity-50"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-medium text-tk-text truncate">{b.nom}</span>
                                  <span className="rounded border border-tk-border bg-tk-bg/40 px-1.5 py-0.5 text-[10px] font-mono text-tk-text-muted">
                                    {b.zoneClimatique}
                                  </span>
                                  {isAttached && (
                                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                      déjà sur un projet
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[11px] text-tk-text-muted">
                                  {b.zonesCount} zone{b.zonesCount > 1 ? "s" : ""}
                                  {b.description && (
                                    <>
                                      <span className="mx-1.5 text-tk-border">·</span>
                                      <span className="truncate">{b.description}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                              {isAttaching ? (
                                <Loader2 className="h-4 w-4 animate-spin text-tk-text-faint shrink-0" />
                              ) : (
                                <Plus className="h-4 w-4 text-tk-text-faint shrink-0" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="flex justify-end border-t border-tk-border px-5 py-3">
                  <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors",
        active
          ? "border-tk-primary text-tk-text"
          : "border-transparent text-tk-text-muted hover:text-tk-text",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="field-label-tiny mb-1">{label}</p>
      {children}
    </div>
  );
}
