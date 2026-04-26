"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  RotateCcw,
  Loader2,
  Users,
  Contact as ContactIcon,
  FolderKanban,
  Receipt,
  FileText,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

type ResourceKey = "clients" | "leads" | "projets" | "devis" | "documents" | "evenements";

interface CorbeilleItem {
  id: string;
  label: string;
  meta?: string;
  deletedAt: string | null;
}

interface CorbeilleData {
  clients: Array<{ id: string; nom: string; prenom: string | null; type: string; deletedAt: string | null }>;
  leads: Array<{ id: string; nom: string; prenom: string | null; email: string; deletedAt: string | null }>;
  projets: Array<{ id: string; titre: string; statut: string; deletedAt: string | null }>;
  devis: Array<{ id: string; numero: string; objet: string | null; statut: string; deletedAt: string | null }>;
  documents: Array<{ id: string; titre: string; reference: string; type: string; deletedAt: string | null }>;
  evenements: Array<{ id: string; titre: string; date: string; type: string; deletedAt: string | null }>;
}

const RESOURCE_META: Record<ResourceKey, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  leads:      { label: "Leads",      icon: Users,        tone: "text-blue-600 bg-blue-50" },
  clients:    { label: "Contacts",   icon: ContactIcon,  tone: "text-violet-600 bg-violet-50" },
  projets:    { label: "Projets",    icon: FolderKanban, tone: "text-emerald-600 bg-emerald-50" },
  devis:      { label: "Devis",      icon: Receipt,      tone: "text-amber-600 bg-amber-50" },
  documents:  { label: "Documents",  icon: FileText,     tone: "text-zinc-600 bg-zinc-100" },
  evenements: { label: "Événements", icon: CalendarDays, tone: "text-pink-600 bg-pink-50" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`;
  const days = Math.floor(seconds / 86400);
  if (days < 30) return `il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function CorbeillePage() {
  const [data, setData] = useState<CorbeilleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/corbeille");
      if (!res.ok) {
        await showApiError(res, "Impossible de charger la corbeille");
        return;
      }
      const json = (await res.json()) as CorbeilleData;
      setData(json);
    } catch (err) {
      showNetworkError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleRestore(resource: ResourceKey, id: string, label: string) {
    setRestoring(`${resource}:${id}`);
    try {
      const res = await fetch(`/api/corbeille/${resource}/${id}/restore`, { method: "POST" });
      if (!res.ok) {
        await showApiError(res, "Restauration impossible");
        return;
      }
      toast.success(`${label} restauré`);
      await fetchData();
    } catch (err) {
      showNetworkError(err);
    } finally {
      setRestoring(null);
    }
  }

  const sections: Array<{ key: ResourceKey; items: CorbeilleItem[] }> = data
    ? [
        {
          key: "leads",
          items: data.leads.map((l) => ({
            id: l.id,
            label: [l.prenom, l.nom].filter(Boolean).join(" ") || "Lead sans nom",
            meta: l.email,
            deletedAt: l.deletedAt,
          })),
        },
        {
          key: "clients",
          items: data.clients.map((c) => ({
            id: c.id,
            label: [c.prenom, c.nom].filter(Boolean).join(" ") || "Contact sans nom",
            meta: c.type,
            deletedAt: c.deletedAt,
          })),
        },
        {
          key: "projets",
          items: data.projets.map((p) => ({
            id: p.id,
            label: p.titre,
            meta: p.statut,
            deletedAt: p.deletedAt,
          })),
        },
        {
          key: "devis",
          items: data.devis.map((d) => ({
            id: d.id,
            label: d.objet || d.numero,
            meta: `${d.numero} · ${d.statut}`,
            deletedAt: d.deletedAt,
          })),
        },
        {
          key: "documents",
          items: data.documents.map((d) => ({
            id: d.id,
            label: d.titre,
            meta: `${d.reference} · ${d.type}`,
            deletedAt: d.deletedAt,
          })),
        },
        {
          key: "evenements",
          items: data.evenements.map((e) => ({
            id: e.id,
            label: e.titre,
            meta: `${e.type} · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(e.date))}`,
            deletedAt: e.deletedAt,
          })),
        },
      ]
    : [];

  const totalCount = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-zinc-100 text-zinc-700">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Corbeille</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Éléments supprimés — restaurables. Purge automatique au-delà de 90 jours (à venir).
            </p>
          </div>
        </div>
        {!loading && (
          <Badge variant="outline">
            {totalCount} élément{totalCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : totalCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trash2 className="h-10 w-10 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium">Corbeille vide</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les éléments que vous supprimez apparaissent ici pendant 90 jours.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sections
            .filter((s) => s.items.length > 0)
            .map((s) => {
              const meta = RESOURCE_META[s.key];
              const Icon = meta.icon;
              return (
                <Card key={s.key}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span className={cn("rounded-md p-1", meta.tone)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {meta.label}
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {s.items.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="divide-y">
                      {s.items.map((item) => {
                        const restoreKey = `${s.key}:${item.id}`;
                        const isRestoring = restoring === restoreKey;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 py-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{item.label}</div>
                              {item.meta && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {item.meta}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0">
                              supprimé {timeAgo(item.deletedAt)}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isRestoring}
                              onClick={() => handleRestore(s.key, item.id, item.label)}
                            >
                              {isRestoring ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                              )}
                              Restaurer
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
