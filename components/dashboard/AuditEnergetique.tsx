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
  FileText,
  Camera,
  X,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

interface FormValues { [key: string]: string }

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
  type: "text" | "number" | "select" | "textarea" | "date";
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

// ─── Photo categories ───────────────────────────────────────────

const PHOTO_CATEGORIES = [
  "Façade principale",
  "Façade arrière",
  "Toiture / Combles",
  "Menuiseries",
  "Système de chauffage",
  "Compteurs / Factures",
  "Ponts thermiques (thermographie)",
  "Système de ventilation",
  "Étiquette DPE existant",
  "Autre",
];

// ─── Sections ───────────────────────────────────────────────────

const SECTIONS: QuestionSection[] = [
  {
    titre: "1. Informations générales",
    description: "Identification du bâtiment et du commanditaire",
    fields: [
      { id: "ref_audit", label: "Référence de l'audit", type: "text", placeholder: "Ex: AU-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite", type: "date", required: true },
      { id: "redacteur", label: "Auditeur / Rédacteur", type: "text", placeholder: "Nom et qualification", required: true },
      { id: "client_nom", label: "Bénéficiaire", type: "text", placeholder: "Nom complet ou raison sociale", required: true },
      { id: "client_telephone", label: "Téléphone", type: "text", placeholder: "06 XX XX XX XX" },
      { id: "client_email", label: "Email", type: "text", placeholder: "email@exemple.fr" },
      { id: "adresse", label: "Adresse du bien", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "nb_occupants", label: "Nombre d'occupants", type: "number", placeholder: "Ex: 4" },
      { id: "usage_batiment", label: "Usage du bâtiment", type: "select", options: ["Résidence principale", "Résidence secondaire", "Location", "Bureaux", "Commerce", "Autre"], required: true },
    ],
  },
  {
    titre: "2. Description du bâtiment",
    description: "Caractéristiques architecturales et constructives",
    fields: [
      { id: "type_batiment", label: "Type de bâtiment", type: "select", required: true, options: ["Maison individuelle", "Appartement", "Immeuble collectif", "Bâtiment tertiaire", "Bâtiment public"] },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1975", required: true },
      { id: "surface_habitable", label: "Surface habitable (SHAB)", type: "number", placeholder: "Ex: 120", unit: "m²", required: true },
      { id: "surface_plancher", label: "Surface de plancher", type: "number", placeholder: "Ex: 140", unit: "m²" },
      { id: "nb_niveaux", label: "Nombre de niveaux", type: "number", placeholder: "Ex: 2" },
      { id: "hauteur_plafond", label: "Hauteur sous plafond", type: "number", placeholder: "Ex: 2.5", unit: "m" },
      { id: "zone_climatique", label: "Zone climatique", type: "select", required: true, options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"] },
      { id: "altitude", label: "Altitude", type: "number", placeholder: "Ex: 150", unit: "m" },
      { id: "orientation", label: "Orientation principale", type: "select", options: ["Nord", "Sud", "Est", "Ouest", "Nord-Est", "Nord-Ouest", "Sud-Est", "Sud-Ouest"] },
      { id: "mitoyennete", label: "Mitoyenneté", type: "select", options: ["Isolé (4 façades)", "Mitoyen un côté", "Mitoyen deux côtés", "En bande"] },
      { id: "type_structure", label: "Structure", type: "select", options: ["Maçonnerie", "Béton", "Ossature bois", "Pierre", "Parpaing", "Brique", "Mixte"] },
    ],
  },
  {
    titre: "3. État de l'enveloppe thermique",
    description: "Murs, toiture, plancher, menuiseries — résistance thermique et état",
    fields: [
      { id: "murs_composition", label: "Composition des murs", type: "text", placeholder: "Ex: Parpaing 20cm + doublage PSE 4cm", required: true },
      { id: "murs_r", label: "R des murs estimée", type: "number", placeholder: "Ex: 1.2", unit: "m².K/W" },
      { id: "murs_isolation", label: "Isolation murs", type: "select", options: ["Non isolé", "Isolation intérieure", "Isolation extérieure (ITE)", "Isolation répartie"], required: true },
      { id: "toiture_type", label: "Type de toiture / combles", type: "select", options: ["Combles perdus", "Combles aménagés", "Toiture terrasse", "Rampants"], required: true },
      { id: "toiture_r", label: "R de la toiture estimée", type: "number", placeholder: "Ex: 3.5", unit: "m².K/W" },
      { id: "toiture_isolation", label: "Isolation toiture", type: "select", options: ["Non isolé", "Isolé insuffisamment (< R4)", "Isolé correctement (R4-R6)", "Bien isolé (> R6)"], required: true },
      { id: "plancher_type", label: "Type de plancher bas", type: "select", options: ["Terre-plein", "Vide sanitaire", "Sous-sol", "Sur local non chauffé"], required: true },
      { id: "plancher_r", label: "R du plancher estimée", type: "number", placeholder: "Ex: 0.5", unit: "m².K/W" },
      { id: "plancher_isolation", label: "Isolation plancher", type: "select", options: ["Non isolé", "Isolé sous dalle", "Isolé en sous-face", "Inconnu"], required: true },
      { id: "menuiseries_type", label: "Type de vitrage", type: "select", options: ["Simple vitrage", "Double vitrage ancien", "Double vitrage récent", "Triple vitrage", "Mixte"], required: true },
      { id: "menuiseries_materiau", label: "Matériau menuiseries", type: "select", options: ["PVC", "Bois", "Aluminium", "Alu RPT", "Mixte bois-alu"] },
      { id: "ponts_thermiques", label: "Ponts thermiques identifiés", type: "textarea", colSpan: 2, placeholder: "Décrire les ponts thermiques : liaison mur/plancher, mur/toiture, appuis de fenêtre, balcons..." },
    ],
  },
  {
    titre: "4. Systèmes énergétiques",
    description: "Chauffage, eau chaude sanitaire, ventilation, climatisation",
    fields: [
      { id: "chauffage_type", label: "Type de chauffage", type: "select", required: true, options: ["Chaudière gaz", "Chaudière fioul", "Chaudière bois/granulés", "PAC air/eau", "PAC air/air", "Convecteurs électriques", "Radiateurs électriques", "Poêle à bois", "Réseau de chaleur", "Autre"] },
      { id: "chauffage_marque", label: "Marque / modèle", type: "text", placeholder: "Ex: De Dietrich MCR3 24/28" },
      { id: "chauffage_annee", label: "Année d'installation", type: "number", placeholder: "Ex: 2005" },
      { id: "chauffage_puissance", label: "Puissance", type: "number", placeholder: "Ex: 24", unit: "kW" },
      { id: "chauffage_rendement", label: "Rendement estimé", type: "number", placeholder: "Ex: 85", unit: "%" },
      { id: "emetteurs", label: "Type d'émetteurs", type: "select", options: ["Radiateurs haute T°", "Radiateurs basse T°", "Plancher chauffant", "Ventilo-convecteurs", "Convecteurs", "Mixte"] },
      { id: "regulation", label: "Régulation", type: "select", options: ["Aucune", "Thermostat simple", "Thermostat programmable", "Robinets thermostatiques", "Sonde extérieure", "GTB"] },
      { id: "ecs_type", label: "Production ECS", type: "select", required: true, options: ["Chaudière combinée", "Ballon électrique", "Ballon thermodynamique", "Solaire thermique", "Chauffe-eau gaz", "Autre"] },
      { id: "ecs_volume", label: "Volume ballon ECS", type: "number", placeholder: "Ex: 200", unit: "L" },
      { id: "ventilation_type", label: "Ventilation", type: "select", required: true, options: ["Aucune", "Naturelle", "VMC SF autoréglable", "VMC SF hygroréglable B", "VMC double flux", "Autre"] },
      { id: "climatisation", label: "Climatisation", type: "select", options: ["Aucune", "Split(s) individuel(s)", "Système centralisé", "PAC réversible"] },
      { id: "observations_systemes", label: "Observations sur les systèmes", type: "textarea", colSpan: 2, placeholder: "État des équipements, entretien, dysfonctionnements observés..." },
    ],
  },
  {
    titre: "5. Consommations et DPE actuel",
    description: "Analyse des consommations réelles et étiquette énergétique",
    fields: [
      { id: "conso_chauffage", label: "Consommation chauffage", type: "number", placeholder: "Ex: 12000", unit: "kWh/an", required: true },
      { id: "conso_ecs", label: "Consommation ECS", type: "number", placeholder: "Ex: 3500", unit: "kWh/an" },
      { id: "conso_electricite", label: "Consommation électricité (hors chauffage)", type: "number", placeholder: "Ex: 4500", unit: "kWh/an" },
      { id: "conso_totale", label: "Consommation totale énergie primaire", type: "number", placeholder: "Ex: 22000", unit: "kWhEP/an", required: true },
      { id: "conso_par_m2", label: "Consommation par m²", type: "number", placeholder: "Ex: 280", unit: "kWhEP/m²/an", required: true, help: "= Conso totale / Surface habitable" },
      { id: "facture_annuelle", label: "Facture énergétique annuelle", type: "number", placeholder: "Ex: 2800", unit: "€/an" },
      { id: "source_conso", label: "Source des données", type: "select", required: true, options: ["Factures (3 ans)", "Factures (1 an)", "Estimation par calcul", "DPE existant", "Compteurs dédiés"] },
      { id: "dpe_actuel", label: "Étiquette DPE actuelle", type: "select", required: true, options: ["A — ≤ 70 kWhEP/m²/an", "B — 71 à 110", "C — 111 à 180", "D — 181 à 250", "E — 251 à 330", "F — 331 à 420", "G — > 420"] },
      { id: "ges_actuel", label: "Étiquette GES actuelle", type: "select", options: ["A — ≤ 6 kgCO₂/m²/an", "B — 7 à 11", "C — 12 à 30", "D — 31 à 50", "E — 51 à 70", "F — 71 à 100", "G — > 100"] },
      { id: "emissions_co2", label: "Émissions CO₂ annuelles", type: "number", placeholder: "Ex: 4.2", unit: "tCO₂/an" },
    ],
  },
  {
    titre: "6. Scénarios de rénovation",
    description: "Bouquets de travaux proposés avec gains et coûts estimés",
    fields: [
      {
        id: "scenario_1", label: "Scénario 1 — Rénovation par étapes", type: "textarea", required: true, colSpan: 2,
        placeholder: "Décrire les travaux par ordre de priorité :\n1. Isolation combles (R≥7) — gain estimé, coût\n2. Remplacement chaudière par PAC — gain, coût\n3. Isolation murs ITE — gain, coût\n4. Menuiseries — gain, coût\n5. VMC — gain, coût\n\nGain total estimé : XX%\nCoût total estimé : XX XXX € TTC\nDPE visé : X",
      },
      { id: "scenario_1_gain", label: "Gain énergétique scénario 1", type: "number", placeholder: "Ex: 55", unit: "%" },
      { id: "scenario_1_cout", label: "Coût estimé scénario 1", type: "number", placeholder: "Ex: 45000", unit: "€ TTC" },
      { id: "scenario_1_dpe", label: "DPE visé scénario 1", type: "select", options: ["A", "B", "C", "D"] },
      {
        id: "scenario_2", label: "Scénario 2 — Rénovation globale performante", type: "textarea", required: true, colSpan: 2,
        placeholder: "Bouquet complet de travaux pour atteindre le niveau BBC rénovation :\n- Isolation complète (murs + combles + plancher)\n- Remplacement système de chauffage\n- Ventilation performante\n- Menuiseries\n\nGain total estimé : XX%\nCoût total estimé : XX XXX € TTC\nDPE visé : A ou B",
      },
      { id: "scenario_2_gain", label: "Gain énergétique scénario 2", type: "number", placeholder: "Ex: 75", unit: "%" },
      { id: "scenario_2_cout", label: "Coût estimé scénario 2", type: "number", placeholder: "Ex: 85000", unit: "€ TTC" },
      { id: "scenario_2_dpe", label: "DPE visé scénario 2", type: "select", options: ["A", "B", "C", "D"] },
    ],
  },
  {
    titre: "7. Plan de financement et aides",
    description: "Aides mobilisables et reste à charge pour chaque scénario",
    fields: [
      { id: "mprenov_montant", label: "MaPrimeRénov' estimée", type: "number", placeholder: "Ex: 10000", unit: "€", help: "Selon revenus et travaux — barème en vigueur" },
      { id: "cee_montant", label: "Prime CEE estimée", type: "number", placeholder: "Ex: 4000", unit: "€" },
      { id: "eco_ptz", label: "Éco-PTZ mobilisable", type: "number", placeholder: "Ex: 30000", unit: "€", help: "Plafond 50 000€ pour rénovation globale" },
      { id: "aides_locales", label: "Aides locales / départementales", type: "number", placeholder: "Ex: 2000", unit: "€" },
      { id: "total_aides", label: "Total des aides estimé", type: "number", placeholder: "Ex: 16000", unit: "€", required: true },
      { id: "reste_charge_s1", label: "Reste à charge scénario 1", type: "number", placeholder: "Ex: 29000", unit: "€" },
      { id: "reste_charge_s2", label: "Reste à charge scénario 2", type: "number", placeholder: "Ex: 69000", unit: "€" },
      { id: "economie_annuelle", label: "Économie annuelle estimée (scénario recommandé)", type: "number", placeholder: "Ex: 1500", unit: "€/an" },
      { id: "temps_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 12", unit: "ans" },
      { id: "details_financement", label: "Détails et conditions des aides", type: "textarea", colSpan: 2, placeholder: "Préciser les conditions d'éligibilité, les démarches, les délais, les artisans RGE requis..." },
    ],
  },
  {
    titre: "8. Conclusion et recommandations",
    description: "Synthèse de l'audit et avis de l'auditeur",
    fields: [
      { id: "scenario_recommande", label: "Scénario recommandé", type: "select", required: true, options: ["Scénario 1 — Rénovation par étapes", "Scénario 2 — Rénovation globale performante"] },
      { id: "dpe_projete", label: "DPE projeté après travaux", type: "select", required: true, options: ["A — ≤ 70 kWhEP/m²/an", "B — 71 à 110", "C — 111 à 180", "D — 181 à 250"] },
      { id: "gain_global", label: "Gain énergétique global", type: "number", placeholder: "Ex: 65", unit: "%", required: true },
      { id: "reduction_co2", label: "Réduction des émissions CO₂", type: "number", placeholder: "Ex: 3.2", unit: "tCO₂/an" },
      { id: "priorite_travaux", label: "Priorité des travaux", type: "textarea", required: true, colSpan: 2, placeholder: "Ordonner les travaux par priorité et justifier :\n1. ...\n2. ...\n3. ..." },
      { id: "points_vigilance", label: "Points de vigilance", type: "textarea", colSpan: 2, placeholder: "Risques identifiés : condensation après isolation, ventilation insuffisante, contraintes architecturales, servitudes..." },
      { id: "conclusion", label: "Conclusion générale", type: "textarea", required: true, colSpan: 2, placeholder: "Synthèse de l'audit : diagnostic global, scénario recommandé, gains attendus, prochaines étapes pour le bénéficiaire..." },
    ],
  },
];

// ─── PDF Generation ─────────────────────────────────────────────

async function generatePDF(sections: QuestionSection[], values: FormValues, photos: PhotoItem[]) {
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
    if (needsPageBreak(y, needed)) { doc.addPage(); y = PDF_LAYOUT.topMargin; }
  }

  const reference = values.ref_audit || "Ref. non definie";

  // ─── Cover page ──────────────────────────────────────────
  let y = drawCoverPage(
    doc,
    "Audit energetique",
    "Diagnostic complet et scenarios de renovation",
    [
      ["Reference", reference],
      ["Beneficiaire", values.client_nom || "—"],
      ["Adresse", values.adresse || "—"],
      ["Date de visite", values.date_visite || "—"],
      ["Auditeur", values.redacteur || "—"],
      ["DPE actuel", values.dpe_actuel || "—"],
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
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); drawFooter(doc, "Audit energetique", reference, i, totalPages); }
  doc.save(`Audit_Energetique_${values.ref_audit || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Component ──────────────────────────────────────────────────

export default function AuditEnergetique({ onBack, onSaved, existingDoc }: Props) {
  const [activeSection, setActiveSection] = useState(0);
  const [values, setValues] = useState<FormValues>(() => {
    if (existingDoc?.donnees) { try { return JSON.parse(existingDoc.donnees); } catch { return {}; } }
    return {};
  });
  const [docId, setDocId] = useState<string | null>(existingDoc?.id ?? null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateValue(id: string, value: string) { setValues((prev) => ({ ...prev, [id]: value })); setSaved(false); }

  async function handleSave() {
    setSaving(true);
    try {
      const titre = values.ref_audit ? `Audit énergétique — ${values.client_nom || "Sans client"}` : "Audit énergétique (brouillon)";
      const reference = values.ref_audit || `AU-${Date.now().toString(36).toUpperCase()}`;
      const donnees = JSON.stringify(values);
      if (docId) {
        const res = await fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titre, clientNom: values.client_nom || null, donnees, statut: "EN_COURS" }) });
        if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); onSaved?.(); }
      } else {
        const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titre, reference, type: "AUDIT", statut: "EN_COURS", clientNom: values.client_nom || null, donnees }) });
        if (res.ok) { const created = await res.json(); setDocId(created.id); setSaved(true); setTimeout(() => setSaved(false), 2000); onSaved?.(); }
      }
    } catch { /* silently fail */ } finally { setSaving(false); }
  }

  const handleAddPhotos = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => { setPhotos((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file, preview: reader.result as string, legende: "", categorie: "Autre" }]); };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, []);

  async function handleGeneratePDF() {
    setGenerating(true);
    try {
      await generatePDF(SECTIONS, values, photos);
      if (docId) { await fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: "TERMINE" }) }); onSaved?.(); }
      else { await handleSave(); }
    } finally { setGenerating(false); }
  }

  const currentSection = showPhotos ? null : SECTIONS[activeSection];
  const allRequired = SECTIONS.flatMap((s) => s.fields.filter((f) => f.required));
  const filledRequired = allRequired.filter((f) => values[f.id]?.trim());
  const completionPct = allRequired.length > 0 ? Math.round((filledRequired.length / allRequired.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Retour</Button>
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300"><FileText className="h-5 w-5" /></div>
          <div>
            <h2 className="text-lg font-semibold">Audit énergétique</h2>
            <p className="text-sm text-muted-foreground">{completionPct}% complété — {filledRequired.length}/{allRequired.length} champs obligatoires{photos.length > 0 && ` — ${photos.length} photo${photos.length > 1 ? "s" : ""}`}</p>
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

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-1">
          {SECTIONS.map((section, i) => {
            const sf = section.fields.filter((f) => f.required);
            const filled = sf.filter((f) => values[f.id]?.trim());
            const complete = sf.length > 0 && filled.length === sf.length;
            return (
              <button key={i} onClick={() => { setActiveSection(i); setShowPhotos(false); }}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  !showPhotos && activeSection === i ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : filled.length > 0 ? <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" /> : <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">{i + 1}</span>}
                <span className="truncate">{section.titre}</span>
              </button>
            );
          })}
          <button onClick={() => setShowPhotos(true)} className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors mt-2 border-t pt-3", showPhotos ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Camera className="h-4 w-4 shrink-0" /><span className="truncate">Photos</span>
            {photos.length > 0 && <Badge variant="outline" className="ml-auto text-[10px]">{photos.length}</Badge>}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {showPhotos ? (
            <motion.div key="photos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Camera className="h-4 w-4" />Photos de l&apos;audit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5">
                    <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium">Ajouter des photos</p>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
                  </div>
                  {photos.length > 0 && <div className="space-y-4">
                    {photos.map((photo, i) => (
                      <div key={photo.id} className="flex gap-4 rounded-lg border p-3">
                        <div className="relative w-32 h-24 shrink-0 rounded-md overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.preview} alt={photo.legende || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                          <button onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white shadow-sm"><X className="h-3 w-3" /></button>
                        </div>
                        <div className="flex-1 space-y-2">
                          <span className="text-xs font-medium text-muted-foreground">Photo {i + 1}</span>
                          <select value={photo.categorie} onChange={(e) => setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, categorie: e.target.value } : p))} className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none">
                            {PHOTO_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <input type="text" value={photo.legende} onChange={(e) => setPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, legende: e.target.value } : p))} placeholder="Légende..." className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>}
                </CardContent>
              </Card>
            </motion.div>
          ) : currentSection ? (
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
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
                          {field.label}{field.required && <span className="text-destructive">*</span>}
                          {field.unit && <span className="text-xs text-muted-foreground font-normal">({field.unit})</span>}
                        </label>
                        {field.type === "select" ? (
                          <select value={values[field.id] || ""} onChange={(e) => updateValue(field.id, e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none">
                            <option value="">— Sélectionner —</option>
                            {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : field.type === "textarea" ? (
                          <textarea value={values[field.id] || ""} onChange={(e) => updateValue(field.id, e.target.value)} rows={5} placeholder={field.placeholder} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none" />
                        ) : (
                          <input type={field.type} value={values[field.id] || ""} onChange={(e) => updateValue(field.id, e.target.value)} placeholder={field.placeholder} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                        )}
                        {field.help && <p className="text-[11px] text-muted-foreground leading-snug">{field.help}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setActiveSection(Math.max(0, activeSection - 1))} disabled={activeSection === 0}>&larr; Précédent</Button>
                    {activeSection < SECTIONS.length - 1 ? (
                      <Button size="sm" onClick={() => setActiveSection(activeSection + 1)}>Suivant &rarr;</Button>
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
