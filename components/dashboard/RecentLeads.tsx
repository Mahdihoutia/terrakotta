"use client";

import type { LeadStatus } from "@/types";
import { cn } from "@/lib/utils";

interface RecentLead {
  id: string;
  nom: string;
  email: string;
  type: string;
  statut: LeadStatus;
  date: string;
}

const DEMO_LEADS: RecentLead[] = [
  { id: "1", nom: "Marie Dupont", email: "marie.dupont@email.fr", type: "Particulier", statut: "NOUVEAU", date: "Il y a 2h" },
  { id: "2", nom: "SCI Les Oliviers", email: "contact@sci-oliviers.fr", type: "Professionnel", statut: "CONTACTE", date: "Il y a 5h" },
  { id: "3", nom: "Mairie de Salon", email: "urbanisme@salon.fr", type: "Collectivité", statut: "QUALIFIE", date: "Hier" },
  { id: "4", nom: "Jean-Pierre Martin", email: "jp.martin@gmail.com", type: "Particulier", statut: "PROPOSITION", date: "Hier" },
  { id: "5", nom: "Résidence Le Parc", email: "syndic@leparc.fr", type: "Professionnel", statut: "GAGNE", date: "Il y a 3j" },
];

const STATUS_STYLES: Record<LeadStatus, string> = {
  NOUVEAU: "text-blue-400 bg-blue-400/10",
  CONTACTE: "text-amber-400 bg-amber-400/10",
  QUALIFIE: "text-violet-400 bg-violet-400/10",
  PROPOSITION: "text-orange-400 bg-orange-400/10",
  GAGNE: "text-emerald-400 bg-emerald-400/10",
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

export default function RecentLeads() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8ecf4]">Derniers leads</h3>
        <span className="text-[10px] uppercase tracking-wider text-[#5a6478]">
          Récents
        </span>
      </div>
      <div className="space-y-2">
        {DEMO_LEADS.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-[10px] font-bold text-blue-300">
                {lead.nom.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-[#e8ecf4]">{lead.nom}</p>
                <p className="text-[10px] text-[#5a6478]">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#7a849a] sm:inline">
                {lead.type}
              </span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[lead.statut])}>
                {STATUS_LABELS[lead.statut]}
              </span>
              <span className="text-[10px] text-[#5a6478] whitespace-nowrap">
                {lead.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
