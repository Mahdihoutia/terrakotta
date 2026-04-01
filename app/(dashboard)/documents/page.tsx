"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  ClipboardCheck,
  Calculator,
  Ruler,
  Download,
  Eye,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

type DocumentType = "RAPPORT_VISITE" | "DEVIS" | "NOTE_DIMENSIONNEMENT" | "AUDIT";
type DocumentStatus = "BROUILLON" | "EN_COURS" | "TERMINE" | "ENVOYE";

interface Document {
  id: string;
  titre: string;
  type: DocumentType;
  statut: DocumentStatus;
  client: string;
  dateCreation: string;
  dateMiseAJour: string;
  reference: string;
}

const TYPE_CONFIG: Record<DocumentType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  RAPPORT_VISITE: { label: "Rapport de visite", icon: ClipboardCheck, color: "bg-blue-500/10 text-blue-700" },
  DEVIS: { label: "Devis", icon: Calculator, color: "bg-emerald-500/10 text-emerald-700" },
  NOTE_DIMENSIONNEMENT: { label: "Note de dimensionnement", icon: Ruler, color: "bg-violet-500/10 text-violet-700" },
  AUDIT: { label: "Audit énergétique", icon: FileText, color: "bg-amber-500/10 text-amber-700" },
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  BROUILLON: { label: "Brouillon", className: "bg-zinc-100 text-zinc-700", icon: Clock },
  EN_COURS: { label: "En cours", className: "bg-blue-100 text-blue-700", icon: AlertCircle },
  TERMINE: { label: "Terminé", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  ENVOYE: { label: "Envoyé", className: "bg-violet-100 text-violet-700", icon: CheckCircle2 },
};

const DEMO_DOCUMENTS: Document[] = [
  {
    id: "1",
    titre: "Visite technique — Résidence Le Parc",
    type: "RAPPORT_VISITE",
    statut: "TERMINE",
    client: "Résidence Le Parc",
    dateCreation: "2026-03-25",
    dateMiseAJour: "2026-03-28",
    reference: "RV-2026-001",
  },
  {
    id: "2",
    titre: "Devis isolation combles — Dupont",
    type: "DEVIS",
    statut: "ENVOYE",
    client: "Marie Dupont",
    dateCreation: "2026-03-20",
    dateMiseAJour: "2026-03-22",
    reference: "DV-2026-012",
  },
  {
    id: "3",
    titre: "Dimensionnement PAC — SCI Les Oliviers",
    type: "NOTE_DIMENSIONNEMENT",
    statut: "EN_COURS",
    client: "SCI Les Oliviers",
    dateCreation: "2026-03-28",
    dateMiseAJour: "2026-03-30",
    reference: "ND-2026-004",
  },
  {
    id: "4",
    titre: "Audit DPE — Mairie de Salon",
    type: "AUDIT",
    statut: "BROUILLON",
    client: "Mairie de Salon-de-Provence",
    dateCreation: "2026-03-30",
    dateMiseAJour: "2026-03-30",
    reference: "AU-2026-002",
  },
  {
    id: "5",
    titre: "Visite technique — Martin",
    type: "RAPPORT_VISITE",
    statut: "TERMINE",
    client: "Jean-Pierre Martin",
    dateCreation: "2026-03-15",
    dateMiseAJour: "2026-03-18",
    reference: "RV-2026-002",
  },
];

const TEMPLATES = [
  {
    type: "RAPPORT_VISITE" as DocumentType,
    title: "Rapport de visite technique",
    description: "Constat de l'existant, relevé thermique, photos, préconisations de travaux et estimations budgétaires.",
    sections: ["Informations générales", "Description du bâti", "Équipements existants", "Relevé thermique", "Préconisations", "Annexes photos"],
  },
  {
    type: "DEVIS" as DocumentType,
    title: "Devis travaux",
    description: "Devis détaillé avec postes de travaux, quantités, prix unitaires, TVA applicable et conditions de validité.",
    sections: ["Coordonnées client", "Désignation des travaux", "Chiffrage détaillé", "Conditions", "Aides mobilisables"],
  },
  {
    type: "NOTE_DIMENSIONNEMENT" as DocumentType,
    title: "Note de dimensionnement",
    description: "Calculs thermiques, dimensionnement des équipements (PAC, VMC, isolation), conformité RE2020/RT existant.",
    sections: ["Hypothèses de calcul", "Déperditions thermiques", "Dimensionnement équipements", "Bilan énergétique", "Conformité réglementaire"],
  },
  {
    type: "AUDIT" as DocumentType,
    title: "Audit énergétique",
    description: "Diagnostic complet avec DPE projeté, scénarios de rénovation, gains énergétiques et plan de financement.",
    sections: ["État des lieux", "Consommations actuelles", "Scénarios de rénovation", "Gains projetés", "Plan de financement", "DPE projeté"],
  },
];

