"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadStatus } from "@/types";

interface RecentLead {
  id: string;
  nom: string;
  email: string;
  type: string;
  statut: LeadStatus;
  date: string;
}

const DEMO_LEADS: RecentLead[] = [
  {
    id: "1",
    nom: "Marie Dupont",
    email: "marie.dupont@email.fr",
    type: "Particulier",
    statut: "NOUVEAU",
    date: "Il y a 2h",
  },
  {
    id: "2",
    nom: "SCI Les Oliviers",
    email: "contact@sci-oliviers.fr",
    type: "Professionnel",
    statut: "CONTACTE",
    date: "Il y a 5h",
  },
  {
    id: "3",
    nom: "Mairie de Salon",
    email: "urbanisme@salon.fr",
    type: "Collectivité",
    statut: "QUALIFIE",
    date: "Hier",
  },
  {
    id: "4",
    nom: "Jean-Pierre Martin",
    email: "jp.martin@gmail.com",
    type: "Particulier",
    statut: "PROPOSITION",
    date: "Hier",
  },
  {
    id: "5",
    nom: "Résidence Le Parc",
    email: "syndic@leparc.fr",
    type: "Professionnel",
    statut: "GAGNE",
    date: "Il y a 3j",
  },
];

const STATUS_STYLES: Record<LeadStatus, string> = {
  NOUVEAU: "bg-blue-100 text-blue-800",
  CONTACTE: "bg-yellow-100 text-yellow-800",
  QUALIFIE: "bg-purple-100 text-purple-800",
  PROPOSITION: "bg-orange-100 text-orange-800",
  GAGNE: "bg-emerald-100 text-emerald-800",
  PERDU: "bg-red-100 text-red-800",
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Derniers leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DEMO_LEADS.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{lead.nom}</p>
                <p className="text-xs text-muted-foreground">{lead.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  {lead.type}
                </Badge>
                <Badge className={STATUS_STYLES[lead.statut]}>
                  {STATUS_LABELS[lead.statut]}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {lead.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
