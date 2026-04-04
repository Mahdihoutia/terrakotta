"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Download,
  Save,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

type FicheId = "BAT-TH-134" | "BAT-TH-163";

interface FicheConfig {
  id: FicheId;
  titre: string;
  sousTitre: string;
  description: string;
  secteur: string;
}

interface FormValues {
  [key: string]: string;
}

// ─── Fiches CEE ─────────────────────────────────────────────────

const FICHES: FicheConfig[] = [
  {
    id: "BAT-TH-134",
    titre: "BAT-TH-134",
    sousTitre: "Pompe à chaleur haute performance à usage flottant",
    description:
      "Mise en place d'une PAC électrique haute performance air/eau ou eau/eau pour la production de chaleur à usage de chauffage et/ou d'ECS en bâtiment tertiaire.",
    secteur: "Tertiaire",
  },
  {
    id: "BAT-TH-163",
    titre: "BAT-TH-163",
    sousTitre: "Pompe à chaleur de type air/eau",
    description:
      "Mise en place d'une pompe à chaleur de type air/eau pour le chauffage des locaux en bâtiment tertiaire existant.",
    secteur: "Tertiaire",
  },
];

// ─── Sections de questionnaire ──────────────────────────────────

interface QuestionField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date";
  placeholder?: string;
  unit?: string;
  options?: string[];
  required?: boolean;
  help?: string;
  colSpan?: 1 | 2 | 3;
}

interface QuestionSection {
  titre: string;
  description?: string;
  fields: QuestionField[];
}

