"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Plus,
  FileText,
  Upload,
  Trash2,
  Wrench,
  Thermometer,
  Zap,
  Home,
  Wind,
  Sun,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type OperationStatus = "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

interface Operation {
  id: string;
  titre: string;
  type: string;
  statut: OperationStatus;
  description: string;
  montantHT?: number;
  dateDebut?: string;
  dateFin?: string;
  gainEnergetique?: string;
}

interface DocFile {
  id: string;
  nom: string;
  type: string;
  taille: string;
  dateAjout: string;
  categorie: "DEVIS" | "RAPPORT" | "FACTURE" | "PLAN" | "PHOTO" | "AUTRE";
}

const OP_STATUS_CONFIG: Record<OperationStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  PLANIFIEE: { label: "Planifiée", className: "bg-blue-100 text-blue-700", icon: Clock },
  EN_COURS: { label: "En cours", className: "bg-amber-100 text-amber-700", icon: AlertCircle },
  TERMINEE: { label: "Terminée", className: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  ANNULEE: { label: "Annulée", className: "bg-zinc-100 text-zinc-700", icon: AlertCircle },
};

const OP_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Isolation combles": Home,
  "Isolation murs extérieurs": Home,
  "Remplacement chaudière": Thermometer,
  "Installation PAC": Zap,
  "VMC double flux": Wind,
  "Panneaux solaires": Sun,
  "Menuiseries": Home,
};

const DOC_CATEGORIES: Record<string, string> = {
  DEVIS: "Devis",
  RAPPORT: "Rapport",
  FACTURE: "Facture",
  PLAN: "Plan",
  PHOTO: "Photo",
  AUTRE: "Autre",
};

const DOC_CAT_COLORS: Record<string, string> = {
  DEVIS: "bg-emerald-100 text-emerald-700",
  RAPPORT: "bg-blue-100 text-blue-700",
  FACTURE: "bg-amber-100 text-amber-700",
  PLAN: "bg-violet-100 text-violet-700",
  PHOTO: "bg-pink-100 text-pink-700",
  AUTRE: "bg-zinc-100 text-zinc-700",
};

const CONTACT = {
  id: "1",
  nom: "Résidence Le Parc",
  email: "syndic@leparc.fr",
  telephone: "04 42 00 00 00",
  adresse: "12 rue des Oliviers, 13100 Aix-en-Provence",
  entreprise: "Syndic Le Parc",
  type: "PROFESSIONNEL" as const,
  source: "LEAD_CONVERTI" as const,
  dateCreation: "2026-02-15",
  notes: "Copropriété de 24 lots construite en 1978. Chauffage collectif gaz. DPE actuel : E. Projet de rénovation globale en cours.",
  siret: "123 456 789 00012",
  interlocuteur: "M. Dubois — Président du conseil syndical",
};

const DEMO_OPERATIONS: Operation[] = [
  {
    id: "1",
    titre: "Isolation thermique par l'extérieur",
    type: "Isolation murs extérieurs",
    statut: "EN_COURS",
    description: "ITE sur les 4 façades. Système PSE 160mm + enduit. R visé = 4.4 m²·K/W.",
    montantHT: 85000,
    dateDebut: "2026-03-01",
    dateFin: "2026-05-15",
    gainEnergetique: "35% de réduction des déperditions murales",
  },
  {
    id: "2",
    titre: "Remplacement chaudière collective",
    type: "Remplacement chaudière",
    statut: "PLANIFIEE",
    description: "Passage de chaudière gaz classique à chaudière gaz condensation. Puissance 120 kW.",
    montantHT: 32000,
    dateDebut: "2026-06-01",
    dateFin: "2026-06-30",
    gainEnergetique: "20% d'économie sur le poste chauffage",
  },
  {
    id: "3",
    titre: "Installation VMC hygroréglable",
    type: "VMC double flux",
    statut: "TERMINEE",
    description: "VMC hygroréglable type B dans les 24 logements. Bouches d'extraction et entrées d'air neuves.",
    montantHT: 18000,
    dateDebut: "2026-01-15",
    dateFin: "2026-02-28",
    gainEnergetique: "Amélioration qualité de l'air + 5% économie chauffage",
  },
];

