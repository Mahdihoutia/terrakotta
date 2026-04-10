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
  Calculator,
  Plus,
  Trash2,
  Loader2,
  Camera,
  X,
  ImagePlus,
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

interface LigneDevis {
  id: string;
  designation: string;
  unite: string;
  quantite: string;
  prixUnitaire: string;
  tva: string;
}

// ─── Catégories de photos ───────────────────────────────────────

const PHOTO_CATEGORIES = [
  "Site / Chantier",
  "État existant",
  "Équipements à remplacer",
  "Matériaux proposés",
  "Plans / Croquis",
  "Autre",
];

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

// ─── Questionnaire sections ─────────────────────────────────────

const SECTIONS: QuestionSection[] = [
  {
    titre: "1. Coordonnées de l'entreprise",
    description: "Informations du bureau d'étude émetteur du devis",
    fields: [
      { id: "entreprise_nom", label: "Raison sociale", type: "text", placeholder: "TERRAKOTTA", required: true },
      { id: "entreprise_siret", label: "SIRET", type: "text", placeholder: "XXX XXX XXX XXXXX" },
      { id: "entreprise_adresse", label: "Adresse", type: "text", placeholder: "Adresse complète", colSpan: 2 },
      { id: "entreprise_telephone", label: "Téléphone", type: "text", placeholder: "06 XX XX XX XX" },
      { id: "entreprise_email", label: "Email", type: "text", placeholder: "contact@terrakotta.fr" },
      { id: "entreprise_rge", label: "Qualification RGE", type: "text", placeholder: "N° de qualification" },
    ],
  },
  {
    titre: "2. Coordonnées du client",
    description: "Identification du bénéficiaire des travaux",
    fields: [
      { id: "client_nom", label: "Nom / Raison sociale", type: "text", placeholder: "Nom complet", required: true },
      {
        id: "client_type", label: "Type de client", type: "select", required: true,
        options: ["Particulier", "Professionnel", "Collectivité", "Copropriété"],
      },
      { id: "client_adresse", label: "Adresse", type: "text", placeholder: "Adresse complète", colSpan: 2 },
      { id: "client_telephone", label: "Téléphone", type: "text", placeholder: "06 XX XX XX XX" },
      { id: "client_email", label: "Email", type: "text", placeholder: "email@exemple.fr" },
    ],
  },
  {
    titre: "3. Informations du devis",
    description: "Référence, dates et conditions du devis",
    fields: [
      { id: "ref_devis", label: "Référence du devis", type: "text", placeholder: "Ex: DV-2026-XXX", required: true },
      { id: "date_emission", label: "Date d'émission", type: "date", required: true },
      { id: "date_validite", label: "Date de validité", type: "date" },
      { id: "objet", label: "Objet du devis", type: "text", placeholder: "Ex: Travaux de rénovation énergétique", required: true, colSpan: 2 },
      { id: "adresse_chantier", label: "Adresse du chantier", type: "text", placeholder: "Si différente de l'adresse client", colSpan: 2 },
      {
        id: "delai_execution", label: "Délai d'exécution", type: "text",
        placeholder: "Ex: 3 semaines à compter de l'acceptation du devis",
      },
    ],
  },
  {
    titre: "4. Conditions et mentions légales",
    description: "Modalités de paiement, garanties et mentions obligatoires",
    fields: [
      {
        id: "modalite_paiement", label: "Modalités de paiement", type: "select",
        options: [
          "30% à la commande, 70% à la réception",
          "50% à la commande, 50% à la réception",
          "100% à la réception des travaux",
          "30% à la commande, 40% en cours de travaux, 30% à la réception",
          "Autre (préciser dans observations)",
        ],
      },
      {
        id: "garantie", label: "Garantie", type: "select",
        options: [
          "Garantie décennale",
          "Garantie décennale + biennale",
          "Garantie constructeur (matériel)",
          "Selon conditions générales de vente",
        ],
      },
      { id: "assurance_rc", label: "Assurance RC Pro", type: "text", placeholder: "N° de police et assureur" },
      {
        id: "tva_applicable", label: "TVA applicable", type: "select",
        options: ["5,5% (travaux de rénovation énergétique)", "10% (travaux d'amélioration)", "20% (taux normal)"],
      },
      {
        id: "observations", label: "Observations / Conditions particulières", type: "textarea",
        placeholder: "Conditions spécifiques, exclusions, remarques...",
        colSpan: 2,
      },
    ],
  },
  {
    titre: "5. Aides financières mobilisables",
    description: "Informations sur les aides et subventions applicables",
    fields: [
      {
        id: "maprimereno", label: "MaPrimeRénov'", type: "select",
        options: ["Non applicable", "Bleu (très modestes)", "Jaune (modestes)", "Violet (intermédiaires)", "Rose (supérieurs)", "À déterminer"],
      },
      { id: "maprimereno_montant", label: "Montant estimé MaPrimeRénov'", type: "number", placeholder: "0", unit: "€" },
      { id: "cee_montant", label: "Prime CEE estimée", type: "number", placeholder: "0", unit: "€" },
      { id: "autres_aides", label: "Autres aides (collectivités, ANAH...)", type: "text", placeholder: "Préciser les aides complémentaires", colSpan: 2 },
      { id: "reste_a_charge", label: "Reste à charge estimé", type: "number", placeholder: "0", unit: "€" },
      {
        id: "notes_aides", label: "Notes sur les aides", type: "textarea",
        placeholder: "Précisions sur les conditions d'éligibilité, démarches à effectuer...",
        colSpan: 2,
      },
    ],
  },
];