const QUESTIONNAIRE_134: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du bâtiment et du demandeur",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite", type: "date", required: true },
      { id: "client_nom", label: "Nom du client / Maître d'ouvrage", type: "text", placeholder: "Raison sociale ou nom", required: true },
      { id: "adresse", label: "Adresse du site", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
    ],
  },
  {
    titre: "2. Caractéristiques du bâtiment",
    description: "Description du bâtiment tertiaire existant",
    fields: [
      {
        id: "type_batiment",
        label: "Type de bâtiment",
        type: "select",
        options: [
          "Bureau",
          "Commerce",
          "Enseignement",
          "Santé / Hôpital",
          "Hôtellerie / Restauration",
          "Sport / Loisirs",
          "Entrepôt / Logistique",
          "Autre tertiaire",
        ],
        required: true,
      },
      { id: "surface_chauffee", label: "Surface chauffée", type: "number", placeholder: "Ex: 2500", unit: "m²", required: true },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1985" },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
      { id: "altitude", label: "Altitude", type: "number", placeholder: "Ex: 150", unit: "m" },
      { id: "temp_base", label: "Température extérieure de base", type: "number", placeholder: "Ex: -7", unit: "°C", required: true },
    ],
  },
  {
    titre: "3. Installation existante (à remplacer)",
    description: "Équipement de chauffage actuel avant travaux",
    fields: [
      {
        id: "energie_existante",
        label: "Énergie de chauffage existante",
        type: "select",
        options: ["Gaz naturel", "Fioul domestique", "Charbon", "Électricité (effet Joule)", "GPL", "Réseau de chaleur", "Autre"],
        required: true,
      },
      {
        id: "type_generateur_existant",
        label: "Type de générateur existant",
        type: "select",
        options: ["Chaudière standard", "Chaudière basse température", "Chaudière condensation", "Convecteurs électriques", "Radiateurs électriques", "CTA avec batterie électrique", "Autre"],
        required: true,
      },
      { id: "puissance_existante", label: "Puissance installée existante", type: "number", placeholder: "Ex: 350", unit: "kW" },
      { id: "annee_installation_existante", label: "Année d'installation", type: "number", placeholder: "Ex: 2000" },
      {
        id: "emission_existante",
        label: "Type d'émetteurs existants",
        type: "select",
        options: ["Radiateurs", "Plancher chauffant", "Ventilo-convecteurs", "CTA (Centrale de Traitement d'Air)", "Plafond rayonnant", "Autre"],
      },
    ],
  },
  {
    titre: "4. PAC projetée — Caractéristiques techniques",
    description: "Données de la pompe à chaleur haute performance à installer",
    fields: [
      {
        id: "type_pac",
        label: "Type de PAC",
        type: "select",
        options: ["Air / Eau", "Eau glycolée / Eau (géothermie)", "Eau / Eau (nappe)"],
        required: true,
      },
      { id: "marque_pac", label: "Marque", type: "text", placeholder: "Ex: Daikin, Mitsubishi...", required: true },
      { id: "modele_pac", label: "Modèle / Référence", type: "text", placeholder: "Référence constructeur", required: true },
      { id: "puissance_thermique", label: "Puissance thermique nominale", type: "number", placeholder: "Ex: 280", unit: "kW", required: true },
      { id: "cop_nominal", label: "COP nominal", type: "number", placeholder: "Ex: 3.8", required: true, help: "À conditions nominales constructeur" },
      {
        id: "etas",
        label: "Efficacité énergétique saisonnière (ηs)",
        type: "number",
        placeholder: "Ex: 126",
        unit: "%",
        required: true,
        help: "Selon règlement EU 813/2013. Doit être ≥ 111% pour application moyenne température",
      },
      {
        id: "regime_temperature",
        label: "Régime de température",
        type: "select",
        options: [
          "Basse température (≤ 35°C)",
          "Moyenne température (35–55°C)",
          "Haute température (> 55°C)",
        ],
        required: true,
      },
      { id: "temp_depart_eau", label: "Température de départ d'eau", type: "number", placeholder: "Ex: 45", unit: "°C", required: true },
      { id: "temp_retour_eau", label: "Température de retour d'eau", type: "number", placeholder: "Ex: 40", unit: "°C" },
      {
        id: "fluide_frigorigene",
        label: "Fluide frigorigène",
        type: "select",
        options: ["R-32", "R-410A", "R-290 (propane)", "R-454B", "R-513A", "R-1234ze", "Autre"],
        required: true,
      },
      { id: "charge_fluide", label: "Charge en fluide frigorigène", type: "number", placeholder: "Ex: 12.5", unit: "kg" },
      {
        id: "usage_pac",
        label: "Usage de la PAC",
        type: "select",
        options: ["Chauffage seul", "Chauffage + ECS", "Chauffage + ECS + Rafraîchissement"],
        required: true,
      },
    ],
  },
  {
    titre: "5. Régulation et hydraulique",
    fields: [
      {
        id: "regulateur_classe",
        label: "Classe du régulateur",
        type: "select",
        options: ["Classe IV", "Classe V", "Classe VI", "Classe VII", "Classe VIII"],
        required: true,
        help: "Minimum classe IV exigé par la fiche CEE",
      },
      { id: "marque_regulateur", label: "Marque / modèle du régulateur", type: "text", placeholder: "Ex: Siemens RWD..." },
      {
        id: "loi_eau",
        label: "Loi d'eau / Courbe de chauffe",
        type: "select",
        options: ["Oui — programmée", "Oui — à programmer", "Non"],
        required: true,
      },
      {
        id: "ballon_tampon",
        label: "Ballon tampon / Ballon d'inertie",
        type: "select",
        options: ["Oui", "Non"],
      },
      { id: "volume_tampon", label: "Volume ballon tampon", type: "number", placeholder: "Ex: 500", unit: "L" },
      {
        id: "type_pompe_distribution",
        label: "Pompe de distribution",
        type: "select",
        options: ["Vitesse variable (EEI ≤ 0.23)", "Vitesse fixe", "Non applicable"],
      },
    ],
  },
  {
    titre: "6. Dimensionnement et résultats",
    description: "Calculs et résultats de dimensionnement",
    fields: [
      { id: "deperditions_totales", label: "Déperditions totales du bâtiment", type: "number", placeholder: "Ex: 250", unit: "kW", required: true },
      { id: "besoin_chauffage", label: "Besoins annuels de chauffage", type: "number", placeholder: "Ex: 450", unit: "MWh/an" },
      { id: "taux_couverture", label: "Taux de couverture PAC", type: "number", placeholder: "Ex: 85", unit: "%", help: "Part des besoins couverts par la PAC" },
      { id: "appoint", label: "Appoint prévu", type: "select", options: ["Aucun (PAC seule)", "Chaudière gaz condensation", "Résistance électrique intégrée", "Autre"], },
      { id: "puissance_appoint", label: "Puissance de l'appoint", type: "number", placeholder: "Ex: 80", unit: "kW" },
      {
        id: "gain_energetique",
        label: "Gain énergétique estimé",
        type: "number",
        placeholder: "Ex: 35",
        unit: "%",
        help: "Par rapport à l'installation existante",
      },
      {
        id: "observations",
        label: "Observations / Justifications complémentaires",
        type: "textarea",
        placeholder: "Hypothèses de calcul, contraintes particulières, justification du dimensionnement...",
        colSpan: 2,
      },
    ],
  },
];