export default function DocumentsPage() {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Générez et gérez vos documents professionnels
          </p>
        </div>
        <Button size="sm" onClick={() => setSelectedType(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau document
        </Button>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Générer</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4 space-y-6">
          {!selectedType ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {TEMPLATES.map((tpl, i) => {
                const config = TYPE_CONFIG[tpl.type];
                const Icon = config.icon;
                return (
                  <motion.div
                    key={tpl.type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                  >
                    <Card
                      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                      onClick={() => setSelectedType(tpl.type)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-xl p-3 ${config.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold">{tpl.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {tpl.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {tpl.sections.map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px] font-normal">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <DocumentForm type={selectedType} onBack={() => setSelectedType(null)} />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Mis à jour</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_DOCUMENTS.map((doc) => {
                    const typeConfig = TYPE_CONFIG[doc.type];
                    const statusConfig = STATUS_CONFIG[doc.statut];
                    const StatusIcon = statusConfig.icon;
                    return (
                      <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">
                          {doc.reference}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {doc.titre}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs gap-1">
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{doc.client}</TableCell>
                        <TableCell>
                          <Badge className={`gap-1 ${statusConfig.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {doc.dateMiseAJour}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentForm({
  type,
  onBack,
}: {
  type: DocumentType;
  onBack: () => void;
}) {
  const config = TYPE_CONFIG[type];
  const template = TEMPLATES.find((t) => t.type === type);
  const Icon = config.icon;

  if (!template) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          &larr; Retour
        </Button>
        <div className={`rounded-lg p-2 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{template.title}</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Titre du document</label>
                  <input
                    type="text"
                    placeholder={`Ex: ${template.title} — Nom du client`}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Client</label>
                  <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none">
                    <option value="">Sélectionner un client...</option>
                    <option>Marie Dupont</option>
                    <option>SCI Les Oliviers</option>
                    <option>Mairie de Salon-de-Provence</option>
                    <option>Jean-Pierre Martin</option>
                    <option>Résidence Le Parc</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Adresse du bien</label>
                  <input
                    type="text"
                    placeholder="Adresse complète"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date de visite</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {type === "RAPPORT_VISITE" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description du bâti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Type de bâtiment</label>
                    <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                      <option>Maison individuelle</option>
                      <option>Appartement</option>
                      <option>Immeuble collectif</option>
                      <option>Bâtiment tertiaire</option>
                      <option>Bâtiment public</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Surface (m²)</label>
                    <input
                      type="number"
                      placeholder="Ex: 120"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Année de construction</label>
                    <input
                      type="number"
                      placeholder="Ex: 1975"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Observations</label>
                  <textarea
                    rows={4}
                    placeholder="Décrivez l'état général du bâti, les points d'attention, les pathologies observées..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {type === "DEVIS" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Postes de travaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border">
                  <div className="grid grid-cols-12 gap-2 border-b bg-muted/50 p-3 text-xs font-medium">
                    <div className="col-span-5">Désignation</div>
                    <div className="col-span-2">Quantité</div>
                    <div className="col-span-2">Prix unit. HT</div>
                    <div className="col-span-2">Total HT</div>
                    <div className="col-span-1"></div>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 border-b p-3 last:border-0">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Description du poste"
                          className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qté"
                          className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="€ HT"
                          className="w-full rounded border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2 flex items-center text-sm font-medium text-muted-foreground">
                        0,00 €
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Ajouter un poste
                </Button>
              </CardContent>
            </Card>
          )}

          {type === "NOTE_DIMENSIONNEMENT" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Paramètres de calcul</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Zone climatique</label>
                    <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                      <option>H1a — Nord</option>
                      <option>H1b — Nord-Est</option>
                      <option>H1c — Est</option>
                      <option>H2a — Nord-Ouest</option>
                      <option>H2b — Ouest</option>
                      <option>H2c — Sud-Ouest</option>
                      <option>H2d — Centre</option>
                      <option>H3 — Méditerranée</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Altitude (m)</label>
                    <input
                      type="number"
                      placeholder="Ex: 150"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Température extérieure de base (°C)</label>
                    <input
                      type="number"
                      placeholder="Ex: -7"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Type d&apos;équipement</label>
                    <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                      <option>PAC air/eau</option>
                      <option>PAC air/air</option>
                      <option>PAC géothermique</option>
                      <option>VMC double flux</option>
                      <option>Chaudière condensation</option>
                      <option>Solaire thermique</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Notes de calcul</label>
                  <textarea
                    rows={4}
                    placeholder="Hypothèses, coefficients de déperdition, résultats intermédiaires..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {type === "AUDIT" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Données énergétiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">DPE actuel</label>
                    <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                      <option>A — ≤ 70 kWh/m²/an</option>
                      <option>B — 71 à 110</option>
                      <option>C — 111 à 180</option>
                      <option>D — 181 à 250</option>
                      <option>E — 251 à 330</option>
                      <option>F — 331 à 420</option>
                      <option>G — &gt; 420</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Consommation annuelle (kWh)</label>
                    <input
                      type="number"
                      placeholder="Ex: 18500"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Chauffage actuel</label>
                    <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                      <option>Gaz naturel</option>
                      <option>Fioul</option>
                      <option>Électrique (convecteurs)</option>
                      <option>Bois / Granulés</option>
                      <option>PAC existante</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">DPE visé</label>
                    <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                      <option>A — ≤ 70 kWh/m²/an</option>
                      <option>B — 71 à 110</option>
                      <option>C — 111 à 180</option>
                      <option>D — 181 à 250</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Scénarios de rénovation envisagés</label>
                  <textarea
                    rows={4}
                    placeholder="Décrivez les bouquets de travaux envisagés, les gains attendus par poste..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.sections.map((section, i) => (
                  <div
                    key={section}
                    className="flex items-center gap-2 rounded-lg border p-2.5 text-sm"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    {section}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Générer le document
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter en PDF
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Aperçu
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
