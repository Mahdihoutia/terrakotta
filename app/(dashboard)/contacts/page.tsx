"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Building2,
  UserCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ContactType = "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE";
type ContactSource = "LEAD_CONVERTI" | "MANUEL";

interface ContactItem {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  entreprise?: string;
  type: ContactType;
  source: ContactSource;
  operationsCount: number;
  documentsCount: number;
  dateCreation: string;
}

const TYPE_STYLES: Record<ContactType, string> = {
  PARTICULIER: "bg-blue-100 text-blue-700",
  PROFESSIONNEL: "bg-emerald-100 text-emerald-700",
  COLLECTIVITE: "bg-violet-100 text-violet-700",
};

const TYPE_LABELS: Record<ContactType, string> = {
  PARTICULIER: "Particulier",
  PROFESSIONNEL: "Professionnel",
  COLLECTIVITE: "Collectivité",
};

const DEMO_CONTACTS: ContactItem[] = [
  {
    id: "1",
    nom: "Résidence Le Parc",
    email: "syndic@leparc.fr",
    telephone: "04 42 00 00 00",
    adresse: "12 rue des Oliviers, 13100 Aix-en-Provence",
    entreprise: "Syndic Le Parc",
    type: "PROFESSIONNEL",
    source: "LEAD_CONVERTI",
    operationsCount: 2,
    documentsCount: 5,
    dateCreation: "2026-02-15",
  },
  {
    id: "2",
    nom: "Marie Dupont",
    email: "marie.dupont@email.fr",
    telephone: "06 12 34 56 78",
    adresse: "8 boulevard Mirabeau, 13100 Aix-en-Provence",
    type: "PARTICULIER",
    source: "LEAD_CONVERTI",
    operationsCount: 1,
    documentsCount: 3,
    dateCreation: "2026-03-10",
  },
  {
    id: "3",
    nom: "Mairie de Salon-de-Provence",
    email: "urbanisme@salon.fr",
    telephone: "04 90 00 00 00",
    adresse: "Place Morgan, 13300 Salon-de-Provence",
    type: "COLLECTIVITE",
    source: "LEAD_CONVERTI",
    operationsCount: 3,
    documentsCount: 8,
    dateCreation: "2026-01-20",
  },
  {
    id: "4",
    nom: "Pierre Lefèvre",
    email: "p.lefevre@orange.fr",
    telephone: "06 55 44 33 22",
    adresse: "22 rue de la République, 13400 Aubagne",
    type: "PARTICULIER",
    source: "MANUEL",
    operationsCount: 0,
    documentsCount: 1,
    dateCreation: "2026-03-25",
  },
  {
    id: "5",
    nom: "SCI Méditerranée",
    email: "contact@sci-med.fr",
    telephone: "04 91 11 22 33",
    adresse: "45 La Canebière, 13001 Marseille",
    entreprise: "SCI Méditerranée",
    type: "PROFESSIONNEL",
    source: "MANUEL",
    operationsCount: 1,
    documentsCount: 2,
    dateCreation: "2026-03-28",
  },
];

export default function ContactsPage() {
  const [filterType, setFilterType] = useState<string>("TOUS");
  const [search, setSearch] = useState("");

  const filtered = DEMO_CONTACTS.filter((c) => {
    const matchType = filterType === "TOUS" || c.type === filterType;
    const matchSearch =
      !search ||
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.entreprise?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Clients et contacts professionnels
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau contact
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 sm:max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
          {["TOUS", "PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"].map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(t)}
              className="text-xs"
            >
              {t === "TOUS" ? "Tous" : TYPE_LABELS[t as ContactType]}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{DEMO_CONTACTS.length}</p>
              <p className="text-xs text-muted-foreground">Contacts totaux</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <UserCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {DEMO_CONTACTS.filter((c) => c.type === "PARTICULIER").length}
              </p>
              <p className="text-xs text-muted-foreground">Particuliers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {DEMO_CONTACTS.filter((c) => c.type === "PROFESSIONNEL").length}
              </p>
              <p className="text-xs text-muted-foreground">Professionnels</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-violet-500/10 p-2">
              <Building2 className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {DEMO_CONTACTS.filter((c) => c.type === "COLLECTIVITE").length}
              </p>
              <p className="text-xs text-muted-foreground">Collectivités</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Coordonnées</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-center">Opérations</TableHead>
                <TableHead className="text-center">Documents</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id} className="group cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{contact.nom}</p>
                      {contact.entreprise && (
                        <p className="text-xs text-muted-foreground">{contact.entreprise}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {contact.email}
                      </span>
                      {contact.telephone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {contact.telephone}
                        </span>
                      )}
                      {contact.adresse && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {contact.adresse}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", TYPE_STYLES[contact.type])}>
                      {TYPE_LABELS[contact.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        contact.source === "LEAD_CONVERTI" && "border-emerald-300 text-emerald-700"
                      )}
                    >
                      {contact.source === "LEAD_CONVERTI" ? "Lead converti" : "Ajouté manuellement"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{contact.operationsCount}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{contact.documentsCount}</span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/contacts/${contact.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
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
