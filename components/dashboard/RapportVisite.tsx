"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Save,
  ClipboardCheck,
  Camera,
  X,
  ImagePlus,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

interface FormValues {
  [key: string]: string;
}

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  legende: string;
  categorie: string;
}

interface QuestionField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date" | "checkbox";
  placeholder?: string;
  unit?: string;
  options?: string[];
  required?: boolean;
  help?: string;
  colSpan?: 1 | 2;
}

interface QuestionSection {
  titre: string;
  description?: string;
  fields: QuestionField[];
}

// ─── Catégories de photos ───────────────────────────────────────

const PHOTO_CATEGORIES = [
  "Façade principale",
  "Façade arrière",
  "Toiture / Combles",
  "Menuiseries",
  "Système de chauffage (chaudière, PAC)",
  "Système ECS",
  "Ventilation (bouches, caisson VMC)",
  "Compteur électrique / tableau",
  "Points singuliers (fissures, humidité, ponts thermiques)",
  "Isolation existante",
  "Autre",
];

// ─── Questionnaire ──────────────────────────────────────────────

const SECTIONS: QuestionSection[] = [
  {
    titre: "1. Informations générales",
    description: "Identification du site, du bénéficiaire et du bureau d\u0027étude",
    fields: [
      { id: "ref_rapport", label: "Référence du rapport", type: "text", placeholder: "Ex: RV-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire", type: "text", placeholder: "Nom complet ou raison sociale", required: true },
      { id: "client_telephone", label: "Téléphone", type: "text", placeholder: "06 XX XX XX XX" },
      { id: "client_email", label: "Email", type: "text", placeholder: "email@exemple.fr" },
      { id: "adresse", label: "Adresse du bien", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "accompagnant", label: "Personne présente lors de la visite", type: "text", placeholder: "Nom et qualité" },
    ],
  },
  {
    titre: "2. Description du bâtiment",
    description: "Caractéristiques générales du bâtiment visité",
    fields: [
      {
        id: "type_batiment", label: "Type de bâtiment", type: "select", required: true,
        options: ["Maison individuelle", "Appartement", "Immeuble collectif", "Bâtiment tertiaire", "Bâtiment public", "Local commercial"],
      },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1975", required: true },
      { id: "surface_habitable", label: "Surface habitable", type: "number", placeholder: "Ex: 120", unit: "m²", required: true },
      { id: "nb_niveaux", label: "Nombre de niveaux", type: "number", placeholder: "Ex: 2" },
      { id: "hauteur_plafond", label: "Hauteur sous plafond moyenne", type: "number", placeholder: "Ex: 2.5", unit: "m" },
      { id: "nb_pieces", label: "Nombre de pièces", type: "number", placeholder: "Ex: 6" },
      {
        id: "orientation", label: "Orientation principale", type: "select",
        options: ["Nord", "Sud", "Est", "Ouest", "Nord-Est", "Nord-Ouest", "Sud-Est", "Sud-Ouest"],
      },
      {
        id: "mitoyennete", label: "Mitoyenneté", type: "select",
        options: ["Isolé", "Mitoyen un côté", "Mitoyen deux côtés"],
      },
      {
        id: "type_structure", label: "Type de structure", type: "select",
        options: ["Maçonnerie traditionnelle", "Béton", "Ossature bois", "Pierre", "Parpaing", "Brique", "Autre"],
      },
      {
        id: "zone_climatique", label: "Zone climatique", type: "select", required: true,
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
      },
      {
        id: "description_generale", label: "Description générale et observations", type: "textarea", colSpan: 2,
        placeholder: "Décrire l\u0027état général du bâtiment, son environnement, les particularités...",
      },
    ],
  },
  {
    titre: "3. Enveloppe — Murs",
    description: "État et isolation des murs extérieurs",
    fields: [
      {
        id: "type_mur", label: "Type de mur", type: "select", required: true,
        options: ["Parpaing creux", "Brique pleine", "Brique creuse", "Pierre", "Béton banché", "Ossature bois", "Autre"],
      },
      { id: "epaisseur_mur", label: "Épaisseur des murs", type: "number", placeholder: "Ex: 30", unit: "cm" },
      {
        id: "isolation_murs", label: "Isolation des murs", type: "select", required: true,
        options: ["Non isolé", "Isolation intérieure", "Isolation extérieure (ITE)", "Isolation répartie", "Inconnu"],
      },
      { id: "type_isolant_murs", label: "Type d\u0027isolant (si isolé)", type: "text", placeholder: "Ex: Laine de verre, PSE..." },
      { id: "epaisseur_isolant_murs", label: "Épaisseur de l\u0027isolant", type: "number", placeholder: "Ex: 10", unit: "cm" },
      {
        id: "etat_murs", label: "État des murs", type: "select",
        options: ["Bon état", "Dégradations mineures", "Dégradations importantes", "Humidité visible", "Fissures"],
      },
      {
        id: "observations_murs", label: "Observations et pathologies", type: "textarea", colSpan: 2,
        placeholder: "Ponts thermiques identifiés, traces d\u0027humidité, fissures, moisissures...",
      },
    ],
  },
  {
    titre: "4. Enveloppe — Toiture / Combles",
    description: "État et isolation de la toiture et des combles",
    fields: [
      {
        id: "type_toiture", label: "Type de toiture / combles", type: "select", required: true,
        options: ["Combles perdus", "Combles aménagés", "Toiture terrasse", "Rampants"],
      },
      {
        id: "isolation_toiture", label: "Isolation", type: "select", required: true,
        options: ["Non isolé", "Isolé par le plancher", "Isolé sous rampants", "Isolation extérieure (sarking)", "Inconnu"],
      },
      { id: "type_isolant_toiture", label: "Type d\u0027isolant", type: "text", placeholder: "Ex: Laine de roche, ouate de cellulose..." },
      { id: "epaisseur_isolant_toiture", label: "Épaisseur", type: "number", placeholder: "Ex: 20", unit: "cm" },
      {
        id: "etat_toiture", label: "État de la toiture", type: "select",
        options: ["Bon état", "Dégradations mineures", "Infiltrations", "Condensation visible"],
      },
      {
        id: "accessibilite_combles", label: "Accessibilité des combles", type: "select",
        options: ["Trappe accessible", "Accès difficile", "Pas d\u0027accès"],
      },
      { id: "observations_toiture", label: "Observations", type: "textarea", colSpan: 2, placeholder: "État de la charpente, présence de VMC, parasites..." },
    ],
  },
  {
    titre: "5. Enveloppe — Menuiseries",
    description: "État des fenêtres, portes et ouvrants",
    fields: [
      {
        id: "type_vitrage", label: "Type de vitrage", type: "select", required: true,
        options: ["Simple vitrage", "Double vitrage ancien (avant 2000)", "Double vitrage récent", "Triple vitrage", "Mixte"],
      },
      {
        id: "type_menuiserie", label: "Type de menuiserie", type: "select",
        options: ["PVC", "Bois", "Aluminium", "Aluminium à rupture de pont thermique", "Mixte bois-alu"],
      },
      { id: "nb_fenetres", label: "Nombre de fenêtres", type: "number", placeholder: "Ex: 8" },
      { id: "nb_portes_fenetres", label: "Nombre de portes-fenêtres", type: "number", placeholder: "Ex: 2" },
      {
        id: "etat_menuiseries", label: "État des menuiseries", type: "select",
        options: ["Bon état", "Joints défectueux", "Condensation entre vitrages", "Bois dégradé"],
      },
      {
        id: "volets", label: "Type de volets", type: "select",
        options: ["Volets roulants", "Volets battants", "Persiennes", "Pas de volets"],
      },
      { id: "observations_menuiseries", label: "Observations", type: "textarea", colSpan: 2, placeholder: "Étanchéité à l\u0027air, courants d\u0027air, état des joints..." },
    ],
  },
  {
    titre: "6. Enveloppe — Plancher bas",
    description: "État et isolation du plancher bas",
    fields: [
      {
        id: "type_plancher", label: "Type de plancher bas", type: "select", required: true,
        options: ["Terre-plein", "Vide sanitaire", "Sous-sol / cave", "Sur local non chauffé"],
      },
      {
        id: "isolation_plancher", label: "Isolation du plancher", type: "select", required: true,
        options: ["Non isolé", "Isolé sous dalle", "Isolé en sous-face", "Inconnu"],
      },
      { id: "type_isolant_plancher", label: "Type d\u0027isolant", type: "text", placeholder: "Ex: Polyuréthane projeté, PSE..." },
      { id: "epaisseur_isolant_plancher", label: "Épaisseur", type: "number", placeholder: "Ex: 10", unit: "cm" },
      { id: "observations_plancher", label: "Observations", type: "textarea", colSpan: 2, placeholder: "Humidité, remontées capillaires, accessibilité du vide sanitaire..." },
    ],
  },
  {
    titre: "7. Chauffage",
    description: "Système de chauffage existant",
    fields: [
      {
        id: "type_chauffage", label: "Type de chauffage", type: "select", required: true,
        options: ["Chaudière gaz", "Chaudière fioul", "Chaudière bois / granulés", "PAC air/eau", "PAC air/air", "Convecteurs électriques", "Radiateurs électriques", "Poêle à bois", "Plancher chauffant", "Autre"],
      },
      { id: "marque_chauffage", label: "Marque et modèle", type: "text", placeholder: "Ex: De Dietrich MCR3 24/28" },
      { id: "annee_chauffage", label: "Année d\u0027installation", type: "number", placeholder: "Ex: 2005" },
      { id: "puissance_chauffage", label: "Puissance nominale", type: "number", placeholder: "Ex: 24", unit: "kW" },
      {
        id: "etat_chauffage", label: "État du chauffage", type: "select",
        options: ["Bon état", "Vétuste", "Dysfonctionnements", "À remplacer"],
      },
      {
        id: "type_emetteurs", label: "Type d\u0027émetteurs", type: "select",
        options: ["Radiateurs haute température", "Radiateurs basse température", "Plancher chauffant", "Ventilo-convecteurs", "Convecteurs", "Mixte"],
      },
      {
        id: "regulation", label: "Régulation", type: "select",
        options: ["Thermostat d\u0027ambiance", "Robinets thermostatiques", "Programmation horaire", "Sonde extérieure", "Aucune régulation"],
      },
      { id: "observations_chauffage", label: "Observations", type: "textarea", colSpan: 2, placeholder: "Entretien, dysfonctionnements, bruit, consommations connues..." },
    ],
  },
  {
    titre: "8. Eau chaude sanitaire",
    description: "Système de production d\u0027eau chaude",
    fields: [
      {
        id: "type_ecs", label: "Type de production ECS", type: "select", required: true,
        options: ["Chaudière (combinée)", "Ballon électrique", "Ballon thermodynamique", "Solaire thermique", "Chauffe-eau gaz", "PAC dédiée"],
      },
      { id: "capacite_ecs", label: "Capacité du ballon", type: "number", placeholder: "Ex: 200", unit: "L" },
      { id: "annee_ecs", label: "Année d\u0027installation", type: "number", placeholder: "Ex: 2010" },
      {
        id: "etat_ecs", label: "État", type: "select",
        options: ["Bon état", "Vétuste", "Entartré", "À remplacer"],
      },
      { id: "observations_ecs", label: "Observations", type: "textarea", colSpan: 2, placeholder: "Température, débit, calorifugeage des tuyauteries..." },
    ],
  },
  {
    titre: "9. Ventilation",
    description: "Système de ventilation du bâtiment",
    fields: [
      {
        id: "type_ventilation", label: "Type de ventilation", type: "select", required: true,
        options: ["VMC simple flux autoréglable", "VMC simple flux hygroréglable A", "VMC simple flux hygroréglable B", "VMC double flux", "Ventilation naturelle", "Aucune ventilation mécanique"],
      },
      {
        id: "etat_ventilation", label: "État de la ventilation", type: "select",
        options: ["Bon état", "Encrassé", "Bruyant", "Hors service"],
      },
      { id: "bouches_extraction", label: "Bouches d\u0027extraction", type: "text", placeholder: "Nombre et emplacement (cuisine, SdB, WC...)" },
      { id: "observations_ventilation", label: "Observations", type: "textarea", colSpan: 2, placeholder: "Condensation, moisissures, courants d\u0027air, qualité de l\u0027air intérieur..." },
    ],
  },
  {
    titre: "10. Préconisations et conclusion",
    description: "Recommandations de travaux et synthèse de la visite",
    fields: [
      {
        id: "preconisations", label: "Préconisations de travaux", type: "textarea", required: true, colSpan: 2,
        placeholder: "Lister les travaux recommandés par ordre de priorité :\n1. Isolation (combles, murs, plancher)\n2. Chauffage (remplacement, régulation)\n3. ECS (ballon thermodynamique, solaire)\n4. Ventilation (VMC hygroréglable, double flux)\n5. Menuiseries (remplacement fenêtres)\n6. Autres (ponts thermiques, étanchéité...)",
      },
      {
        id: "priorite_travaux", label: "Niveau de priorité", type: "select", required: true,
        options: ["Urgents (sécurité / santé)", "Prioritaires (performance énergétique)", "Recommandés (confort / valorisation)"],
      },
      {
        id: "dpe_estime", label: "DPE actuel estimé", type: "select",
        options: ["A — ≤ 70 kWh/m²/an", "B — 71 à 110", "C — 111 à 180", "D — 181 à 250", "E — 251 à 330", "F — 331 à 420", "G — > 420"],
      },
      {
        id: "dpe_vise", label: "DPE visé après travaux", type: "select",
        options: ["A — ≤ 70 kWh/m²/an", "B — 71 à 110", "C — 111 à 180", "D — 181 à 250"],
      },
      {
        id: "aides_mobilisables", label: "Aides financières mobilisables", type: "textarea", colSpan: 2,
        placeholder: "MaPrimeRénov\u0027, CEE, Éco-PTZ, aides locales, Coup de pouce...",
      },
      {
        id: "conclusion", label: "Conclusion et avis technique", type: "textarea", required: true, colSpan: 2,
        placeholder: "Synthèse de la visite : état général du bâtiment, points critiques identifiés, bouquet de travaux recommandé, gains énergétiques attendus, prochaines étapes...",
      },
    ],
  },
];