// ─── PDF Generation ─────────────────────────────────────────────

async function generatePDF(
  sections: QuestionSection[],
  values: FormValues,
  lignes: LigneDevis[],
  sectionPhotos: Record<number, PhotoItem[]>,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const {
    drawCoverPage,
    drawSectionHeader,
    drawFooter,
    drawSignatureBlock,
    drawPhotoEntry,
    getDevisTableConfig,
    getTotalsTableConfig,
    getDataTableConfig,
    needsPageBreak,
    PDF_LAYOUT,
    PDF_COLORS,
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

  const reference = values.ref_devis || "Ref. non definie";

  // ─── Cover page ──────────────────────────────────────────
  let y = drawCoverPage(
    doc,
    "Devis",
    values.objet || "Travaux de renovation energetique",
    [
      ["Reference", reference],
      ["Client", values.client_nom || "—"],
      ["Adresse chantier", values.adresse_chantier || values.client_adresse || "—"],
      ["Date d'emission", values.date_emission || "—"],
      ["Date de validite", values.date_validite || "—"],
      ["Delai d'execution", values.delai_execution || "—"],
    ],
    reference,
  );

  // ─── Ligne items table ────────────────────────────────────
  checkPage(40);
  y = drawSectionHeader(doc, "Designation des travaux", y);

  const lignesData = lignes.map((l) => {
    const qty = parseFloat(l.quantite) || 0;
    const prix = parseFloat(l.prixUnitaire) || 0;
    const totalHT = qty * prix;
    return [
      l.designation || "—",
      l.unite || "—",
      qty.toFixed(2),
      `${prix.toFixed(2)} \u20AC`,
      `${totalHT.toFixed(2)} \u20AC`,
    ];
  });

  // Totals calculation
  const totalHT = lignes.reduce((sum, l) => {
    return sum + (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaire) || 0);
  }, 0);

  const tvaRate = values.tva_applicable?.includes("5,5") ? 5.5
    : values.tva_applicable?.includes("10%") ? 10
    : 20;
  const totalTVA = totalHT * (tvaRate / 100);
  const totalTTC = totalHT + totalTVA;

  autoTable(doc, getDevisTableConfig(
    y,
    [["Designation", "Unite", "Quantite", "P.U. HT", "Total HT"]],
    lignesData,
  ));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;

  // Totals box
  autoTable(doc, getTotalsTableConfig(
    y,
    [
      ["Total HT", `${totalHT.toFixed(2)} \u20AC`],
      [`TVA (${tvaRate}%)`, `${totalTVA.toFixed(2)} \u20AC`],
      ["Total TTC", `${totalTTC.toFixed(2)} \u20AC`],
    ],
    contentWidth,
    true,
  ));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + PDF_LAYOUT.sectionGap;

  // ─── Aides section ────────────────────────────────────────
  const aidesData: string[][] = [];
  if (values.maprimereno && values.maprimereno !== "Non applicable") {
    aidesData.push(["MaPrimeRenov'", `${values.maprimereno}${values.maprimereno_montant ? ` — ${values.maprimereno_montant} \u20AC` : ""}`]);
  }
  if (values.cee_montant && parseFloat(values.cee_montant) > 0) {
    aidesData.push(["Prime CEE", `${values.cee_montant} \u20AC`]);
  }
  if (values.autres_aides) {
    aidesData.push(["Autres aides", values.autres_aides]);
  }
  if (values.reste_a_charge && parseFloat(values.reste_a_charge) > 0) {
    aidesData.push(["Reste a charge estime", `${values.reste_a_charge} \u20AC`]);
  }

  if (aidesData.length > 0) {
    checkPage(30);
    y = drawSectionHeader(doc, "Aides financieres mobilisables", y);
    autoTable(doc, getDataTableConfig(y, aidesData, contentWidth));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + PDF_LAYOUT.sectionGap;
  }

  // ─── Photos des premières sections (entreprise, client, devis) ─
  for (let sIdx = 0; sIdx < 3; sIdx++) {
    const photos = sectionPhotos[sIdx] || [];
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        checkPage(85);
        y = drawPhotoEntry(doc, i, photos[i].preview, photos[i].categorie, photos[i].legende, y);
      }
      y += PDF_LAYOUT.sectionGap;
    }
  }

  // ─── Remaining sections (conditions, aides) with photos ───
  for (let sIdx = 3; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx];
    const tableData: string[][] = [];
    for (const field of section.fields) {
      const val = values[field.id] || "—";
      if (val !== "—") {
        const label = field.unit ? `${field.label} (${field.unit})` : field.label;
        tableData.push([label, val]);
      }
    }

    if (tableData.length === 0 && !(sectionPhotos[sIdx]?.length > 0)) continue;

    checkPage(30);
    y = drawSectionHeader(doc, section.titre, y);

    if (tableData.length > 0) {
      autoTable(doc, {
        startY: y,
        body: tableData,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
          overflow: "linebreak",
          textColor: PDF_COLORS.body,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 65, textColor: PDF_COLORS.heading },
          1: { cellWidth: contentWidth - 65 },
        },
        alternateRowStyles: { fillColor: PDF_COLORS.background },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Photos de cette section
    const photos = sectionPhotos[sIdx] || [];
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        checkPage(85);
        y = drawPhotoEntry(doc, i, photos[i].preview, photos[i].categorie, photos[i].legende, y);
      }
    }

    y += PDF_LAYOUT.sectionGap - 6;
  }

  // ─── Signature ────────────────────────────────────────────
  checkPage(50);
  drawSignatureBlock(doc, y);

  // ─── Footers ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Devis", reference, i, totalPages);
  }

  const filename = `Devis_${values.ref_devis || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ─── Component ──────────────────────────────────────────────────

export default function DevisDocument({ onBack, onSaved, existingDoc }: Props) {
  const [activeSection, setActiveSection] = useState(0);
  const [values, setValues] = useState<FormValues>(() => {
    if (existingDoc?.donnees) {
      try {
        const parsed = JSON.parse(existingDoc.donnees);
        delete parsed._lignes;
        delete parsed._sectionPhotos;
        return parsed;
      } catch { return {}; }
    }
    return {};
  });
  const [lignes, setLignes] = useState<LigneDevis[]>(() => {
    if (existingDoc?.donnees) {
      try {
        const parsed = JSON.parse(existingDoc.donnees);
        if (parsed._lignes) return parsed._lignes;
      } catch { /* ignore */ }
    }
    return [createLigne()];
  });
  const [docId, setDocId] = useState<string | null>(existingDoc?.id ?? null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showLignes, setShowLignes] = useState(false);
  const [sectionPhotos, setSectionPhotos] = useState<Record<number, PhotoItem[]>>(() => {
    if (existingDoc?.donnees) {
      try {
        const parsed = JSON.parse(existingDoc.donnees);
        if (parsed._sectionPhotos) {
          const restored: Record<number, PhotoItem[]> = {};
          for (const [key, photos] of Object.entries(parsed._sectionPhotos)) {
            restored[Number(key)] = (photos as Array<{ id: string; preview: string; legende: string; categorie: string }>).map((p) => ({
              id: p.id, file: new File([], "restored"), preview: p.preview, legende: p.legende, categorie: p.categorie,
            }));
          }
          return restored;
        }
      } catch { /* ignore */ }
    }
    return {};
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function createLigne(): LigneDevis {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      designation: "",
      unite: "forfait",
      quantite: "1",
      prixUnitaire: "",
      tva: "5.5",
    };
  }

  function updateValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  function addLigne() {
    setLignes((prev) => [...prev, createLigne()]);
  }

  function removeLigne(id: string) {
    setLignes((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLigne(id: string, field: keyof LigneDevis, value: string) {
    setLignes((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
    setSaved(false);
  }

  const handleAddPhotos = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const sectionIdx = activeSection;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setSectionPhotos((prev) => ({
          ...prev,
          [sectionIdx]: [
            ...(prev[sectionIdx] || []),
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              file,
              preview: reader.result as string,
              legende: "",
              categorie: PHOTO_CATEGORIES[0],
            },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, [activeSection]);

  // ─── Totals ─────────────────────────────────────────────────
  const totalHT = lignes.reduce((sum, l) => {
    return sum + (parseFloat(l.quantite) || 0) * (parseFloat(l.prixUnitaire) || 0);
  }, 0);

  const tvaRate = values.tva_applicable?.includes("5,5") ? 5.5
    : values.tva_applicable?.includes("10%") ? 10
    : 20;
  const totalTVA = totalHT * (tvaRate / 100);
  const totalTTC = totalHT + totalTVA;

  // ─── Save ───────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const titre = values.objet
        ? `Devis — ${values.client_nom || "Sans client"}`
        : "Devis (brouillon)";
      const reference = values.ref_devis || `DV-${Date.now().toString(36).toUpperCase()}`;
      const photosToSave: Record<number, Array<{ id: string; preview: string; legende: string; categorie: string }>> = {};
      for (const [key, photos] of Object.entries(sectionPhotos)) {
        if (photos.length > 0) {
          photosToSave[Number(key)] = photos.map((p) => ({ id: p.id, preview: p.preview, legende: p.legende, categorie: p.categorie }));
        }
      }
      const donnees = JSON.stringify({ ...values, _lignes: lignes, _sectionPhotos: Object.keys(photosToSave).length > 0 ? photosToSave : undefined });

      if (docId) {
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
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titre,
            reference,
            type: "DEVIS",
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

  async function handleGeneratePDF() {
    setGenerating(true);
    try {
      await generatePDF(SECTIONS, values, lignes, sectionPhotos);
      if (docId) {
        await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: "TERMINE" }),
        });
        onSaved?.();
      } else {
        await handleSave();
      }
    } finally {
      setGenerating(false);
    }
  }

  const currentSection = showLignes ? null : SECTIONS[activeSection];
  const totalPhotos = Object.values(sectionPhotos).reduce((sum, arr) => sum + arr.length, 0);

  const filledFieldsCount = SECTIONS.reduce((count, section) => {
    return count + section.fields.filter((f) => values[f.id]?.trim()).length;
  }, 0);
  const totalFieldsCount = SECTIONS.reduce((count, s) => count + s.fields.length, 0);
  const progress = Math.round((filledFieldsCount / totalFieldsCount) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-700">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {existingDoc ? "Modifier le devis" : "Nouveau devis"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {filledFieldsCount}/{totalFieldsCount} champs remplis · {progress}%{totalPhotos > 0 && ` · ${totalPhotos} photo${totalPhotos > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-emerald-600 text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Sauvegardé
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
            Sauvegarder
          </Button>
          <Button size="sm" onClick={handleGeneratePDF} disabled={generating}>
            {generating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Calculator className="mr-1 h-3.5 w-3.5" />}
            Générer PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar nav */}
        <div className="col-span-3 space-y-1">
          {SECTIONS.map((section, idx) => {
            const sectionFilled = section.fields.filter((f) => values[f.id]?.trim()).length;
            const sectionTotal = section.fields.length;
            const isComplete = sectionFilled === sectionTotal;
            const isActive = !showLignes && activeSection === idx;
            const sectionPhotoCount = (sectionPhotos[idx] || []).length;

            return (
              <button
                key={idx}
                onClick={() => { setActiveSection(idx); setShowLignes(false); }}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-900 font-medium"
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : sectionFilled > 0 ? (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                <span className="truncate">{section.titre}</span>
                {sectionPhotoCount > 0 ? (
                  <Badge variant="outline" className="ml-auto text-[10px] gap-1">
                    <Camera className="h-3 w-3" />{sectionPhotoCount}
                  </Badge>
                ) : (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50" />
                )}
              </button>
            );
          })}

          {/* Lignes de devis button */}
          <button
            onClick={() => setShowLignes(true)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              showLignes
                ? "bg-emerald-50 text-emerald-900 font-medium"
                : "hover:bg-muted/50 text-muted-foreground"
            )}
          >
            <Calculator className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Postes de travaux</span>
            <Badge variant="outline" className="ml-auto text-[10px]">{lignes.length}</Badge>
          </button>

          {/* Totals */}
          <div className="mt-4 rounded-lg border p-3 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Total HT</span>
              <span className="font-mono">{totalHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>TVA ({tvaRate}%)</span>
              <span className="font-mono">{totalTVA.toFixed(2)} €</span>
            </div>
            <div className="border-t pt-1.5 flex justify-between text-sm font-semibold">
              <span>Total TTC</span>
              <span className="font-mono text-emerald-700">{totalTTC.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-9">
          <AnimatePresence mode="wait">
            {showLignes ? (
              <motion.div
                key="lignes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Postes de travaux</CardTitle>
                      <Button variant="outline" size="sm" onClick={addLigne}>
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Ajouter un poste
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lignes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calculator className="h-8 w-8 text-muted-foreground/30" />
                        <p className="mt-3 text-sm text-muted-foreground">Aucun poste de travaux</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={addLigne}>
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Ajouter un poste
                        </Button>
                      </div>
                    ) : (
                      lignes.map((ligne, idx) => {
                        const ligneTotal = (parseFloat(ligne.quantite) || 0) * (parseFloat(ligne.prixUnitaire) || 0);
                        return (
                          <div key={ligne.id} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Poste {idx + 1}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-semibold">{ligneTotal.toFixed(2)} € HT</span>
                                {lignes.length > 1 && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeLigne(ligne.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Désignation</label>
                                <textarea
                                  value={ligne.designation}
                                  onChange={(e) => updateLigne(ligne.id, "designation", e.target.value)}
                                  placeholder="Description du poste de travaux (ex: Isolation des combles perdus par soufflage de laine de roche — 30 cm — R=7)"
                                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Unité</label>
                                <select
                                  value={ligne.unite}
                                  onChange={(e) => updateLigne(ligne.id, "unite", e.target.value)}
                                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                  <option value="forfait">Forfait</option>
                                  <option value="m²">m²</option>
                                  <option value="ml">ml</option>
                                  <option value="m³">m³</option>
                                  <option value="unité">Unité</option>
                                  <option value="h">Heure</option>
                                  <option value="jour">Jour</option>
                                  <option value="lot">Lot</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Quantité</label>
                                <input
                                  type="number"
                                  value={ligne.quantite}
                                  onChange={(e) => updateLigne(ligne.id, "quantite", e.target.value)}
                                  placeholder="1"
                                  min="0"
                                  step="0.01"
                                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix unitaire HT (€)</label>
                                <input
                                  type="number"
                                  value={ligne.prixUnitaire}
                                  onChange={(e) => updateLigne(ligne.id, "prixUnitaire", e.target.value)}
                                  placeholder="0.00"
                                  min="0"
                                  step="0.01"
                                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : currentSection ? (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{currentSection.titre}</CardTitle>
                    {currentSection.description && (
                      <p className="text-xs text-muted-foreground">{currentSection.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {currentSection.fields.map((field) => (
                        <div key={field.id} className={field.colSpan === 2 ? "col-span-2" : ""}>
                          <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                            {field.unit && (
                              <span className="text-xs text-muted-foreground font-normal">({field.unit})</span>
                            )}
                          </label>
                          {field.type === "select" ? (
                            <select
                              value={values[field.id] || ""}
                              onChange={(e) => updateValue(field.id, e.target.value)}
                              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                              placeholder={field.placeholder}
                              className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                          ) : (
                            <input
                              type={field.type}
                              value={values[field.id] || ""}
                              onChange={(e) => updateValue(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                          )}
                          {field.help && (
                            <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Photos de cette étape */}
                    <div className="border-t pt-4 mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Photos — {currentSection.titre}
                        </h4>
                        {(sectionPhotos[activeSection] || []).length > 0 && (
                          <Badge variant="outline" className="text-[10px]">{(sectionPhotos[activeSection] || []).length} photo{(sectionPhotos[activeSection] || []).length > 1 ? "s" : ""}</Badge>
                        )}
                      </div>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-5 cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                        <div className="text-center">
                          <p className="text-xs font-medium">Ajouter des photos</p>
                          <p className="text-[10px] text-muted-foreground">JPG, PNG — Cliquez ou glissez-déposez</p>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
                      </div>

                      {(sectionPhotos[activeSection] || []).length > 0 && (
                        <div className="space-y-3">
                          {(sectionPhotos[activeSection] || []).map((photo, i) => (
                            <div key={photo.id} className="flex gap-3 rounded-lg border p-2.5">
                              <div className="relative w-28 h-20 shrink-0 rounded-md overflow-hidden bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.preview} alt={photo.legende || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                                <button onClick={() => setSectionPhotos((prev) => ({ ...prev, [activeSection]: (prev[activeSection] || []).filter((p) => p.id !== photo.id) }))} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white shadow-sm">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <span className="text-xs font-medium text-muted-foreground">Photo {i + 1}</span>
                                <select
                                  value={photo.categorie}
                                  onChange={(e) => setSectionPhotos((prev) => ({ ...prev, [activeSection]: (prev[activeSection] || []).map((p) => p.id === photo.id ? { ...p, categorie: e.target.value } : p) }))}
                                  className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                  {PHOTO_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <input
                                  type="text"
                                  value={photo.legende}
                                  onChange={(e) => setSectionPhotos((prev) => ({ ...prev, [activeSection]: (prev[activeSection] || []).map((p) => p.id === photo.id ? { ...p, legende: e.target.value } : p) }))}
                                  placeholder="Légende de la photo..."
                                  className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeSection === 0}
                    onClick={() => setActiveSection((s) => s - 1)}
                  >
                    ← Précédent
                  </Button>
                  {activeSection < SECTIONS.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={() => setActiveSection((s) => s + 1)}
                    >
                      Suivant →
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleGeneratePDF} disabled={generating}>
                      {generating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Calculator className="mr-1 h-3.5 w-3.5" />}
                      Générer le PDF
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
