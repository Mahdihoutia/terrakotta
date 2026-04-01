"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Plus, Filter, Download, Mail, Phone } from "lucide-react";
import type { Lead } from "@/types";

const DEMO_LEADS: Lead[] = [
  {
    id: "1",
    nom: "Marie Dupont",
    email: "marie.dupont@email.fr",
    telephone: "06 12 34 56 78",
    type: "PARTICULIER",
    source: "SITE_WEB",
    statut: "NOUVEAU",
    budgetEstime: 15000,
    dateCreation: "2026-03-30",
    dateMiseAJour: "2026-03-30",
  },
  {
    id: "2",
    nom: "SCI Les Oliviers",
    email: "contact@sci-oliviers.fr",
    telephone: "04 91 00 00 00",
    entreprise: "SCI Les Oliviers",
    type: "PROFESSIONNEL",
    source: "RECOMMANDATION",
    statut: "CONTACTE",
    budgetEstime: 85000,
    dateCreation: "2026-03-28",
    dateMiseAJour: "2026-03-29",
  },
  {
    id: "3",
    nom: "Mairie de Salon-de-Provence",
    email: "urbanisme@salon.fr",
    telephone: "04 90 00 00 00",
    type: "COLLECTIVITE",
    source: "DEMARCHAGE",
    statut: "QUALIFIE",
    budgetEstime: 250000,
    dateCreation: "2026-03-20",
    dateMiseAJour: "2026-03-28",
  },
  {
    id: "4",
    nom: "Jean-Pierre Martin",
    email: "jp.martin@gmail.com",
    telephone: "06 98 76 54 32",
    type: "PARTICULIER",
    source: "SITE_WEB",
    statut: "PROPOSITION",
    budgetEstime: 22000,
    dateCreation: "2026-03-15",
    dateMiseAJour: "2026-03-27",
  },
  {
    id: "5",
    nom: "Résidence Le Parc",
    email: "syndic@leparc.fr",
    telephone: "04 42 00 00 00",
    entreprise: "Syndic Le Parc",
    type: "PROFESSIONNEL",
    source: "RESEAU",
    statut: "GAGNE",
    budgetEstime: 120000,
    dateCreation: "2026-02-10",
    dateMiseAJour: "2026-03-25",
  },
  {
    id: "6",
    nom: "Pierre Lefèvre",
    email: "p.lefevre@orange.fr",
    type: "PARTICULIER",
    source: "SITE_WEB",
    statut: "PERDU",
    budgetEstime: 8000,
    dateCreation: "2026-02-05",
    dateMiseAJour: "2026-03-20",
    notes: "Budget insuffisant pour le scope demandé",
  },
];

const SOURCE_LABELS: Record<string, string> = {
  SITE_WEB: "Site web",
  RECOMMANDATION: "Recommandation",
  RESEAU: "Réseau",
  DEMARCHAGE: "Démarchage",
  AUTRE: "Autre",
};

function formatCurrency(amount?: number): string {
  if (amount === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function LeadsPage() {
  const [filterStatut, setFilterStatut] = useState<string>("TOUS");

  const filteredLeads =
    filterStatut === "TOUS"
      ? DEMO_LEADS
      : DEMO_LEADS.filter((l) => l.statut === filterStatut);

  const statuts = ["TOUS", "NOUVEAU", "CONTACTE", "QUALIFIE", "PROPOSITION", "GAGNE", "PERDU"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Gérez et suivez vos prospects
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau lead
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {statuts.map((s) => (
            <Button
              key={s}
              variant={filterStatut === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatut(s)}
              className="text-xs"
            >
              {s === "TOUS" ? "Tous" : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Budget estimé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.nom}</p>
                      {lead.entreprise && (
                        <p className="text-xs text-muted-foreground">
                          {lead.entreprise}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </span>
                      {lead.telephone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {lead.telephone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {lead.type.charAt(0) + lead.type.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {SOURCE_LABELS[lead.source]}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatCurrency(lead.budgetEstime)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge statut={lead.statut} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {lead.dateCreation}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