const DEMO_DOCS: DocFile[] = [
  { id: "1", nom: "Rapport-visite-technique-LePark.pdf", type: "PDF", taille: "2.4 Mo", dateAjout: "2026-03-28", categorie: "RAPPORT" },
  { id: "2", nom: "Devis-ITE-facades.pdf", type: "PDF", taille: "890 Ko", dateAjout: "2026-02-20", categorie: "DEVIS" },
  { id: "3", nom: "Devis-chaudiere-condensation.pdf", type: "PDF", taille: "540 Ko", dateAjout: "2026-03-15", categorie: "DEVIS" },
  { id: "4", nom: "Plans-facades-existantes.dwg", type: "DWG", taille: "5.1 Mo", dateAjout: "2026-02-18", categorie: "PLAN" },
  { id: "5", nom: "Photos-visite-mars2026.zip", type: "ZIP", taille: "34 Mo", dateAjout: "2026-03-28", categorie: "PHOTO" },
  { id: "6", nom: "Facture-VMC-installation.pdf", type: "PDF", taille: "320 Ko", dateAjout: "2026-03-01", categorie: "FACTURE" },
  { id: "7", nom: "DPE-avant-travaux.pdf", type: "PDF", taille: "1.2 Mo", dateAjout: "2026-01-10", categorie: "RAPPORT" },
  { id: "8", nom: "Attestation-RGE-entreprise.pdf", type: "PDF", taille: "180 Ko", dateAjout: "2026-02-05", categorie: "AUTRE" },
];

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ContactDetailPage() {
  const [operations, setOperations] = useState(DEMO_OPERATIONS);
  const [documents, setDocuments] = useState(DEMO_DOCS);
  const [showOpForm, setShowOpForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newOp, setNewOp] = useState({
    titre: "",
    type: "Isolation combles",
    description: "",
    montantHT: "",
    dateDebut: "",
    dateFin: "",
    gainEnergetique: "",
  });

  function handleAddOperation() {
    if (!newOp.titre.trim()) return;
    const op: Operation = {
      id: crypto.randomUUID(),
      titre: newOp.titre,
      type: newOp.type,
      statut: "PLANIFIEE",
      description: newOp.description,
      montantHT: newOp.montantHT ? Number(newOp.montantHT) : undefined,
      dateDebut: newOp.dateDebut || undefined,
      dateFin: newOp.dateFin || undefined,
      gainEnergetique: newOp.gainEnergetique || undefined,
    };
    setOperations((prev) => [...prev, op]);
    setNewOp({ titre: "", type: "Isolation combles", description: "", montantHT: "", dateDebut: "", dateFin: "", gainEnergetique: "" });
    setShowOpForm(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newDocs: DocFile[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      nom: f.name,
      type: f.name.split(".").pop()?.toUpperCase() || "AUTRE",
      taille: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} Mo` : `${(f.size / 1024).toFixed(0)} Ko`,
      dateAjout: new Date().toISOString().split("T")[0],
      categorie: "AUTRE",
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
    e.target.value = "";
  }

  function handleDeleteDoc(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  function handleDeleteOp(id: string) {
    setOperations((prev) => prev.filter((o) => o.id !== id));
  }

  const totalBudget = operations.reduce((sum, o) => sum + (o.montantHT || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="icon" className="mt-1 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{CONTACT.nom}</h1>
            <Badge className={cn("text-xs", CONTACT.type === "PROFESSIONNEL" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700")}>
              {CONTACT.type === "PROFESSIONNEL" ? "Professionnel" : CONTACT.type === "COLLECTIVITE" ? "Collectivité" : "Particulier"}
            </Badge>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 text-[10px]">
              Lead converti
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{CONTACT.interlocuteur}</p>
        </div>
        <Button variant="outline" size="sm">
          Modifier
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">{CONTACT.email}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Téléphone</p>
              <p className="text-sm font-medium">{CONTACT.telephone}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Adresse</p>
              <p className="text-sm font-medium truncate">{CONTACT.adresse}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">SIRET</p>
              <p className="text-sm font-medium">{CONTACT.siret}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
          <p className="text-sm leading-relaxed">{CONTACT.notes}</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="operations">
        <TabsList>
          <TabsTrigger value="operations" className="gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Opérations ({operations.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="infos" className="gap-1.5">
            Infos complètes
          </TabsTrigger>
        </TabsList>

        {/* Opérations */}
        <TabsContent value="operations" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Budget total : <span className="font-semibold text-foreground">{formatEuro(totalBudget)}</span>
              </p>
            </div>
            <Button size="sm" onClick={() => setShowOpForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle opération
            </Button>
          </div>

          {showOpForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Nouvelle opération de rénovation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="col-span-full space-y-1.5">
                      <label className="text-sm font-medium">Titre</label>
                      <input
                        type="text"
                        value={newOp.titre}
                        onChange={(e) => setNewOp({ ...newOp, titre: e.target.value })}
                        placeholder="Ex: Isolation thermique par l'extérieur"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Type de travaux</label>
                      <select
                        value={newOp.type}
                        onChange={(e) => setNewOp({ ...newOp, type: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      >
                        <option>Isolation combles</option>
                        <option>Isolation murs extérieurs</option>
                        <option>Remplacement chaudière</option>
                        <option>Installation PAC</option>
                        <option>VMC double flux</option>
                        <option>Panneaux solaires</option>
                        <option>Menuiseries</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Montant HT (€)</label>
                      <input
                        type="number"
                        value={newOp.montantHT}
                        onChange={(e) => setNewOp({ ...newOp, montantHT: e.target.value })}
                        placeholder="Ex: 85000"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Date début</label>
                      <input
                        type="date"
                        value={newOp.dateDebut}
                        onChange={(e) => setNewOp({ ...newOp, dateDebut: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Date fin prévue</label>
                      <input
                        type="date"
                        value={newOp.dateFin}
                        onChange={(e) => setNewOp({ ...newOp, dateFin: e.target.value })}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="col-span-full space-y-1.5">
                      <label className="text-sm font-medium">Description technique</label>
                      <textarea
                        value={newOp.description}
                        onChange={(e) => setNewOp({ ...newOp, description: e.target.value })}
                        rows={3}
                        placeholder="Détails techniques, matériaux, performances visées..."
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                      />
                    </div>
                    <div className="col-span-full space-y-1.5">
                      <label className="text-sm font-medium">Gain énergétique attendu</label>
                      <input
                        type="text"
                        value={newOp.gainEnergetique}
                        onChange={(e) => setNewOp({ ...newOp, gainEnergetique: e.target.value })}
                        placeholder="Ex: 35% de réduction des déperditions"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddOperation}>Ajouter</Button>
                    <Button variant="outline" size="sm" onClick={() => setShowOpForm(false)}>Annuler</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="space-y-3">
            {operations.map((op, i) => {
              const statusCfg = OP_STATUS_CONFIG[op.statut];
              const StatusIcon = statusCfg.icon;
              const TypeIcon = OP_TYPE_ICONS[op.type] || Wrench;
              return (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="group relative overflow-hidden">
                    <div className={cn(
                      "absolute left-0 top-0 h-full w-1",
                      op.statut === "TERMINEE" ? "bg-emerald-500" :
                      op.statut === "EN_COURS" ? "bg-amber-500" :
                      op.statut === "PLANIFIEE" ? "bg-blue-500" : "bg-zinc-400"
                    )} />
                    <CardContent className="p-4 pl-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                              <TypeIcon className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">{op.titre}</h3>
                            <Badge className={cn("text-xs gap-1", statusCfg.className)}>
                              <StatusIcon className="h-3 w-3" />
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{op.description}</p>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                            {op.montantHT && (
                              <span className="font-medium text-foreground">{formatEuro(op.montantHT)} HT</span>
                            )}
                            {op.dateDebut && op.dateFin && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {op.dateDebut} → {op.dateFin}
                              </span>
                            )}
                            {op.gainEnergetique && (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <Zap className="h-3 w-3" />
                                {op.gainEnergetique}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
                          onClick={() => handleDeleteOp(op.id)}
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
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{documents.length} documents</p>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Uploader
              </Button>
            </div>
          </div>

          {/* Upload zone */}
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center transition-colors hover:border-primary/30 hover:bg-muted/40 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium">Glissez-déposez vos fichiers ici</p>
            <p className="text-xs text-muted-foreground mt-1">ou cliquez pour parcourir — PDF, images, DWG, ZIP...</p>
          </div>

          {/* Documents list */}
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="rounded-lg bg-muted p-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.nom}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{doc.taille}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{doc.dateAjout}</span>
                    </div>
                  </div>
                  <Badge className={cn("text-[10px]", DOC_CAT_COLORS[doc.categorie])}>
                    {DOC_CATEGORIES[doc.categorie]}
                  </Badge>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteDoc(doc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Infos complètes */}
        <TabsContent value="infos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations complètes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nom / Raison sociale</label>
                  <input type="text" defaultValue={CONTACT.nom} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Entreprise</label>
                  <input type="text" defaultValue={CONTACT.entreprise} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" defaultValue={CONTACT.email} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Téléphone</label>
                  <input type="tel" defaultValue={CONTACT.telephone} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-sm font-medium">Adresse</label>
                  <input type="text" defaultValue={CONTACT.adresse} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">SIRET</label>
                  <input type="text" defaultValue={CONTACT.siret} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Interlocuteur principal</label>
                  <input type="text" defaultValue={CONTACT.interlocuteur} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Type</label>
                  <select defaultValue={CONTACT.type} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                    <option value="PARTICULIER">Particulier</option>
                    <option value="PROFESSIONNEL">Professionnel</option>
                    <option value="COLLECTIVITE">Collectivité</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date de création</label>
                  <input type="text" value={CONTACT.dateCreation} disabled className="w-full rounded-lg border bg-muted px-3 py-2 text-sm" />
                </div>
                <div className="col-span-full space-y-1.5">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    defaultValue={CONTACT.notes}
                    rows={4}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>
              <Button size="sm">Sauvegarder</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