// ─── Props ──────────────────────────────────────────────────────

interface DocumentRecord {
  id: string;
  titre: string;
  reference: string;
  type: string;
  statut: string;
  clientNom: string | null;
  donnees: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onBack: () => void;
  onSaved?: () => void;
  existingDoc?: DocumentRecord | null;
}

// ─── PDF Generation ─────────────────────────────────────────────

async function generatePDF(
  sections: QuestionSection[],
  values: FormValues,
  photos: PhotoItem[],
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const {
    drawCoverPage,
    drawSectionHeader,
    drawFooter,
    drawPhotoAppendixHeader,
    drawPhotoEntry,
    getDataTableConfig,
    needsPageBreak,
    PDF_LAYOUT,
  } = await import("@/lib/pdf-styles");

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const contentWidth = pageWidth - margin * 2;

  function checkPage(needed: number) {
    if (needsPageBreak(y, needed)) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
  }

  const reference = values.ref_rapport || "Ref. non definie";

  // ─── Cover page ──────────────────────────────────────────
  let y = drawCoverPage(
    doc,
    "Rapport de visite technique",
    "Constat de l'existant et preconisations de travaux",
    [
      ["Reference", reference],
      ["Beneficiaire", values.client_nom || "—"],
      ["Adresse du bien", values.adresse || "—"],
      ["Date de visite", values.date_visite || "—"],
      ["Redacteur", values.redacteur || "—"],
      ["Telephone", values.client_telephone || "—"],
    ],
    reference,
  );

  // ─── Sections ─────────────────────────────────────────────
  for (const section of sections) {
    const tableData: string[][] = [];
    for (const field of section.fields) {
      const val = values[field.id];
      if (!val || !val.trim()) continue;
      const label = field.unit ? `${field.label} (${field.unit})` : field.label;
      tableData.push([label, val]);
    }
    if (tableData.length === 0) continue;

    checkPage(30);
    y = drawSectionHeader(doc, section.titre, y, section.description);
    autoTable(doc, getDataTableConfig(y, tableData, contentWidth));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + PDF_LAYOUT.sectionGap;
  }

  // ─── Photo appendix ──────────────────────────────────────
  if (photos.length > 0) {
    doc.addPage();
    y = drawPhotoAppendixHeader(doc);

    for (let i = 0; i < photos.length; i++) {
      checkPage(85);
      y = drawPhotoEntry(doc, i, photos[i].preview, photos[i].categorie, photos[i].legende, y);
    }
  }

  // ─── Footers ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Rapport de visite technique", reference, i, totalPages);
  }

  const filename = `Rapport_Visite_${values.ref_rapport || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ─── Component ──────────────────────────────────────────────────

export default function RapportVisite({ onBack, onSaved, existingDoc }: Props) {
  const [activeSection, setActiveSection] = useState(0);
  const [values, setValues] = useState<FormValues>(() => {
    if (existingDoc?.donnees) {
      try { return JSON.parse(existingDoc.donnees); } catch { return {}; }
    }
    return {};
  });
  const [docId, setDocId] = useState<string | null>(existingDoc?.id ?? null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const titre = values.ref_rapport
        ? `Visite technique — ${values.client_nom || "Sans client"}`
        : "Rapport de visite (brouillon)";
      const reference = values.ref_rapport || `RV-${Date.now().toString(36).toUpperCase()}`;
      const donnees = JSON.stringify(values);

      if (docId) {
        // Update existing
        const res = await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titre,
            clientNom: values.client_nom || null,
            donnees,
            statut: "EN_COURS",
          }),
        });
        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          onSaved?.();
        }
      } else {
        // Create new
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titre,
            reference,
            type: "RAPPORT_VISITE",
            statut: "EN_COURS",
            clientNom: values.client_nom || null,
            donnees,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setDocId(created.id);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          onSaved?.();
        }
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  const handleAddPhotos = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            preview: reader.result as string,
            legende: "",
            categorie: "Autre",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, []);

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePhotoLegende(id: string, legende: string) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, legende } : p)));
  }

  function updatePhotoCategorie(id: string, categorie: string) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, categorie } : p)));
  }

  async function handleGeneratePDF() {
    setGenerating(true);
    try {
      await generatePDF(SECTIONS, values, photos);
      // Mark as TERMINE after PDF generation
      if (docId) {
        await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: "TERMINE" }),
        });
        onSaved?.();
      } else {
        // Auto-save first if not yet saved
        await handleSave();
      }
    } finally {
      setGenerating(false);
    }
  }

  const currentSection = showPhotos ? null : SECTIONS[activeSection];
  const allRequired = SECTIONS.flatMap((s) => s.fields.filter((f) => f.required));
  const filledRequired = allRequired.filter((f) => values[f.id]?.trim());
  const completionPct = allRequired.length > 0 ? Math.round((filledRequired.length / allRequired.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <div className="rounded-lg bg-blue-500/10 p-2 text-blue-700 dark:text-blue-300">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Rapport de visite technique</h2>
            <p className="text-sm text-muted-foreground">
              {completionPct}% complété — {filledRequired.length}/{allRequired.length} champs obligatoires
              {photos.length > 0 && ` — ${photos.length} photo${photos.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Sauvegarde..." : saved ? "Sauvegardé" : "Sauvegarder"}
          </Button>
          <Button size="sm" onClick={handleGeneratePDF} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {generating ? "Génération..." : "Générer le PDF"}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Navigation */}
        <div className="space-y-1">
          {SECTIONS.map((section, i) => {
            const sectionFields = section.fields.filter((f) => f.required);
            const sectionFilled = sectionFields.filter((f) => values[f.id]?.trim());
            const sectionComplete = sectionFields.length > 0 && sectionFilled.length === sectionFields.length;
            return (
              <button
                key={i}
                onClick={() => { setActiveSection(i); setShowPhotos(false); }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  !showPhotos && activeSection === i
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {sectionComplete ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : sectionFilled.length > 0 ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">{i + 1}</span>
                )}
                <span className="truncate">{section.titre}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowPhotos(true)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors mt-2 border-t pt-3",
              showPhotos ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Camera className="h-4 w-4 shrink-0" />
            <span className="truncate">Photos de la visite</span>
            {photos.length > 0 && (
              <Badge variant="outline" className="ml-auto text-[10px]">{photos.length}</Badge>
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {showPhotos ? (
            <motion.div key="photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Photos de la visite
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Documentez l&apos;état du bâtiment : façades, toiture, équipements, pathologies...
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Ajouter des photos</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG — Cliquez ou glissez-déposez</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
                  </div>

                  {photos.length > 0 && (
                    <div className="space-y-4">
                      {photos.map((photo, i) => (
                        <div key={photo.id} className="flex gap-4 rounded-lg border p-3">
                          <div className="relative w-32 h-24 shrink-0 rounded-md overflow-hidden bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.preview} alt={photo.legende || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                            <button onClick={() => removePhoto(photo.id)} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white shadow-sm">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex-1 space-y-2">
                            <span className="text-xs font-medium text-muted-foreground">Photo {i + 1}</span>
                            <select
                              value={photo.categorie}
                              onChange={(e) => updatePhotoCategorie(photo.id, e.target.value)}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                            >
                              {PHOTO_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={photo.legende}
                              onChange={(e) => updatePhotoLegende(photo.id, e.target.value)}
                              placeholder="Légende de la photo..."
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : currentSection ? (
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{currentSection.titre}</CardTitle>
                  {currentSection.description && <p className="text-sm text-muted-foreground">{currentSection.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {currentSection.fields.map((field) => (
                      <div key={field.id} className={cn("space-y-1.5", field.colSpan === 2 && "sm:col-span-2")}>
                        <label className="text-sm font-medium flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-destructive">*</span>}
                          {field.unit && <span className="text-xs text-muted-foreground font-normal">({field.unit})</span>}
                        </label>

                        {field.type === "select" ? (
                          <select
                            value={values[field.id] || ""}
                            onChange={(e) => updateValue(field.id, e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          >
                            <option value="">— Sélectionner —</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === "textarea" ? (
                          <textarea
                            value={values[field.id] || ""}
                            onChange={(e) => updateValue(field.id, e.target.value)}
                            rows={5}
                            placeholder={field.placeholder}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={values[field.id] || ""}
                            onChange={(e) => updateValue(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        )}

                        {field.help && <p className="text-[11px] text-muted-foreground leading-snug">{field.help}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setActiveSection(Math.max(0, activeSection - 1))} disabled={activeSection === 0}>
                      &larr; Précédent
                    </Button>
                    {activeSection < SECTIONS.length - 1 ? (
                      <Button size="sm" onClick={() => setActiveSection(activeSection + 1)}>
                        Suivant &rarr;
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleGeneratePDF} disabled={generating}>
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        {generating ? "Génération..." : "Générer le PDF"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