const QUESTIONNAIRE_163: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du bâtiment et du demandeur",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite", type: "date", required: true },
      { id: "client_nom", label: "Nom du client / Maître d'ouvrage", type: "text", placeholder: "Raison sociale ou nom", required: true },
      { id: "adresse", label: "Adresse du site", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
    ],
  },
  {
    titre: "2. Caractéristiques du bâtiment",
    description: "Description du bâtiment tertiaire existant",
    fields: [
      {
        id: "type_batiment",
        label: "Type de bâtiment",
        type: "select",
        options: ["Bureau", "Commerce", "Enseignement", "Santé / Hôpital", "Hôtellerie / Restauration", "Sport / Loisirs", "Entrepôt / Logistique", "Autre tertiaire"],
        required: true,
      },
      { id: "surface_chauffee", label: "Surface chauffée", type: "number", placeholder: "Ex: 1200", unit: "m²", required: true },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1990" },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
      { id: "altitude", label: "Altitude", type: "number", placeholder: "Ex: 200", unit: "m" },
      { id: "temp_base", label: "Température extérieure de base", type: "number", placeholder: "Ex: -5", unit: "°C", required: true },
    ],
  },
  {
    titre: "3. Installation existante (à remplacer)",
    description: "Équipement de chauffage actuel avant travaux",
    fields: [
      {
        id: "energie_existante",
        label: "Énergie de chauffage existante",
        type: "select",
        options: ["Gaz naturel", "Fioul domestique", "Charbon", "Électricité (effet Joule)", "GPL", "Réseau de chaleur", "Autre"],
        required: true,
      },
      {
        id: "type_generateur_existant",
        label: "Type de générateur existant",
        type: "select",
        options: ["Chaudière standard", "Chaudière basse température", "Chaudière condensation", "Convecteurs électriques", "CTA avec batterie électrique", "PAC existante (à remplacer)", "Autre"],
        required: true,
      },
      { id: "puissance_existante", label: "Puissance installée existante", type: "number", placeholder: "Ex: 150", unit: "kW" },
      {
        id: "emission_existante",
        label: "Type d'émetteurs existants",
        type: "select",
        options: ["Radiateurs haute température", "Radiateurs basse température", "Plancher chauffant", "Ventilo-convecteurs", "CTA", "Autre"],
      },
      { id: "temp_regime_existant", label: "Régime de température existant", type: "text", placeholder: "Ex: 70/50°C", help: "Départ/Retour en °C" },
    ],
  },
  {
    titre: "4. PAC air/eau projetée — Caractéristiques techniques",
    description: "Données de la pompe à chaleur air/eau à installer (fiche BAT-TH-163)",
    fields: [
      { id: "marque_pac", label: "Marque", type: "text", placeholder: "Ex: Daikin, Atlantic...", required: true },
      { id: "modele_pac", label: "Modèle / Référence", type: "text", placeholder: "Référence constructeur", required: true },
      {
        id: "puissance_calo_7_35",
        label: "Puissance calorifique à A7/W35",
        type: "number",
        placeholder: "Ex: 120",
        unit: "kW",
        required: true,
        help: "Puissance à air 7°C / eau 35°C",
      },
      {
        id: "puissance_calo_7_45",
        label: "Puissance calorifique à A7/W45",
        type: "number",
        placeholder: "Ex: 110",
        unit: "kW",
        help: "Puissance à air 7°C / eau 45°C (si moyenne temp.)",
      },
      {
        id: "puissance_calo_base",
        label: "Puissance calorifique au point de base",
        type: "number",
        placeholder: "Ex: 85",
        unit: "kW",
        help: "À température extérieure de base",
      },
      {
        id: "cop_a7_w35",
        label: "COP à A7/W35",
        type: "number",
        placeholder: "Ex: 4.2",
        required: true,
      },
      {
        id: "cop_a7_w45",
        label: "COP à A7/W45",
        type: "number",
        placeholder: "Ex: 3.5",
      },
      {
        id: "etas",
        label: "Efficacité énergétique saisonnière (ηs)",
        type: "number",
        placeholder: "Ex: 130",
        unit: "%",
        required: true,
        help: "Selon règlement EU 813/2013. Exigence fiche : ηs ≥ 111% (moy. temp.) ou ≥ 126% (basse temp.)",
      },
      {
        id: "scop",
        label: "SCOP (EN 14825)",
        type: "number",
        placeholder: "Ex: 4.1",
        help: "Coefficient de performance saisonnier",
      },
      {
        id: "regime_temperature",
        label: "Application de température",
        type: "select",
        options: [
          "Basse température (départ ≤ 35°C) — ηs ≥ 126%",
          "Moyenne température (départ 35–55°C) — ηs ≥ 111%",
        ],
        required: true,
      },
      { id: "temp_depart_eau", label: "Température de départ d'eau de conception", type: "number", placeholder: "Ex: 45", unit: "°C", required: true },
      { id: "temp_retour_eau", label: "Température de retour d'eau", type: "number", placeholder: "Ex: 40", unit: "°C" },
      {
        id: "fluide_frigorigene",
        label: "Fluide frigorigène",
        type: "select",
        options: ["R-32", "R-410A", "R-290 (propane)", "R-454B", "R-1234ze", "Autre"],
        required: true,
      },
      { id: "charge_fluide", label: "Charge en fluide", type: "number", placeholder: "Ex: 8.5", unit: "kg" },
      {
        id: "niveau_sonore",
        label: "Niveau sonore (unité extérieure)",
        type: "number",
        placeholder: "Ex: 68",
        unit: "dB(A)",
      },
      {
        id: "nombre_unites",
        label: "Nombre d'unités extérieures",
        type: "number",
        placeholder: "Ex: 1",
      },
    ],
  },
  {
    titre: "5. Régulation",
    description: "Système de régulation et gestion hydraulique",
    fields: [
      {
        id: "regulateur_classe",
        label: "Classe du régulateur",
        type: "select",
        options: ["Classe IV", "Classe V", "Classe VI", "Classe VII", "Classe VIII"],
        required: true,
        help: "Minimum classe IV exigé par la fiche CEE BAT-TH-163",
      },
      { id: "marque_regulateur", label: "Marque / modèle du régulateur", type: "text", placeholder: "Ex: Siemens RWD..." },
      {
        id: "loi_eau",
        label: "Loi d'eau",
        type: "select",
        options: ["Oui — avec sonde extérieure", "Oui — avec sonde d'ambiance", "Oui — les deux", "Non"],
        required: true,
      },
      {
        id: "programmation_horaire",
        label: "Programmation horaire",
        type: "select",
        options: ["Oui — hebdomadaire", "Oui — journalière", "Non"],
      },
      {
        id: "gestion_cascade",
        label: "Gestion en cascade (si multi-PAC)",
        type: "select",
        options: ["Oui", "Non", "Non applicable (une seule PAC)"],
      },
    ],
  },
  {
    titre: "6. Dimensionnement et résultats",
    description: "Calculs thermiques et résultats",
    fields: [
      { id: "deperditions_totales", label: "Déperditions totales du bâtiment", type: "number", placeholder: "Ex: 130", unit: "kW", required: true },
      {
        id: "methode_calcul",
        label: "Méthode de calcul des déperditions",
        type: "select",
        options: ["RT existant (Th-C-E ex)", "NF EN 12831", "Calcul simplifié (G × V × ΔT)", "Simulation thermique dynamique (STD)"],
        required: true,
      },
      { id: "besoin_chauffage", label: "Besoins annuels de chauffage", type: "number", placeholder: "Ex: 185", unit: "MWh/an" },
      { id: "taux_couverture", label: "Taux de couverture PAC", type: "number", placeholder: "Ex: 90", unit: "%", help: "Part des besoins couverts par la PAC. Recommandé ≥ 80%" },
      {
        id: "appoint",
        label: "Appoint prévu",
        type: "select",
        options: ["Aucun (PAC seule — 100%)", "Chaudière gaz condensation", "Résistance électrique intégrée", "Autre"],
      },
      { id: "puissance_appoint", label: "Puissance de l'appoint", type: "number", placeholder: "Ex: 40", unit: "kW" },
      {
        id: "point_bivalence",
        label: "Température de bivalence",
        type: "number",
        placeholder: "Ex: -3",
        unit: "°C",
        help: "Température extérieure à laquelle l'appoint prend le relais",
      },
      {
        id: "gain_energetique",
        label: "Gain énergétique estimé",
        type: "number",
        placeholder: "Ex: 40",
        unit: "%",
      },
      {
        id: "economies_cee",
        label: "Économies CEE estimées",
        type: "number",
        placeholder: "Ex: 2500",
        unit: "MWh cumac",
      },
      {
        id: "observations",
        label: "Observations / Justifications complémentaires",
        type: "textarea",
        placeholder: "Contraintes d'implantation, justification du dimensionnement, hypothèses retenues, remarques sur la conformité...",
        colSpan: 2,
      },
    ],
  },
];

