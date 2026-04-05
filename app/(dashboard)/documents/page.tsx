"use client";

import { useState, useEffect, useCallback } from "react";
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
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
} from "lucide-react";
import { motion } from "framer-motion";
import NoteDimensionnement from "@/components/dashboard/NoteDimensionnement";
import RapportVisite from "@/components/dashboard/RapportVisite";
import AuditEnergetique from "@/components/dashboard/AuditEnergetique";
import DevisDocument from "@/components/dashboard/DevisDocument";

type DocumentType = "RAPPORT_VISITE" | "DEVIS" | "NOTE_DIMENSIONNEMENT" | "AUDIT";
type DocumentStatus = "BROUILLON" | "EN_COURS" | "TERMINE" | "ENVOYE";

interface DocumentRecord {
  id: string;
  titre: string;
  type: DocumentType;
  statut: DocumentStatus;
  clientNom: string | null;
  reference: string;
  donnees: string | null;
  createdAt: string;
  updatedAt: string;
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

const TEMPLATES = [
  {
    type: "RAPPORT_VISITE" as DocumentType,
    title: "Rapport de visite technique",
    description: "Constat de l\u0027existant, relevé thermique, photos, préconisations de travaux et estimations budgétaires.",
    sections: ["Informations générales", "Description du bâti", "Enveloppe thermique", "Chauffage / ECS / Ventilation", "Préconisations", "Annexes photos"],
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
    description: "Calculs thermiques, dimensionnement des équipements (PAC, isolation, VMC), conformité fiches CEE.",
    sections: ["Informations projet", "Site existant", "Équipement projeté", "Calcul des gains", "Conformité", "Annexes photos"],
  },
  {
    type: "AUDIT" as DocumentType,
    title: "Audit énergétique",
    description: "Diagnostic complet avec DPE projeté, scénarios de rénovation, gains énergétiques et plan de financement.",
    sections: ["État des lieux", "Consommations actuelles", "Scénarios de rénovation", "Gains projetés", "Plan de financement", "DPE projeté"],
  },
];

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [activeTab, setActiveTab] = useState("generate");

  // ─── Fetch documents ─────────────────────────────────────
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data: DocumentRecord[] = await res.json();
        setDocuments(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ─── Delete document ─────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      // silently fail
    }
  }

  // ─── After save callback ─────────────────────────────────
  function handleDocumentSaved() {
    fetchDocuments();
    setSelectedType(null);
    setEditingDoc(null);
    setActiveTab("history");
  }

  // ─── Open for editing ────────────────────────────────────
  function handleEdit(doc: DocumentRecord) {
    setEditingDoc(doc);
    setSelectedType(doc.type);
    setActiveTab("generate");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Générez et gérez vos documents professionnels — {documents.length} au total
          </p>
        </div>
        <Button size="sm" onClick={() => { setSelectedType(null); setEditingDoc(null); setActiveTab("generate"); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau document
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Générer</TabsTrigger>
          <TabsTrigger value="history">
            Historique
            {documents.length > 0 && (
              <Badge variant="outline" className="ml-1.5 text-[10px]">{documents.length}</Badge>
            )}
          </TabsTrigger>
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
                      onClick={() => { setSelectedType(tpl.type); setEditingDoc(null); }}
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
                                <Badge key={s} variant="outline" className="text-[10px] font-normal">{s}</Badge>
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
          ) : selectedType === "NOTE_DIMENSIONNEMENT" ? (
            <NoteDimensionnement
              onBack={() => { setSelectedType(null); setEditingDoc(null); }}
              onSaved={handleDocumentSaved}
              existingDoc={editingDoc}
            />
          ) : selectedType === "RAPPORT_VISITE" ? (
            <RapportVisite
              onBack={() => { setSelectedType(null); setEditingDoc(null); }}
              onSaved={handleDocumentSaved}
              existingDoc={editingDoc}
            />
          ) : selectedType === "AUDIT" ? (
            <AuditEnergetique
              onBack={() => { setSelectedType(null); setEditingDoc(null); }}
              onSaved={handleDocumentSaved}
              existingDoc={editingDoc}
            />
          ) : selectedType === "DEVIS" ? (
            <DevisDocument
              onBack={() => { setSelectedType(null); setEditingDoc(null); }}
              onSaved={handleDocumentSaved}
              existingDoc={editingDoc}
            />
          ) : (
            <DocumentForm
              type={selectedType}
              onBack={() => { setSelectedType(null); setEditingDoc(null); }}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-3 text-sm font-medium">Aucun document</p>
                  <p className="text-xs text-muted-foreground">
                    Créez un rapport ou une note de dimensionnement pour commencer
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab("generate")}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Créer un document
                  </Button>
                </div>
              ) : (
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
                    {documents.map((doc) => {
                      const typeConfig = TYPE_CONFIG[doc.type];
                      const statusConfig = STATUS_CONFIG[doc.statut];
                      const StatusIcon = statusConfig.icon;
                      return (
                        <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(doc)}>
                          <TableCell className="font-mono text-xs">{doc.reference}</TableCell>
                          <TableCell className="font-medium text-sm">{doc.titre}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs gap-1">{typeConfig.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{doc.clientNom || "—"}</TableCell>
                          <TableCell>
                            <Badge className={`gap-1 ${statusConfig.className}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateFr(doc.updatedAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(doc)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentForm({ type, onBack }: { type: DocumentType; onBack: () => void }) {
  const config = TYPE_CONFIG[type];
  const template = TEMPLATES.find((t) => t.type === type);
  const Icon = config.icon;
  if (!template) return null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>&larr; Retour</Button>
        <div className={`rounded-lg p-2 ${config.color}`}><Icon className="h-5 w-5" /></div>
        <h2 className="text-lg font-semibold">{template.title}</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Icon className="h-10 w-10 text-muted-foreground/30" />
          <p className="mt-4 text-sm font-medium">Module en cours de développement</p>
          <p className="text-xs text-muted-foreground mt-1">
            Utilisez les rapports de visite et notes de dimensionnement pour générer des documents complets.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>Retour aux modèles</Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
