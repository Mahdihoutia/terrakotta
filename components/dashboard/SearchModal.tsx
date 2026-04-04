"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Users,
  UserCheck,
  CalendarDays,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface SearchLead {
  id: string;
  nom: string;
  prenom?: string | null;
  raisonSociale?: string | null;
  telephone?: string | null;
  email?: string | null;
  type: string;
  statut: string;
}

interface SearchClient {
  id: string;
  nom: string;
  prenom?: string | null;
  raisonSociale?: string | null;
  telephone?: string | null;
  email?: string | null;
  type: string;
}

interface SearchEvenement {
  id: string;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  type: string;
  lieu?: string | null;
  client?: { id: string; nom: string; prenom?: string | null } | null;
  lead?: { id: string; nom: string; prenom?: string | null } | null;
}

interface SearchResults {
  leads: SearchLead[];
  clients: SearchClient[];
  evenements: SearchEvenement[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────

function fullName(nom: string, prenom?: string | null): string {
  return prenom ? `${prenom} ${nom}` : nom;
}

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  CONTACTE: "Contacté",
  QUALIFIE: "Qualifié",
  PROPOSITION: "Proposition",
  GAGNE: "Gagné",
  PERDU: "Perdu",
};

// ─── Component ──────────────────────────────────────────────────

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard shortcut Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: SearchResults = await res.json();
        setResults(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  function navigate(path: string) {
    onClose();
    router.push(path);
  }

  if (!open) return null;

  const hasResults = results && (results.leads.length > 0 || results.clients.length > 0 || results.evenements.length > 0);
  const noResults = results && !hasResults && query.length >= 2;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-xl -translate-x-1/2">
        <div className="rounded-2xl border border-tk-border bg-tk-bg shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-tk-border px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-tk-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Rechercher un lead, contact ou rendez-vous..."
              className="flex-1 bg-transparent text-sm text-tk-text outline-none placeholder:text-tk-text-faint"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-tk-text-muted" />}
            <kbd className="hidden sm:flex items-center gap-0.5 rounded-md border border-tk-border bg-tk-surface px-1.5 py-0.5 text-[10px] text-tk-text-faint">
              ESC
            </kbd>
            <button onClick={onClose} className="text-tk-text-muted hover:text-tk-text">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-sm text-tk-text-faint">
                Tapez au moins 2 caractères pour rechercher
              </div>
            )}

            {noResults && (
              <div className="px-4 py-8 text-center text-sm text-tk-text-faint">
                Aucun résultat pour &quot;{query}&quot;
              </div>
            )}

            {hasResults && (
              <div className="py-2">
                {/* Leads */}
                {results.leads.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2">
                      <Users className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-tk-text-muted">
                        Leads ({results.leads.length})
                      </span>
                    </div>
                    {results.leads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-tk-hover group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-tk-text truncate">
                            {fullName(lead.nom, lead.prenom)}
                            {lead.raisonSociale && (
                              <span className="ml-1.5 text-tk-text-muted font-normal">
                                — {lead.raisonSociale}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-tk-text-faint truncate">
                            {[lead.email, lead.telephone].filter(Boolean).join(" · ")}
                            {" · "}
                            <span className="text-tk-primary">{STATUS_LABELS[lead.statut] || lead.statut}</span>
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-tk-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Clients */}
                {results.clients.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 mt-1">
                      <UserCheck className="h-3.5 w-3.5 text-tk-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-tk-text-muted">
                        Contacts ({results.clients.length})
                      </span>
                    </div>
                    {results.clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => navigate(`/contacts/${client.id}`)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-tk-hover group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-tk-text truncate">
                            {fullName(client.nom, client.prenom)}
                            {client.raisonSociale && (
                              <span className="ml-1.5 text-tk-text-muted font-normal">
                                — {client.raisonSociale}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-tk-text-faint truncate">
                            {[client.email, client.telephone].filter(Boolean).join(" · ")}
                            {" · "}
                            {client.type.toLowerCase()}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-tk-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Événements */}
                {results.evenements.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 mt-1">
                      <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-tk-text-muted">
                        Rendez-vous ({results.evenements.length})
                      </span>
                    </div>
                    {results.evenements.map((evt) => {
                      const assigned = evt.client || evt.lead;
                      return (
                        <button
                          key={evt.id}
                          onClick={() => navigate("/calendrier")}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-tk-hover group"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-tk-text truncate">
                              {evt.titre}
                            </p>
                            <p className="text-xs text-tk-text-faint truncate">
                              {formatDateFr(evt.date)} · {evt.heureDebut}–{evt.heureFin}
                              {assigned && ` · ${fullName(assigned.nom, assigned.prenom)}`}
                              {evt.lieu && ` · ${evt.lieu}`}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-tk-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-tk-border px-4 py-2">
            <span className="text-[10px] text-tk-text-faint">
              Recherche dans les leads, contacts et rendez-vous
            </span>
            <kbd className="hidden sm:flex items-center gap-0.5 rounded-md border border-tk-border bg-tk-surface px-1.5 py-0.5 text-[10px] text-tk-text-faint">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </>
  );
}