const QUESTIONNAIRES: Record<FicheId, QuestionSection[]> = {
  "BAT-TH-134": QUESTIONNAIRE_134,
  "BAT-TH-163": QUESTIONNAIRE_163,
};

// ─── Props ──────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

// ─── Component ──────────────────────────────────────────────────

export default function NoteDimensionnement({ onBack }: Props) {
  const [selectedFiche, setSelectedFiche] = useState<FicheId | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [values, setValues] = useState<FormValues>({});
  const [saved, setSaved] = useState(false);

  function updateValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // ─── Sélection de la fiche ────────────────────────────────

  if (!selectedFiche) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <div className="rounded-lg bg-violet-500/10 p-2 text-violet-700 dark:text-violet-300">
            <Ruler className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Note de dimensionnement</h2>
            <p className="text-sm text-muted-foreground">
              Sélectionnez la fiche CEE à remplir
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FICHES.map((fiche, i) => (
            <motion.div
              key={fiche.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => {
                  setSelectedFiche(fiche.id);
                  setActiveSection(0);
                  setValues({});
                }}
              >
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-mono">
                      {fiche.id}
                    </Badge>
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px]">
                      {fiche.secteur}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">{fiche.sousTitre}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {fiche.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium pt-1">
                    Commencer le questionnaire
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ─── Questionnaire ────────────────────────────────────────

  const fiche = FICHES.find((f) => f.id === selectedFiche)!;
  const sections = QUESTIONNAIRES[selectedFiche];
  const currentSection = sections[activeSection];

  // Calcul de la complétion
  const allRequired = sections.flatMap((s) => s.fields.filter((f) => f.required));
  const filledRequired = allRequired.filter((f) => values[f.id]?.trim());
  const completionPct = allRequired.length > 0 ? Math.round((filledRequired.length / allRequired.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedFiche(null)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {fiche.id}
              </Badge>
              <h2 className="text-lg font-semibold">{fiche.sousTitre}</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {completionPct}% complété — {filledRequired.length}/{allRequired.length} champs obligatoires
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            {saved ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> : <Save className="mr-2 h-4 w-4" />}
            {saved ? "Sauvegardé" : "Sauvegarder"}
          </Button>
          <Button size="sm" disabled={completionPct < 100}>
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${completionPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Navigation sections */}
        <div className="space-y-1">
          {sections.map((section, i) => {
            const sectionFields = section.fields.filter((f) => f.required);
            const sectionFilled = sectionFields.filter((f) => values[f.id]?.trim());
            const sectionComplete = sectionFields.length > 0 && sectionFilled.length === sectionFields.length;

            return (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  activeSection === i
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {sectionComplete ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : sectionFilled.length > 0 ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">
                    {i + 1}
                  </span>
                )}
                <span className="truncate">{section.titre}</span>
              </button>
            );
          })}
        </div>

        {/* Contenu de la section active */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{currentSection.titre}</CardTitle>
                {currentSection.description && (
                  <p className="text-sm text-muted-foreground">{currentSection.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {currentSection.fields.map((field) => (
                    <div
                      key={field.id}
                      className={cn("space-y-1.5", field.colSpan === 2 && "sm:col-span-2")}
                    >
                      <label className="text-sm font-medium flex items-center gap-1">
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                        {field.unit && (
                          <span className="text-xs text-muted-foreground font-normal">({field.unit})</span>
                        )}
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
                          rows={4}
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

                      {field.help && (
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          {field.help}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Navigation entre sections */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                    disabled={activeSection === 0}
                  >
                    ← Précédent
                  </Button>
                  {activeSection < sections.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={() => setActiveSection(activeSection + 1)}
                    >
                      Suivant →
                    </Button>
                  ) : (
                    <Button size="sm" disabled={completionPct < 100}>
                      <Download className="mr-2 h-4 w-4" />
                      Exporter PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
