"use client";

import { useEffect, useState } from "react";
import type { Lead, LeadStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_STYLES: Record<LeadStatus, string> = {
  NOUVEAU: "text-blue-400 bg-blue-400/10",
  CONTACTE: "text-amber-400 bg-amber-400/10",
  QUALIFIE: "text-violet-400 bg-violet-400/10",
  PROPOSITION: "text-tk-primary bg-orange-400/10",
  GAGNE: "text-tk-primary bg-orange-400/10",
  PERDU: "text-red-400 bg-red-400/10",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NOUVEAU: "Nouveau",
  CONTACTE: "Contacté",
  QUALIFIE: "Qualifié",
  PROPOSITION: "Proposition",
  GAGNE: "Gagné",
  PERDU: "Perdu",
};

const TYPE_LABELS: Record<string, string> = {
  PARTICULIER: "Particulier",
  PROFESSIONNEL: "Professionnel",
  COLLECTIVITE: "Collectivité",
};

export default function RecentLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leads")
      .then((res) => res.json())
      .then((data: Lead[]) => {
        setLeads(data.slice(0, 5));
      })
      .catch(() => {
        // Silently fail — component shows empty state
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-tk-text">Derniers leads</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-tk-text-faint" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-tk-text">Derniers leads</h3>
        <span className="text-[10px] uppercase tracking-wider text-tk-text-faint">
          Récents
        </span>
      </div>
      <div className="space-y-2">
        {leads.length === 0 && (
          <p className="py-4 text-center text-xs text-tk-text-faint">Aucun lead</p>
        )}
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between rounded-xl bg-tk-surface p-3 transition-colors hover:bg-tk-hover"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-[10px] font-bold text-blue-300">
                {lead.nom.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-tk-text">{lead.nom}</p>
                <p className="text-[10px] text-tk-text-faint">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-tk-surface px-2 py-0.5 text-[10px] text-tk-text-muted sm:inline">
                {TYPE_LABELS[lead.type] ?? lead.type}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[lead.statut])}>
                {STATUS_LABELS[lead.statut]}
              </span>
              <span className="text-[10px] text-tk-text-faint whitespace-nowrap">
                {formatDistanceToNow(new Date(lead.dateCreation), { addSuffix: true, locale: fr })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
