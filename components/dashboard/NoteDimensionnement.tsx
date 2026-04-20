"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  Camera,
  X,
  ImagePlus,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

type FicheId = "BAT-TH-134" | "BAT-TH-163" | "BAT-TH-142" | "BAT-TH-139" | "BAR-TH-171" | "BAR-TH-159" | "BAR-EN-101" | "BAR-EN-102" | "BAR-EN-103" | "BAT-TH-116";

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

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  legende: string;
  categorie: string;
}

// ─── Fiches CEE ─────────────────────────────────────────────────

const FICHES: FicheConfig[] = [
  {
    id: "BAT-TH-134",
    titre: "BAT-TH-134",
    sousTitre: "Système de régulation sur un groupe de production de froid permettant d'avoir une haute pression flottante",
    description:
      "Mise en place d'un système de régulation sur un groupe de production de froid permettant d'avoir une haute pression flottante (France métropolitaine).",
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
  {
    id: "BAT-TH-142",
    titre: "BAT-TH-142",
    sousTitre: "Déstratification de l'air en bâtiment tertiaire",
    description:
      "Mise en place d'un système de déstratification d'air (déstratificateurs ou brasseurs) dans un bâtiment tertiaire existant avec une hauteur sous plafond ≥ 5 m.",
    secteur: "Tertiaire",
  },
  {
    id: "BAT-TH-139",
    titre: "BAT-TH-139",
    sousTitre: "Récupération de chaleur sur groupe de production de froid",
    description:
      "Mise en place d'un système de récupération de chaleur sur un groupe de production de froid pour le chauffage de l'eau ou le préchauffage de fluide en bâtiment tertiaire existant.",
    secteur: "Tertiaire",
  },
  {
    id: "BAR-TH-171",
    titre: "BAR-TH-171",
    sousTitre: "Pompe à chaleur de type air/eau (résidentiel)",
    description:
      "Mise en place d'une pompe à chaleur de type air/eau pour le chauffage et/ou l'eau chaude sanitaire en maison individuelle ou appartement existant.",
    secteur: "Résidentiel",
  },
  {
    id: "BAR-TH-159",
    titre: "BAR-TH-159",
    sousTitre: "Pompe à chaleur hybride (résidentiel)",
    description:
      "Mise en place d'un système hybride combinant une pompe à chaleur air/eau et une chaudière à condensation avec régulation intelligente.",
    secteur: "Résidentiel",
  },
  {
    id: "BAR-EN-101",
    titre: "BAR-EN-101",
    sousTitre: "Isolation de combles ou de toitures",
    description:
      "Mise en place d'une isolation thermique en combles perdus, en rampants de toiture ou en toiture terrasse dans un bâtiment résidentiel existant.",
    secteur: "Résidentiel",
  },
  {
    id: "BAR-EN-102",
    titre: "BAR-EN-102",
    sousTitre: "Isolation des murs",
    description:
      "Mise en place d'une isolation thermique des murs par l'intérieur (ITI) ou par l'extérieur (ITE) dans un bâtiment résidentiel existant.",
    secteur: "Résidentiel",
  },
  {
    id: "BAR-EN-103",
    titre: "BAR-EN-103",
    sousTitre: "Isolation d'un plancher",
    description:
      "Mise en place d'une isolation thermique d'un plancher bas sur vide sanitaire, sous-sol non chauffé ou terre-plein dans un bâtiment résidentiel existant.",
    secteur: "Résidentiel",
  },
  {
    id: "BAT-TH-116",
    titre: "BAT-TH-116",
    sousTitre: "Système de gestion technique du bâtiment (GTB)",
    description:
      "Mise en place d'un système de gestion technique du bâtiment (GTB) de classe A ou B selon la norme EN 15232 pour un bâtiment tertiaire existant.",
    secteur: "Tertiaire",
  },
];

// ─── Catégories de photos ───────────────────────────────────────

const PHOTO_CATEGORIES_134 = [
  "Plaque signalétique groupe froid",
  "Condenseur existant",
  "Système de régulation installé",
  "Sondes / capteurs installés",
  "Variateur de vitesse",
  "Tableau électrique",
  "Vue générale de l'installation",
  "Autre",
];

const PHOTO_CATEGORIES_163 = [
  "Plaque signalétique PAC",
  "Unité extérieure installée",
  "Unité intérieure / module hydraulique",
  "Générateur existant (avant travaux)",
  "Émetteurs de chaleur",
  "Régulateur / sonde extérieure",
  "Local technique",
  "Tableau électrique",
  "Vue générale de l'installation",
  "Autre",
];

const PHOTO_CATEGORIES_171 = [
  "Plaque signalétique PAC",
  "Unité extérieure installée",
  "Module hydraulique intérieur",
  "Chaudière existante (avant travaux)",
  "Émetteurs de chaleur (radiateurs / plancher)",
  "Régulateur / thermostat",
  "Ballon tampon / ECS",
  "Vue générale de l'installation",
  "Autre",
];

const PHOTO_CATEGORIES_159 = [
  "Plaque signalétique PAC hybride",
  "Unité extérieure PAC",
  "Chaudière condensation intégrée",
  "Chaudière existante (avant travaux)",
  "Régulation intelligente / boîtier de commande",
  "Émetteurs de chaleur",
  "Raccordement hydraulique",
  "Vue générale de l'installation",
  "Autre",
];

const PHOTO_CATEGORIES_101 = [
  "Combles avant travaux (vue générale)",
  "Toiture / charpente existante",
  "Isolation existante (si présente)",
  "Isolant projeté / posé (après travaux)",
  "Détail de pose (jonctions, trappe)",
  "Étiquette isolant (marque, R, lambda)",
  "Repérage des points singuliers",
  "Vue générale après travaux",
  "Autre",
];

const PHOTO_CATEGORIES_102 = [
  "Mur avant travaux (intérieur / extérieur)",
  "Isolation existante (si présente)",
  "Mise en œuvre de l'isolant",
  "Détail de pose (jonctions, angles, fenêtres)",
  "Étiquette isolant (marque, R, lambda)",
  "Traitement des ponts thermiques",
  "Finition (enduit / bardage / parement)",
  "Vue générale après travaux",
  "Autre",
];

const PHOTO_CATEGORIES_103 = [
  "Plancher / sous-face avant travaux",
  "Vide sanitaire / sous-sol / terre-plein",
  "Isolation existante (si présente)",
  "Mise en œuvre de l'isolant",
  "Détail de pose (jonctions, passages de gaines)",
  "Étiquette isolant (marque, R, lambda)",
  "Vue générale après travaux",
  "Autre",
];

const PHOTO_CATEGORIES_116 = [
  "Automate / contrôleur GTB",
  "Interface de supervision (écran)",
  "Capteurs / sondes installés",
  "Actionneurs (vannes, registres)",
  "Armoire électrique / tableau de commande",
  "Installation existante (avant travaux)",
  "Schéma d'architecture GTB",
  "Vue générale du local technique",
  "Autre",
];

const PHOTO_CATEGORIES_142 = [
  "Vue générale du local (hauteur sous plafond)",
  "Système de chauffage existant",
  "Déstratificateur installé (vue d'ensemble)",
  "Plaque signalétique du déstratificateur",
  "Sondes de température (haute / basse)",
  "Système de régulation / boîtier de commande",
  "Mesure de vitesse d'air au sol",
  "Vue générale après installation",
  "Autre",
];

const PHOTO_CATEGORIES_139 = [
  "Plaque signalétique du groupe froid",
  "Condenseur existant",
  "Échangeur de récupération installé",
  "Raccordement hydraulique (circuit secondaire)",
  "Sondes / capteurs installés",
  "Système de régulation",
  "Compteur d'énergie récupérée",
  "Vue générale de l'installation",
  "Autre",
];

// ─── Sections de questionnaire ──────────────────────────────────

interface QuestionField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date" | "checkbox";
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
  multiGroup?: {
    label: string;
    countKey: string;
    minCount?: number;
    maxCount?: number;
    templateFields: QuestionField[];
  };
}

// ─── BAT-TH-134 — HP Flottante ─────────────────────────────────

const QUESTIONNAIRE_134: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du site, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire (raison sociale)", type: "text", placeholder: "Raison sociale", required: true },
      { id: "client_siret", label: "SIRET du bénéficiaire", type: "text", placeholder: "Ex: 123 456 789 00012" },
      { id: "client_contact", label: "Interlocuteur", type: "text", placeholder: "Nom et fonction" },
      { id: "adresse", label: "Adresse du site des travaux", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / entreprise RGE", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du site",
    description: "Description du bâtiment, activité et besoins frigorifiques",
    fields: [
      {
        id: "type_batiment",
        label: "Type de bâtiment / Activité",
        type: "select",
        options: [
          "Commerce alimentaire (GMS)",
          "Commerce spécialisé",
          "Entrepôt frigorifique",
          "Industrie agroalimentaire",
          "Restauration collective",
          "Hôtellerie / Restauration",
          "Santé / Hôpital",
          "Laboratoire",
          "Data center",
          "Autre tertiaire",
        ],
        required: true,
      },
      { id: "surface_batiment", label: "Surface totale du bâtiment", type: "number", placeholder: "Ex: 2500", unit: "m²", required: true },
      { id: "surface_climatisee", label: "Surface climatisée / réfrigérée", type: "number", placeholder: "Ex: 800", unit: "m²" },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1985" },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
      { id: "altitude", label: "Altitude", type: "number", placeholder: "Ex: 150", unit: "m" },
      {
        id: "description_activite",
        label: "Description de l'activité et des besoins frigorifiques",
        type: "textarea",
        placeholder: "Décrire l'activité du site, le process de froid, les chambres froides, meubles réfrigérés, etc.",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "3. Installation frigorifique existante",
    description: "Description complète des groupes de production de froid avant travaux",
    fields: [
      { id: "nb_groupes", label: "Nombre de groupes de production de froid", type: "number", placeholder: "Ex: 3", required: true },
      {
        id: "etat_installation_existante",
        label: "État général de l'installation existante",
        type: "textarea",
        placeholder: "Décrire l'état général : compresseurs, condenseurs, détendeurs, tuyauteries, isolation, fuites éventuelles...",
        colSpan: 2,
      },
    ],
    multiGroup: {
      label: "Groupe froid",
      countKey: "nb_groupes_multi",
      minCount: 1,
      maxCount: 10,
      templateFields: [
        {
          id: "type_groupe_froid",
          label: "Type de groupe de froid",
          type: "select",
          options: ["Groupe à condensation à air", "Groupe à condensation à eau", "Centrale frigorifique", "Groupe semi-hermétique", "Groupe à vis", "Autre"],
          required: true,
        },
        { id: "marque_groupe", label: "Marque", type: "text", placeholder: "Ex: Bitzer, Carrier, Copeland...", required: true },
        { id: "modele_groupe", label: "Modèle / référence", type: "text", placeholder: "Référence constructeur" },
        { id: "annee_installation", label: "Année d'installation", type: "number", placeholder: "Ex: 2010", required: true },
        { id: "puissance_froid", label: "Puissance frigorifique", type: "number", placeholder: "Ex: 350", unit: "kW", required: true },
        { id: "puissance_absorbee", label: "Puissance élec. absorbée compresseurs", type: "number", placeholder: "Ex: 120", unit: "kW", required: true },
        {
          id: "fluide_frigorigene",
          label: "Fluide frigorigène",
          type: "select",
          options: ["R-404A", "R-407C", "R-134a", "R-410A", "R-448A", "R-449A", "R-744 (CO₂)", "R-290 (propane)", "R-717 (ammoniac)", "Autre"],
          required: true,
        },
        { id: "charge_fluide", label: "Charge en fluide", type: "number", placeholder: "Ex: 85", unit: "kg" },
        {
          id: "type_condenseur",
          label: "Type de condenseur",
          type: "select",
          options: ["À air (ventilateurs axiaux)", "À air (ventilateurs centrifuges)", "À eau (tour de refroidissement)", "Évaporatif", "Adiabatique", "Autre"],
          required: true,
        },
        { id: "surface_condenseur", label: "Surface d'échange condenseur", type: "number", placeholder: "Ex: 120", unit: "m²" },
        { id: "nb_ventilateurs", label: "Nb ventilateurs condenseur", type: "number", placeholder: "Ex: 6", required: true },
        { id: "puissance_ventilateurs", label: "Puissance totale ventilateurs", type: "number", placeholder: "Ex: 12", unit: "kW" },
        {
          id: "regulation_hp",
          label: "Mode de régulation HP actuel",
          type: "select",
          options: [
            "Aucune régulation (HP fixe toute l'année)",
            "Pressostat HP — seuil fixe",
            "Régulation ON/OFF des ventilateurs (par paliers)",
            "Régulation par pressostat + étagement ventilateurs",
            "Autre (préciser en observations)",
          ],
          required: true,
          help: "Mode de contrôle actuel de la haute pression de condensation",
        },
        { id: "consigne_hp_fixe", label: "Consigne HP fixe actuelle", type: "number", placeholder: "Ex: 18", unit: "bar", required: true, help: "Pression de condensation de référence actuelle" },
        { id: "temp_condensation_fixe", label: "T° de condensation correspondante", type: "number", placeholder: "Ex: 45", unit: "°C", required: true },
        { id: "observations_groupe", label: "Observations", type: "textarea", placeholder: "État spécifique de ce groupe, dysfonctionnements...", colSpan: 2 },
      ],
    },
  },
  {
    titre: "4. Système de régulation HP flottante projeté",
    description: "Justification du choix du matériel et caractéristiques techniques",
    fields: [
      { id: "marque_regulateur", label: "Marque du système de régulation", type: "text", placeholder: "Ex: Danfoss, Carel, Schneider...", required: true },
      { id: "modele_regulateur", label: "Modèle / Référence du régulateur", type: "text", placeholder: "Référence constructeur", required: true },
      { id: "fiche_technique_ref", label: "Référence de la fiche technique constructeur", type: "text", placeholder: "N° de document ou URL" },
      {
        id: "type_regulation",
        label: "Type de régulation HP flottante",
        type: "select",
        options: [
          "Régulation continue de la pression de condensation",
          "Régulation par variation de vitesse des ventilateurs",
          "Régulation combinée (pression + vitesse ventilateurs)",
        ],
        required: true,
      },
      {
        id: "principe_fonctionnement",
        label: "Principe de fonctionnement de la régulation",
        type: "textarea",
        placeholder: "Décrire le principe : comment le système adapte la HP en fonction de la température extérieure, quels paramètres sont mesurés, comment les ventilateurs sont pilotés...",
        colSpan: 2,
        required: true,
        help: "Description détaillée du fonctionnement pour justifier l'efficacité du système",
      },
      {
        id: "capteurs_installes",
        label: "Capteurs et sondes installés",
        type: "select",
        options: [
          "Sonde de pression HP uniquement",
          "Sonde de pression HP + sonde de température extérieure",
          "Sonde de pression HP + sonde T° ext. + sonde T° condensation",
          "Sonde de pression HP + sonde T° ext. + sonde T° condensation + sonde T° refoulement",
        ],
        required: true,
      },
      { id: "marque_sondes", label: "Marque / référence des sondes", type: "text", placeholder: "Ex: Danfoss AKS..." },
      {
        id: "variateur_ventilateurs",
        label: "Variateur de vitesse sur ventilateurs condenseur",
        type: "select",
        options: ["Oui — variateur de fréquence", "Oui — régulateur EC (moteur à commutation électronique)", "Non"],
        required: true,
      },
      { id: "marque_variateur", label: "Marque / modèle variateur", type: "text", placeholder: "Ex: ABB ACS580, Danfoss VLT..." },
      { id: "puissance_variateur", label: "Puissance du variateur", type: "number", placeholder: "Ex: 15", unit: "kW" },
      {
        id: "consigne_hp_min",
        label: "Consigne HP minimale projetée",
        type: "number",
        placeholder: "Ex: 12",
        unit: "bar",
        required: true,
        help: "Pression de condensation minimale autorisée par le système — ne doit pas descendre en dessous du seuil de bon fonctionnement des détendeurs",
      },
      { id: "temp_condensation_min", label: "T° condensation minimale correspondante", type: "number", placeholder: "Ex: 25", unit: "°C", required: true },
      {
        id: "ecart_approche",
        label: "Écart d'approche visé (T° condensation - T° extérieure)",
        type: "number",
        placeholder: "Ex: 10",
        unit: "K",
        required: true,
        help: "Écart maintenu entre la température de condensation et la température extérieure",
      },
      {
        id: "justification_choix",
        label: "Justification du choix du matériel",
        type: "textarea",
        placeholder: "Expliquer pourquoi ce système a été retenu : compatibilité avec l'installation existante, performances, retour d'expérience, certifications, conformité à la fiche CEE...",
        colSpan: 2,
        required: true,
        help: "Ce champ est essentiel pour le dossier CEE : il justifie le choix technique",
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Méthodologie de calcul et preuve du gain d'énergie",
    fields: [
      {
        id: "methode_calcul",
        label: "Méthode de calcul utilisée",
        type: "select",
        options: [
          "Calcul thermodynamique (cycle frigorifique)",
          "Méthode bin (répartition des heures par tranche de T° ext.)",
          "Simulation logicielle (préciser)",
          "Données constructeur + historique de consommation",
        ],
        required: true,
      },
      { id: "logiciel_calcul", label: "Logiciel de calcul utilisé (si applicable)", type: "text", placeholder: "Ex: Coolselector, Pack Calculation Pro..." },
      {
        id: "regime_froid",
        label: "Régime de froid",
        type: "select",
        options: ["Froid positif uniquement (> 0°C)", "Froid négatif uniquement (< 0°C)", "Froid positif + négatif"],
        required: true,
      },
      { id: "temp_evaporation_pos", label: "T° d'évaporation froid positif", type: "number", placeholder: "Ex: -8", unit: "°C" },
      { id: "temp_evaporation_neg", label: "T° d'évaporation froid négatif", type: "number", placeholder: "Ex: -30", unit: "°C" },
      { id: "heures_fonctionnement", label: "Heures de fonctionnement annuelles", type: "number", placeholder: "Ex: 6500", unit: "h/an", required: true },
      {
        id: "profil_utilisation",
        label: "Profil d'utilisation",
        type: "select",
        options: ["Continu (24h/24, 7j/7)", "Horaires d'ouverture (ex: 6h-22h)", "Saisonnier", "Autre"],
        required: true,
      },
      { id: "conso_electrique_avant", label: "Consommation électrique annuelle AVANT travaux (compresseurs + ventilateurs)", type: "number", placeholder: "Ex: 450", unit: "MWh/an", required: true, colSpan: 2 },
      { id: "source_conso_avant", label: "Source de la donnée de consommation", type: "select", options: ["Factures EDF", "Compteur dédié", "Estimation par calcul", "Données constructeur"], required: true },
      { id: "conso_electrique_apres", label: "Consommation électrique annuelle APRÈS travaux (estimée)", type: "number", placeholder: "Ex: 340", unit: "MWh/an", required: true, colSpan: 2 },
      {
        id: "detail_calcul",
        label: "Détail du calcul de gain énergétique",
        type: "textarea",
        placeholder: "Détailler le calcul : méthode, hypothèses retenues (répartition horaire des températures, taux de charge, COP avant/après par tranche de température, etc.).\n\nExemple :\n- HP fixe à 45°C → COP moyen = 2.8\n- HP flottante (écart 10K) → COP moyen pondéré = 3.6\n- Gain = (1 - 2.8/3.6) × 100 = 22%",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul est la pièce maîtresse du dossier : il prouve le gain d'énergie",
      },
      {
        id: "gain_energetique_pct",
        label: "Gain énergétique total",
        type: "number",
        placeholder: "Ex: 22",
        unit: "%",
        required: true,
        help: "Réduction de la consommation électrique du groupe froid",
      },
      { id: "gain_energetique_mwh", label: "Gain énergétique annuel", type: "number", placeholder: "Ex: 110", unit: "MWh/an", required: true },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 850", unit: "MWh cumac", help: "Selon la fiche standardisée BAT-TH-134" },
      { id: "economie_euros", label: "Économie financière annuelle estimée", type: "number", placeholder: "Ex: 15000", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 35000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 2.5", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et engagement",
    description: "Vérification de la conformité à la fiche CEE BAT-TH-134",
    fields: [
      {
        id: "conformite_fiche",
        label: "Le système permet une régulation de la HP en fonction de la température extérieure",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
        help: "Condition obligatoire de la fiche BAT-TH-134",
      },
      {
        id: "condenseur_air",
        label: "Le condenseur est de type à air",
        type: "select",
        options: ["Oui", "Non"],
        required: true,
        help: "La fiche BAT-TH-134 s'applique aux condenseurs à air",
      },
      {
        id: "regulation_continue",
        label: "La régulation permet un ajustement continu (pas uniquement par paliers ON/OFF)",
        type: "select",
        options: ["Oui — régulation continue / proportionnelle", "Non — par paliers uniquement"],
        required: true,
      },
      {
        id: "date_installation_prevue",
        label: "Date d'installation prévue",
        type: "date",
        required: true,
      },
      {
        id: "duree_vie_equipement",
        label: "Durée de vie conventionnelle de l'équipement",
        type: "text",
        placeholder: "15 ans (selon fiche)",
        help: "Durée de vie retenue pour le calcul CEE",
      },
      {
        id: "conclusion",
        label: "Conclusion et avis technique",
        type: "textarea",
        placeholder: "Synthèse de la note : confirmer que le dimensionnement est adapté, que le gain est justifié, que l'installation est conforme à la fiche CEE BAT-TH-134, et que les travaux sont recommandés.\n\nIndiquer les éventuelles réserves ou points d'attention.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAT-TH-163 — PAC air/eau ──────────────────────────────────

const QUESTIONNAIRE_163: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du site, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire (raison sociale)", type: "text", placeholder: "Raison sociale", required: true },
      { id: "client_siret", label: "SIRET du bénéficiaire", type: "text", placeholder: "Ex: 123 456 789 00012" },
      { id: "client_contact", label: "Interlocuteur", type: "text", placeholder: "Nom et fonction" },
      { id: "adresse", label: "Adresse du site des travaux", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / entreprise RGE", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du bâtiment",
    description: "Description complète du bâtiment et de l'enveloppe thermique",
    fields: [
      {
        id: "type_batiment",
        label: "Type de bâtiment",
        type: "select",
        options: ["Bureau", "Commerce", "Enseignement", "Santé / Hôpital", "Hôtellerie / Restauration", "Sport / Loisirs", "Entrepôt / Logistique", "Autre tertiaire"],
        required: true,
      },
      { id: "surface_chauffee", label: "Surface chauffée", type: "number", placeholder: "Ex: 1200", unit: "m²", required: true },
      { id: "volume_chauffe", label: "Volume chauffé", type: "number", placeholder: "Ex: 3600", unit: "m³", help: "Surface × hauteur sous plafond moyenne — calculé auto si vide" },
      { id: "hauteur_sous_plafond", label: "Hauteur sous plafond moyenne", type: "number", placeholder: "Ex: 3", unit: "m" },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1990", required: true },
      { id: "nb_niveaux", label: "Nombre de niveaux", type: "number", placeholder: "Ex: 3" },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
      { id: "altitude", label: "Altitude", type: "number", placeholder: "Ex: 200", unit: "m" },
      { id: "temp_base", label: "Température extérieure de base", type: "number", placeholder: "Ex: -5", unit: "°C", required: true, help: "Selon la zone climatique et l'altitude (NF EN 12831)" },
      { id: "temp_interieure", label: "Température intérieure de consigne", type: "number", placeholder: "Ex: 19", unit: "°C", required: true },
      {
        id: "isolation_murs",
        label: "Isolation des murs",
        type: "select",
        options: ["Non isolés", "Isolation intérieure (ITE)", "Isolation extérieure (ITE)", "Isolation répartie", "Inconnu"],
      },
      {
        id: "isolation_toiture",
        label: "Isolation de la toiture / combles",
        type: "select",
        options: ["Non isolés", "Combles perdus isolés", "Rampants isolés", "Toiture terrasse isolée", "Inconnu"],
      },
      {
        id: "type_vitrage",
        label: "Type de vitrage",
        type: "select",
        options: ["Simple vitrage", "Double vitrage ancien (avant 2000)", "Double vitrage performant", "Triple vitrage", "Mixte"],
      },
      { id: "surface_murs_ext", label: "Surface murs extérieurs", type: "number", placeholder: "Calculé auto si vide", unit: "m²", help: "Surface totale de façades (avec vitrages)" },
      { id: "taux_vitrage", label: "Taux de vitrage des façades", type: "number", placeholder: "Ex: 25", unit: "%", help: "Part vitrée des murs extérieurs (défaut: 25%)" },
      { id: "surface_toiture", label: "Surface de toiture", type: "number", placeholder: "Calculé auto si vide", unit: "m²", help: "= Surface chauffée / nb niveaux si vide" },
      { id: "taux_renouvellement_air", label: "Taux de renouvellement d'air", type: "number", placeholder: "Ex: 0.7", unit: "vol/h", help: "0.6 = VMC hygroréglable · 0.7 = VMC simple flux · 1.0 = ventilation naturelle" },
      {
        id: "description_batiment",
        label: "Description complémentaire du bâtiment",
        type: "textarea",
        placeholder: "Structure (béton, maçonnerie, ossature bois...), orientation, masques solaires, particularités architecturales, état de l'enveloppe...",
        colSpan: 2,
      },
    ],
  },
  {
    titre: "3. Installation de chauffage existante",
    description: "Équipement de chauffage actuel avant travaux — à remplacer",
    fields: [
      {
        id: "energie_existante",
        label: "Énergie de chauffage existante",
        type: "select",
        options: ["Gaz naturel", "Fioul domestique", "Charbon", "Électricité (effet Joule)", "GPL", "Réseau de chaleur", "Bois", "Autre"],
        required: true,
      },
      {
        id: "type_generateur_existant",
        label: "Type de générateur existant",
        type: "select",
        options: ["Chaudière standard", "Chaudière basse température", "Chaudière condensation", "Convecteurs électriques", "Radiateurs électriques", "CTA avec batterie électrique", "PAC existante (à remplacer)", "Autre"],
        required: true,
      },
      { id: "marque_generateur_existant", label: "Marque / modèle du générateur existant", type: "text", placeholder: "Ex: De Dietrich GTU 1204" },
      { id: "annee_generateur_existant", label: "Année d'installation du générateur", type: "number", placeholder: "Ex: 1998" },
      { id: "puissance_existante", label: "Puissance nominale installée", type: "number", placeholder: "Ex: 150", unit: "kW", required: true },
      { id: "rendement_existant", label: "Rendement du générateur existant", type: "number", placeholder: "Ex: 85", unit: "%", help: "Sur PCI — à défaut utiliser valeurs forfaitaires selon âge" },
      {
        id: "emission_existante",
        label: "Type d'émetteurs existants",
        type: "select",
        options: ["Radiateurs haute température (70/50°C)", "Radiateurs moyenne température (55/45°C)", "Radiateurs basse température (45/35°C)", "Plancher chauffant", "Ventilo-convecteurs", "CTA (Centrale de Traitement d'Air)", "Autre"],
        required: true,
      },
      { id: "temp_regime_existant", label: "Régime de température existant (départ/retour)", type: "text", placeholder: "Ex: 70/50°C", required: true, help: "Conditionne le choix du régime de la PAC" },
      {
        id: "distribution_existante",
        label: "Réseau de distribution",
        type: "select",
        options: ["Monotube", "Bitube", "Pieuvre / collecteur", "Autre"],
      },
      { id: "ecs_existante", label: "Production d'ECS existante", type: "select", options: ["Chaudière (combinée)", "Ballon électrique", "Solaire thermique", "Autre", "Pas d'ECS"], },
      {
        id: "conso_chauffage_existante",
        label: "Consommation annuelle de chauffage (énergie finale)",
        type: "number",
        placeholder: "Ex: 180",
        unit: "MWh/an",
        required: true,
        help: "Sur la base des factures ou du DPE",
      },
      { id: "source_conso", label: "Source de la donnée", type: "select", options: ["Factures énergétiques (3 ans)", "DPE existant", "Estimation par calcul", "Compteur dédié"], required: true },
      {
        id: "etat_installation_existante",
        label: "État et observations sur l'installation existante",
        type: "textarea",
        placeholder: "Décrire l'état du générateur, des émetteurs, du réseau, les dysfonctionnements observés, les raisons du remplacement...",
        colSpan: 2,
      },
    ],
  },
  {
    titre: "4. PAC air/eau projetée",
    description: "Caractéristiques techniques et justification du choix de la PAC",
    fields: [
      { id: "marque_pac", label: "Marque", type: "text", placeholder: "Ex: Daikin, Atlantic, Mitsubishi...", required: true },
      { id: "modele_pac", label: "Modèle / Référence", type: "text", placeholder: "Référence constructeur", required: true },
      { id: "fiche_technique_ref", label: "N° de fiche technique / certification", type: "text", placeholder: "Référence Eurovent ou constructeur" },
      {
        id: "puissance_calo_7_35",
        label: "Puissance calorifique à A7/W35",
        type: "number",
        placeholder: "Ex: 120",
        unit: "kW",
        required: true,
        help: "Conditions : air extérieur 7°C / eau 35°C",
      },
      {
        id: "puissance_calo_7_45",
        label: "Puissance calorifique à A7/W45",
        type: "number",
        placeholder: "Ex: 110",
        unit: "kW",
        help: "Conditions : air extérieur 7°C / eau 45°C",
      },
      {
        id: "puissance_calo_base",
        label: "Puissance calorifique au point de base",
        type: "number",
        placeholder: "Ex: 85",
        unit: "kW",
        required: true,
        help: "Puissance à la température extérieure de base du site",
      },
      { id: "puissance_absorbee_nominale", label: "Puissance électrique absorbée nominale", type: "number", placeholder: "Ex: 35", unit: "kW", required: true },
      {
        id: "cop_a7_w35",
        label: "COP à A7/W35",
        type: "number",
        placeholder: "Ex: 4.2",
        required: true,
      },
      { id: "cop_a7_w45", label: "COP à A7/W45", type: "number", placeholder: "Ex: 3.5" },
      { id: "cop_a_base", label: "COP au point de base", type: "number", placeholder: "Ex: 2.8", help: "COP à la température extérieure de base" },
      {
        id: "etas",
        label: "Efficacité énergétique saisonnière (ηs)",
        type: "number",
        placeholder: "Ex: 130",
        unit: "%",
        required: true,
        help: "Exigence fiche BAT-TH-163 : ηs ≥ 111% (moyenne temp.) ou ηs ≥ 126% (basse temp.)",
      },
      {
        id: "scop",
        label: "SCOP (EN 14825)",
        type: "number",
        placeholder: "Ex: 4.1",
        required: true,
        help: "Coefficient de performance saisonnier selon EN 14825",
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
      { id: "temp_retour_eau", label: "Température de retour d'eau", type: "number", placeholder: "Ex: 40", unit: "°C", required: true },
      {
        id: "fluide_frigorigene",
        label: "Fluide frigorigène",
        type: "select",
        options: ["R-32", "R-410A", "R-290 (propane)", "R-454B", "R-1234ze", "Autre"],
        required: true,
      },
      { id: "charge_fluide", label: "Charge en fluide", type: "number", placeholder: "Ex: 8.5", unit: "kg" },
      { id: "niveau_sonore", label: "Niveau sonore (unité extérieure)", type: "number", placeholder: "Ex: 68", unit: "dB(A)" },
      { id: "nombre_unites", label: "Nombre d'unités extérieures", type: "number", placeholder: "Ex: 1" },
      {
        id: "justification_choix",
        label: "Justification du choix de la PAC",
        type: "textarea",
        placeholder: "Expliquer pourquoi cette PAC a été retenue :\n- Adéquation avec les déperditions du bâtiment\n- Compatibilité avec les émetteurs existants (régime de T°)\n- Performance énergétique (ηs, SCOP)\n- Conformité aux exigences de la fiche CEE BAT-TH-163\n- Contraintes d'implantation (bruit, espace, accès...)",
        colSpan: 2,
        required: true,
        help: "Justification essentielle pour le dossier CEE",
      },
    ],
  },
  {
    titre: "5. Régulation et hydraulique",
    description: "Système de régulation, hydraulique et réseau de distribution",
    fields: [
      {
        id: "regulateur_classe",
        label: "Classe du régulateur",
        type: "select",
        options: ["Classe IV", "Classe V", "Classe VI", "Classe VII", "Classe VIII"],
        required: true,
        help: "Minimum classe IV exigé par la fiche CEE BAT-TH-163",
      },
      { id: "marque_regulateur", label: "Marque / modèle du régulateur", type: "text", placeholder: "Ex: Siemens RWD...", required: true },
      {
        id: "loi_eau",
        label: "Loi d'eau",
        type: "select",
        options: ["Oui — avec sonde extérieure", "Oui — avec sonde d'ambiance", "Oui — les deux (sonde ext. + ambiance)", "Non"],
        required: true,
      },
      {
        id: "programmation_horaire",
        label: "Programmation horaire / réduit nuit",
        type: "select",
        options: ["Oui — hebdomadaire avec réduit nuit", "Oui — journalière", "Non"],
        required: true,
      },
      {
        id: "ballon_tampon",
        label: "Ballon tampon / ballon d'inertie",
        type: "select",
        options: ["Oui", "Non"],
      },
      { id: "volume_tampon", label: "Volume du ballon tampon", type: "number", placeholder: "Ex: 500", unit: "L" },
      {
        id: "ballon_ecs",
        label: "Ballon de production ECS (si PAC assure l'ECS)",
        type: "select",
        options: ["Oui — intégré", "Oui — séparé", "Non — ECS indépendante"],
      },
      { id: "volume_ecs", label: "Volume ballon ECS", type: "number", placeholder: "Ex: 300", unit: "L" },
      {
        id: "pompe_distribution",
        label: "Pompe de distribution",
        type: "select",
        options: ["Vitesse variable (EEI ≤ 0.23)", "Vitesse fixe", "Non applicable"],
        required: true,
      },
      {
        id: "gestion_cascade",
        label: "Gestion en cascade (si multi-PAC)",
        type: "select",
        options: ["Oui", "Non", "Non applicable (une seule PAC)"],
      },
      {
        id: "modifications_hydrauliques",
        label: "Modifications hydrauliques prévues",
        type: "textarea",
        placeholder: "Décrire les modifications du réseau hydraulique : remplacement de la pompe de circulation, ajout du ballon tampon, modification du régime de température des émetteurs, calorifugeage des tuyauteries...",
        colSpan: 2,
      },
    ],
  },
  {
    titre: "6. Dimensionnement et bilan énergétique",
    description: "Calcul des déperditions, dimensionnement de la PAC et preuve du gain d'énergie",
    fields: [
      {
        id: "methode_calcul",
        label: "Méthode de calcul des déperditions",
        type: "select",
        options: ["NF EN 12831 (méthode détaillée)", "RT existant (Th-C-E ex)", "Calcul simplifié (G × V × ΔT)", "Simulation thermique dynamique (STD)", "Logiciel de dimensionnement constructeur"],
        required: true,
      },
      { id: "logiciel_calcul", label: "Logiciel utilisé (si applicable)", type: "text", placeholder: "Ex: Perrenoud, Pleiades, ClimaWin..." },
      { id: "deperditions_totales", label: "Déperditions totales du bâtiment", type: "number", placeholder: "Ex: 130", unit: "kW", required: true },
      { id: "deperditions_par_m2", label: "Déperditions rapportées à la surface", type: "number", placeholder: "Ex: 108", unit: "W/m²", help: "= Déperditions totales / surface chauffée" },
      { id: "coeff_G", label: "Coefficient G (ou Ubât)", type: "number", placeholder: "Ex: 1.2", unit: "W/m³.K", help: "Coefficient de déperdition volumique global" },
      { id: "besoin_chauffage", label: "Besoins annuels de chauffage", type: "number", placeholder: "Ex: 185", unit: "MWh/an", required: true },
      { id: "part_apports_gratuits", label: "Apports gratuits retenus (solaire + internes)", type: "number", placeholder: "Ex: 15", unit: "%", help: "Réduction forfaitaire des besoins bruts. Tertiaire bureaux ≈ 15 % ; logement ≈ 10–20 %. Max 35 %." },
      { id: "besoin_ecs", label: "Besoins annuels ECS (si PAC assure l'ECS)", type: "number", placeholder: "Ex: 25", unit: "MWh/an" },
      { id: "taux_couverture", label: "Taux de couverture PAC", type: "number", placeholder: "Ex: 90", unit: "%", required: true, help: "Part des besoins couverts par la PAC. Recommandé ≥ 80%" },
      {
        id: "appoint",
        label: "Appoint prévu",
        type: "select",
        options: ["Aucun (PAC seule — 100%)", "Chaudière gaz condensation (relève)", "Résistance électrique intégrée", "Chaudière bois", "Autre"],
        required: true,
      },
      { id: "puissance_appoint", label: "Puissance de l'appoint", type: "number", placeholder: "Ex: 40", unit: "kW" },
      {
        id: "point_bivalence",
        label: "Température de bivalence",
        type: "number",
        placeholder: "Ex: -3",
        unit: "°C",
        help: "Température extérieure en dessous de laquelle l'appoint prend le relais",
      },
      {
        id: "detail_calcul",
        label: "Détail du calcul de dimensionnement et du bilan énergétique",
        type: "textarea",
        placeholder: "Détailler :\n1. Calcul des déperditions (méthode, coefficients U des parois, ponts thermiques, renouvellement d'air)\n2. Justification du dimensionnement PAC vs déperditions\n3. Calcul du gain énergétique :\n   - Conso avant = Besoins / rendement générateur existant\n   - Conso après = Besoins / SCOP de la PAC\n   - Gain = Conso avant - Conso après\n4. Prise en compte de l'appoint si applicable",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul prouve le gain d'énergie — pièce essentielle du dossier CEE",
      },
      { id: "conso_avant_travaux", label: "Consommation avant travaux (énergie finale)", type: "number", placeholder: "Ex: 210", unit: "MWh/an", required: true },
      { id: "conso_apres_travaux", label: "Consommation après travaux (énergie finale)", type: "number", placeholder: "Ex: 55", unit: "MWh/an", required: true },
      {
        id: "gain_energetique_pct",
        label: "Gain énergétique",
        type: "number",
        placeholder: "Ex: 74",
        unit: "%",
        required: true,
      },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 155", unit: "MWh/an", required: true },
      { id: "reduction_co2", label: "Réduction des émissions CO₂", type: "number", placeholder: "Ex: 32", unit: "t CO₂/an" },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 3200", unit: "MWh cumac", help: "Selon la fiche standardisée BAT-TH-163" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 22000", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 85000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 4", unit: "ans" },
    ],
  },
  {
    titre: "7. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAT-TH-163 et avis technique",
    fields: [
      {
        id: "conformite_etas",
        label: "L'efficacité énergétique saisonnière (ηs) respecte le seuil de la fiche",
        type: "select",
        options: ["Oui — ηs ≥ 111% (moyenne température)", "Oui — ηs ≥ 126% (basse température)", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_regulateur",
        label: "Le régulateur est de classe IV minimum",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_installateur",
        label: "L'installateur est qualifié RGE",
        type: "select",
        options: ["Oui — qualification vérifiée", "Non — non qualifié", "En cours de vérification"],
        required: true,
      },
      {
        id: "date_installation_prevue",
        label: "Date d'installation prévue",
        type: "date",
        required: true,
      },
      {
        id: "duree_vie_equipement",
        label: "Durée de vie conventionnelle",
        type: "text",
        placeholder: "17 ans (selon fiche BAT-TH-163)",
        help: "Durée de vie retenue pour le calcul CEE",
      },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse de la note de dimensionnement :\n- Confirmer que le dimensionnement de la PAC est adapté aux déperditions du bâtiment\n- Confirmer que le gain énergétique est justifié par les calculs\n- Confirmer la conformité à la fiche CEE BAT-TH-163\n- Émettre un avis favorable (ou défavorable avec réserves)\n- Mentionner les points d'attention éventuels",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAR-TH-171 — PAC air/eau résidentiel ─────────────────────

const QUESTIONNAIRE_171: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du logement, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire", type: "text", placeholder: "Nom et prénom", required: true },
      { id: "adresse", label: "Adresse du logement", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / entreprise RGE", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du logement",
    description: "Description du logement et de l'enveloppe thermique",
    fields: [
      {
        id: "type_logement",
        label: "Type de logement",
        type: "select",
        options: ["Maison individuelle", "Appartement"],
        required: true,
      },
      { id: "surface_habitable", label: "Surface habitable", type: "number", placeholder: "Ex: 120", unit: "m²", required: true },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1985", required: true },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
      { id: "nb_pieces", label: "Nombre de pièces principales", type: "number", placeholder: "Ex: 5" },
      { id: "hauteur_plafond", label: "Hauteur sous plafond moyenne", type: "number", placeholder: "Ex: 2.5", unit: "m" },
    ],
  },
  {
    titre: "3. Installation existante",
    description: "Équipement de chauffage actuel avant travaux",
    fields: [
      {
        id: "energie_existante",
        label: "Énergie de chauffage existante",
        type: "select",
        options: ["Gaz naturel", "Fioul domestique", "Électricité (effet Joule)", "GPL", "Charbon", "Bois", "Autre"],
        required: true,
      },
      {
        id: "type_chauffage_existant",
        label: "Type de chauffage existant",
        type: "select",
        options: ["Chaudière standard", "Chaudière basse température", "Chaudière condensation", "Convecteurs électriques", "Radiateurs électriques", "PAC existante (à remplacer)", "Autre"],
        required: true,
      },
      { id: "puissance_existante", label: "Puissance nominale installée", type: "number", placeholder: "Ex: 24", unit: "kW", required: true },
      {
        id: "emetteurs_existants",
        label: "Type d'émetteurs",
        type: "select",
        options: ["Radiateurs haute température (70/50°C)", "Radiateurs moyenne température (55/45°C)", "Radiateurs basse température (45/35°C)", "Plancher chauffant", "Ventilo-convecteurs", "Autre"],
        required: true,
      },
    ],
  },
  {
    titre: "4. PAC air/eau projetée",
    description: "Caractéristiques techniques de la PAC — conformité au règlement EU 813/2013",
    fields: [
      { id: "marque_pac", label: "Marque", type: "text", placeholder: "Ex: Daikin, Atlantic, Mitsubishi...", required: true },
      { id: "modele_pac", label: "Modèle / Référence", type: "text", placeholder: "Référence constructeur", required: true },
      { id: "puissance_calorifique", label: "Puissance calorifique nominale", type: "number", placeholder: "Ex: 12", unit: "kW", required: true },
      { id: "cop", label: "COP à A7/W35", type: "number", placeholder: "Ex: 4.5", required: true },
      { id: "scop", label: "SCOP (EN 14825)", type: "number", placeholder: "Ex: 4.2", required: true },
      {
        id: "etas",
        label: "Efficacité énergétique saisonnière (ηs)",
        type: "number",
        placeholder: "Ex: 130",
        unit: "%",
        required: true,
        help: "Exigence : ηs ≥ 111% (moyenne T°) ou ηs ≥ 126% (basse T°) selon règlement EU 813/2013",
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
      {
        id: "fluide_frigorigene",
        label: "Fluide frigorigène",
        type: "select",
        options: ["R-32", "R-410A", "R-290 (propane)", "R-454B", "R-1234ze", "Autre"],
        required: true,
      },
      {
        id: "justification_choix",
        label: "Justification du choix de la PAC",
        type: "textarea",
        placeholder: "Expliquer pourquoi cette PAC a été retenue : adéquation aux déperditions, compatibilité émetteurs, performance ηs, conformité BAR-TH-171...",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Dimensionnement et preuve du gain d'énergie",
    fields: [
      {
        id: "detail_calcul",
        label: "Détail du calcul de dimensionnement et du bilan énergétique",
        type: "textarea",
        placeholder: "Détailler :\n1. Calcul des déperditions du logement\n2. Justification du dimensionnement PAC vs déperditions\n3. Conso avant = Besoins / rendement générateur existant\n4. Conso après = Besoins / SCOP de la PAC\n5. Gain = Conso avant - Conso après",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul prouve le gain d'énergie — pièce essentielle du dossier CEE",
      },
      { id: "gain_energetique_pct", label: "Gain énergétique", type: "number", placeholder: "Ex: 65", unit: "%", required: true },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 12", unit: "MWh/an", required: true },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 250", unit: "MWh cumac", help: "Selon la fiche standardisée BAR-TH-171" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 1500", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 15000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 6", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAR-TH-171",
    fields: [
      {
        id: "conformite_etas",
        label: "L'efficacité énergétique saisonnière (ηs) respecte le seuil réglementaire",
        type: "select",
        options: ["Oui — ηs ≥ 111% (moyenne température)", "Oui — ηs ≥ 126% (basse température)", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_installateur",
        label: "L'installateur est qualifié RGE",
        type: "select",
        options: ["Oui — qualification vérifiée", "Non — non qualifié", "En cours de vérification"],
        required: true,
      },
      { id: "date_installation_prevue", label: "Date d'installation prévue", type: "date", required: true },
      { id: "duree_vie_equipement", label: "Durée de vie conventionnelle", type: "text", placeholder: "17 ans (selon fiche BAR-TH-171)" },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse : confirmer le dimensionnement, le gain justifié, la conformité BAR-TH-171, émettre un avis favorable ou réserves.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAR-TH-159 — PAC hybride résidentiel ─────────────────────

const QUESTIONNAIRE_159: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du logement, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire", type: "text", placeholder: "Nom et prénom", required: true },
      { id: "adresse", label: "Adresse du logement", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / entreprise RGE", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du logement",
    description: "Description du logement existant",
    fields: [
      {
        id: "type_logement",
        label: "Type de logement",
        type: "select",
        options: ["Maison individuelle", "Appartement"],
        required: true,
      },
      { id: "surface_habitable", label: "Surface habitable", type: "number", placeholder: "Ex: 120", unit: "m²", required: true },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1985", required: true },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
      { id: "nb_pieces", label: "Nombre de pièces principales", type: "number", placeholder: "Ex: 5" },
    ],
  },
  {
    titre: "3. Installation existante",
    description: "Équipement de chauffage actuel avant travaux",
    fields: [
      {
        id: "energie_existante",
        label: "Énergie de chauffage existante",
        type: "select",
        options: ["Gaz naturel", "Fioul domestique", "Électricité (effet Joule)", "GPL", "Charbon", "Autre"],
        required: true,
      },
      {
        id: "type_chauffage_existant",
        label: "Type de chauffage existant",
        type: "select",
        options: ["Chaudière standard", "Chaudière basse température", "Chaudière condensation", "Convecteurs électriques", "Autre"],
        required: true,
      },
      { id: "puissance_existante", label: "Puissance nominale installée", type: "number", placeholder: "Ex: 24", unit: "kW", required: true },
      {
        id: "emetteurs_existants",
        label: "Type d'émetteurs",
        type: "select",
        options: ["Radiateurs haute température (70/50°C)", "Radiateurs moyenne température (55/45°C)", "Radiateurs basse température (45/35°C)", "Plancher chauffant", "Autre"],
        required: true,
      },
    ],
  },
  {
    titre: "4. PAC hybride projetée",
    description: "PAC air/eau couplée à une chaudière gaz condensation avec régulation intelligente",
    fields: [
      { id: "marque_pac_hybride", label: "Marque du système hybride", type: "text", placeholder: "Ex: Daikin, Atlantic, Saunier Duval...", required: true },
      { id: "modele_pac_hybride", label: "Modèle / Référence", type: "text", placeholder: "Référence constructeur", required: true },
      { id: "puissance_pac", label: "Puissance calorifique PAC", type: "number", placeholder: "Ex: 8", unit: "kW", required: true },
      { id: "puissance_chaudiere", label: "Puissance chaudière condensation", type: "number", placeholder: "Ex: 24", unit: "kW", required: true },
      { id: "cop", label: "COP de la PAC à A7/W35", type: "number", placeholder: "Ex: 4.0", required: true },
      {
        id: "regulation_intelligente",
        label: "Type de régulation intelligente",
        type: "select",
        options: [
          "Alternance automatique PAC / chaudière selon T° extérieure",
          "Optimisation coût énergie (PAC vs gaz)",
          "Alternance selon COP et prix énergie",
        ],
        required: true,
        help: "La régulation doit alterner automatiquement entre PAC et chaudière selon la température extérieure",
      },
      { id: "temp_bascule", label: "Température de bascule PAC → chaudière", type: "number", placeholder: "Ex: -2", unit: "°C", help: "Température extérieure en dessous de laquelle la chaudière prend le relais" },
      {
        id: "fluide_frigorigene",
        label: "Fluide frigorigène de la PAC",
        type: "select",
        options: ["R-32", "R-410A", "R-290 (propane)", "R-454B", "Autre"],
        required: true,
      },
      {
        id: "justification_choix",
        label: "Justification du choix du système hybride",
        type: "textarea",
        placeholder: "Expliquer pourquoi un système hybride est retenu : climat, réseau gaz existant, émetteurs haute température, optimisation énergétique, conformité BAR-TH-159...",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Dimensionnement et preuve du gain d'énergie",
    fields: [
      {
        id: "detail_calcul",
        label: "Détail du calcul de dimensionnement et du bilan énergétique",
        type: "textarea",
        placeholder: "Détailler :\n1. Déperditions du logement\n2. Répartition PAC / chaudière selon profil climatique\n3. Conso avant = Besoins / rendement générateur existant\n4. Conso après = (Besoins PAC / SCOP) + (Besoins chaudière / rendement condensation)\n5. Gain global",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul prouve le gain d'énergie — pièce essentielle du dossier CEE",
      },
      { id: "gain_energetique_pct", label: "Gain énergétique", type: "number", placeholder: "Ex: 40", unit: "%", required: true },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 8", unit: "MWh/an", required: true },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 200", unit: "MWh cumac", help: "Selon la fiche standardisée BAR-TH-159" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 900", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 12000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 8", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAR-TH-159",
    fields: [
      {
        id: "conformite_hybride",
        label: "Le système combine bien une PAC air/eau et une chaudière à condensation",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_regulation",
        label: "La régulation intelligente alterne automatiquement PAC / chaudière selon la T° extérieure",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_installateur",
        label: "L'installateur est qualifié RGE",
        type: "select",
        options: ["Oui — qualification vérifiée", "Non — non qualifié", "En cours de vérification"],
        required: true,
      },
      { id: "date_installation_prevue", label: "Date d'installation prévue", type: "date", required: true },
      { id: "duree_vie_equipement", label: "Durée de vie conventionnelle", type: "text", placeholder: "17 ans (selon fiche BAR-TH-159)" },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse : confirmer le dimensionnement, le gain justifié, la conformité BAR-TH-159, émettre un avis favorable ou réserves.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAR-EN-101 — Isolation combles / toitures ────────────────

const QUESTIONNAIRE_101: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du logement, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire", type: "text", placeholder: "Nom et prénom", required: true },
      { id: "adresse", label: "Adresse du logement", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / entreprise RGE", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du logement",
    description: "Description du logement existant",
    fields: [
      {
        id: "type_logement",
        label: "Type de logement",
        type: "select",
        options: ["Maison individuelle", "Appartement", "Immeuble collectif"],
        required: true,
      },
      { id: "surface_habitable", label: "Surface habitable", type: "number", placeholder: "Ex: 120", unit: "m²", required: true },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1975", required: true },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
    ],
  },
  {
    titre: "3. Combles / toiture existants",
    description: "État actuel des combles ou de la toiture avant travaux",
    fields: [
      {
        id: "type_combles",
        label: "Type de combles / toiture",
        type: "select",
        options: ["Combles perdus", "Combles aménagés (rampants)", "Toiture terrasse"],
        required: true,
      },
      { id: "surface_isolee", label: "Surface à isoler", type: "number", placeholder: "Ex: 80", unit: "m²", required: true },
      {
        id: "isolation_actuelle",
        label: "Isolation actuelle",
        type: "select",
        options: ["Aucune isolation", "Isolation insuffisante (< 100 mm)", "Isolation dégradée", "Isolation partielle"],
        required: true,
      },
      { id: "r_actuel", label: "Résistance thermique actuelle (si connue)", type: "number", placeholder: "Ex: 1.5", unit: "m².K/W" },
    ],
  },
  {
    titre: "4. Isolation projetée",
    description: "Caractéristiques de l'isolation mise en œuvre",
    fields: [
      {
        id: "type_isolant",
        label: "Type d'isolant",
        type: "select",
        options: ["Laine de verre", "Laine de roche", "Ouate de cellulose", "Laine de bois", "Polystyrène expansé (PSE)", "Polyuréthane (PUR)", "Laine de chanvre", "Autre"],
        required: true,
      },
      {
        id: "r_thermique",
        label: "Résistance thermique R de l'isolant posé",
        type: "number",
        placeholder: "Ex: 7",
        unit: "m².K/W",
        required: true,
        help: "Exigence : R ≥ 7 m².K/W pour combles perdus, R ≥ 6 m².K/W pour rampants / toiture terrasse",
      },
      { id: "epaisseur", label: "Épaisseur de l'isolant", type: "number", placeholder: "Ex: 300", unit: "mm", required: true },
      { id: "lambda", label: "Conductivité thermique (λ)", type: "number", placeholder: "Ex: 0.035", unit: "W/(m.K)", required: true },
      { id: "marque_isolant", label: "Marque de l'isolant", type: "text", placeholder: "Ex: Isover, Rockwool, Knauf...", required: true },
      { id: "reference_isolant", label: "Référence produit", type: "text", placeholder: "Référence commerciale" },
      {
        id: "justification_choix",
        label: "Justification du choix de l'isolant",
        type: "textarea",
        placeholder: "Expliquer le choix : performance thermique, compatibilité avec le support, certification ACERMI, conformité BAR-EN-101...",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Estimation des économies d'énergie générées par l'isolation",
    fields: [
      {
        id: "detail_calcul",
        label: "Détail du calcul de gain énergétique",
        type: "textarea",
        placeholder: "Détailler :\n1. Déperditions avant travaux par la toiture (U avant × S × ΔT × DJU)\n2. Déperditions après travaux (U après × S × ΔT × DJU)\n3. Gain = Déperditions avant - Déperditions après\n4. Conversion en énergie finale selon le rendement du système de chauffage",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul prouve le gain d'énergie",
      },
      { id: "gain_energetique_pct", label: "Gain énergétique", type: "number", placeholder: "Ex: 30", unit: "%", required: true },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 5", unit: "MWh/an", required: true },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 120", unit: "MWh cumac", help: "Selon la fiche standardisée BAR-EN-101" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 600", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 4000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 5", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAR-EN-101",
    fields: [
      {
        id: "conformite_r",
        label: "La résistance thermique R respecte le seuil de la fiche",
        type: "select",
        options: ["Oui — R ≥ 7 m².K/W (combles perdus)", "Oui — R ≥ 6 m².K/W (rampants / toiture terrasse)", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_installateur",
        label: "L'installateur est qualifié RGE",
        type: "select",
        options: ["Oui — qualification vérifiée", "Non — non qualifié", "En cours de vérification"],
        required: true,
      },
      { id: "date_installation_prevue", label: "Date d'installation prévue", type: "date", required: true },
      { id: "duree_vie_equipement", label: "Durée de vie conventionnelle", type: "text", placeholder: "30 ans (selon fiche BAR-EN-101)" },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse : confirmer que l'isolation est adaptée, le gain justifié, la conformité BAR-EN-101, émettre un avis favorable ou réserves.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAR-EN-102 — Isolation des murs ──────────────────────────

const QUESTIONNAIRE_102: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du logement, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire", type: "text", placeholder: "Nom et prénom", required: true },
      { id: "adresse", label: "Adresse du logement", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / entreprise RGE", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du logement",
    description: "Description du logement existant",
    fields: [
      {
        id: "type_logement",
        label: "Type de logement",
        type: "select",
        options: ["Maison individuelle", "Appartement", "Immeuble collectif"],
        required: true,
      },
      { id: "surface_habitable", label: "Surface habitable", type: "number", placeholder: "Ex: 120", unit: "m²", required: true },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1975", required: true },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
    ],
  },
  {
    titre: "3. Murs existants",
    description: "État actuel des murs avant travaux",
    fields: [
      {
        id: "type_mur",
        label: "Type de mur",
        type: "select",
        options: ["Béton banché", "Parpaing / agglo", "Brique creuse", "Brique pleine", "Pierre", "Ossature bois", "Autre"],
        required: true,
      },
      { id: "surface_murs", label: "Surface de murs à isoler", type: "number", placeholder: "Ex: 150", unit: "m²", required: true },
      {
        id: "isolation_actuelle",
        label: "Isolation actuelle des murs",
        type: "select",
        options: ["Aucune isolation", "Isolation insuffisante (< 50 mm)", "Isolation dégradée", "Isolation partielle"],
        required: true,
      },
      { id: "r_actuel", label: "Résistance thermique actuelle (si connue)", type: "number", placeholder: "Ex: 0.5", unit: "m².K/W" },
    ],
  },
  {
    titre: "4. Isolation projetée",
    description: "Caractéristiques de l'isolation mise en œuvre — R ≥ 3.7 m².K/W",
    fields: [
      {
        id: "technique_isolation",
        label: "Technique d'isolation",
        type: "select",
        options: ["ITE — Isolation Thermique par l'Extérieur", "ITI — Isolation Thermique par l'Intérieur"],
        required: true,
      },
      {
        id: "type_isolant",
        label: "Type d'isolant",
        type: "select",
        options: ["Laine de verre", "Laine de roche", "Polystyrène expansé (PSE)", "Polystyrène extrudé (XPS)", "Polyuréthane (PUR)", "Laine de bois", "Fibre de bois", "Ouate de cellulose", "Autre"],
        required: true,
      },
      {
        id: "r_thermique",
        label: "Résistance thermique R de l'isolant posé",
        type: "number",
        placeholder: "Ex: 3.7",
        unit: "m².K/W",
        required: true,
        help: "Exigence fiche BAR-EN-102 : R ≥ 3.7 m².K/W",
      },
      { id: "epaisseur", label: "Épaisseur de l'isolant", type: "number", placeholder: "Ex: 140", unit: "mm", required: true },
      { id: "lambda", label: "Conductivité thermique (λ)", type: "number", placeholder: "Ex: 0.038", unit: "W/(m.K)", required: true },
      { id: "marque_isolant", label: "Marque de l'isolant", type: "text", placeholder: "Ex: Isover, Rockwool, STO...", required: true },
      { id: "reference_isolant", label: "Référence produit", type: "text", placeholder: "Référence commerciale" },
      {
        id: "justification_choix",
        label: "Justification du choix de l'isolant et de la technique",
        type: "textarea",
        placeholder: "Expliquer le choix : ITE vs ITI, performance thermique, traitement des ponts thermiques, certification ACERMI, conformité BAR-EN-102...",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Estimation des économies d'énergie générées par l'isolation des murs",
    fields: [
      {
        id: "detail_calcul",
        label: "Détail du calcul de gain énergétique",
        type: "textarea",
        placeholder: "Détailler :\n1. Déperditions avant travaux par les murs (U avant × S × ΔT × DJU)\n2. Déperditions après travaux (U après × S × ΔT × DJU)\n3. Gain = Déperditions avant - Déperditions après\n4. Traitement des ponts thermiques si ITE",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul prouve le gain d'énergie",
      },
      { id: "gain_energetique_pct", label: "Gain énergétique", type: "number", placeholder: "Ex: 25", unit: "%", required: true },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 4", unit: "MWh/an", required: true },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 100", unit: "MWh cumac", help: "Selon la fiche standardisée BAR-EN-102" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 500", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 12000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 15", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAR-EN-102",
    fields: [
      {
        id: "conformite_r",
        label: "La résistance thermique R respecte le seuil de la fiche",
        type: "select",
        options: ["Oui — R ≥ 3.7 m².K/W", "Non — non conforme"],
        required: true,
        help: "Exigence fiche BAR-EN-102 : R ≥ 3.7 m².K/W",
      },
      {
        id: "conformite_installateur",
        label: "L'installateur est qualifié RGE",
        type: "select",
        options: ["Oui — qualification vérifiée", "Non — non qualifié", "En cours de vérification"],
        required: true,
      },
      { id: "date_installation_prevue", label: "Date d'installation prévue", type: "date", required: true },
      { id: "duree_vie_equipement", label: "Durée de vie conventionnelle", type: "text", placeholder: "30 ans (selon fiche BAR-EN-102)" },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse : confirmer que l'isolation est adaptée, le gain justifié, la conformité BAR-EN-102, émettre un avis favorable ou réserves.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAR-EN-103 — Isolation plancher ──────────────────────────

const QUESTIONNAIRE_103: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du logement, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire", type: "text", placeholder: "Nom et prénom", required: true },
      { id: "adresse", label: "Adresse du logement", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / entreprise RGE", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du logement",
    description: "Description du logement existant",
    fields: [
      {
        id: "type_logement",
        label: "Type de logement",
        type: "select",
        options: ["Maison individuelle", "Appartement", "Immeuble collectif"],
        required: true,
      },
      { id: "surface_habitable", label: "Surface habitable", type: "number", placeholder: "Ex: 120", unit: "m²", required: true },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1975", required: true },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
    ],
  },
  {
    titre: "3. Plancher existant",
    description: "État actuel du plancher bas avant travaux",
    fields: [
      {
        id: "type_plancher",
        label: "Type de plancher bas",
        type: "select",
        options: ["Sur vide sanitaire", "Sur sous-sol non chauffé", "Sur terre-plein"],
        required: true,
      },
      { id: "surface_plancher", label: "Surface de plancher à isoler", type: "number", placeholder: "Ex: 90", unit: "m²", required: true },
      {
        id: "isolation_actuelle",
        label: "Isolation actuelle du plancher",
        type: "select",
        options: ["Aucune isolation", "Isolation insuffisante", "Isolation dégradée", "Isolation partielle"],
        required: true,
      },
      { id: "r_actuel", label: "Résistance thermique actuelle (si connue)", type: "number", placeholder: "Ex: 0.5", unit: "m².K/W" },
    ],
  },
  {
    titre: "4. Isolation projetée",
    description: "Caractéristiques de l'isolation mise en œuvre — R ≥ 3 m².K/W",
    fields: [
      {
        id: "type_isolant",
        label: "Type d'isolant",
        type: "select",
        options: ["Laine de verre", "Laine de roche", "Polystyrène expansé (PSE)", "Polystyrène extrudé (XPS)", "Polyuréthane (PUR) projeté", "Polyuréthane (PUR) en panneaux", "Laine de bois", "Autre"],
        required: true,
      },
      {
        id: "r_thermique",
        label: "Résistance thermique R de l'isolant posé",
        type: "number",
        placeholder: "Ex: 3",
        unit: "m².K/W",
        required: true,
        help: "Exigence fiche BAR-EN-103 : R ≥ 3 m².K/W",
      },
      { id: "epaisseur", label: "Épaisseur de l'isolant", type: "number", placeholder: "Ex: 100", unit: "mm", required: true },
      { id: "lambda", label: "Conductivité thermique (λ)", type: "number", placeholder: "Ex: 0.032", unit: "W/(m.K)", required: true },
      { id: "marque_isolant", label: "Marque de l'isolant", type: "text", placeholder: "Ex: Isover, Knauf, Recticel...", required: true },
      { id: "reference_isolant", label: "Référence produit", type: "text", placeholder: "Référence commerciale" },
      {
        id: "justification_choix",
        label: "Justification du choix de l'isolant",
        type: "textarea",
        placeholder: "Expliquer le choix : performance thermique, adaptation au support (vide sanitaire / sous-sol), résistance à l'humidité, certification ACERMI, conformité BAR-EN-103...",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Estimation des économies d'énergie générées par l'isolation du plancher",
    fields: [
      {
        id: "detail_calcul",
        label: "Détail du calcul de gain énergétique",
        type: "textarea",
        placeholder: "Détailler :\n1. Déperditions avant travaux par le plancher (U avant × S × ΔT × DJU)\n2. Déperditions après travaux (U après × S × ΔT × DJU)\n3. Gain = Déperditions avant - Déperditions après\n4. Conversion en énergie finale selon le rendement du système de chauffage",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul prouve le gain d'énergie",
      },
      { id: "gain_energetique_pct", label: "Gain énergétique", type: "number", placeholder: "Ex: 15", unit: "%", required: true },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 3", unit: "MWh/an", required: true },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 80", unit: "MWh cumac", help: "Selon la fiche standardisée BAR-EN-103" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 350", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 3000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 6", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAR-EN-103",
    fields: [
      {
        id: "conformite_r",
        label: "La résistance thermique R respecte le seuil de la fiche",
        type: "select",
        options: ["Oui — R ≥ 3 m².K/W", "Non — non conforme"],
        required: true,
        help: "Exigence fiche BAR-EN-103 : R ≥ 3 m².K/W",
      },
      {
        id: "conformite_installateur",
        label: "L'installateur est qualifié RGE",
        type: "select",
        options: ["Oui — qualification vérifiée", "Non — non qualifié", "En cours de vérification"],
        required: true,
      },
      { id: "date_installation_prevue", label: "Date d'installation prévue", type: "date", required: true },
      { id: "duree_vie_equipement", label: "Durée de vie conventionnelle", type: "text", placeholder: "30 ans (selon fiche BAR-EN-103)" },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse : confirmer que l'isolation est adaptée, le gain justifié, la conformité BAR-EN-103, émettre un avis favorable ou réserves.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAT-TH-116 — GTB tertiaire ──────────────────────────────

const QUESTIONNAIRE_116: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du site, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire (raison sociale)", type: "text", placeholder: "Raison sociale", required: true },
      { id: "client_siret", label: "SIRET du bénéficiaire", type: "text", placeholder: "Ex: 123 456 789 00012" },
      { id: "adresse", label: "Adresse du site des travaux", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / intégrateur GTB", type: "text", placeholder: "Raison sociale de l'intégrateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
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
      { id: "surface_batiment", label: "Surface totale du bâtiment", type: "number", placeholder: "Ex: 3000", unit: "m²", required: true },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1995" },
      { id: "nb_niveaux", label: "Nombre de niveaux", type: "number", placeholder: "Ex: 4" },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
    ],
  },
  {
    titre: "3. Système de gestion existant",
    description: "État actuel de la gestion technique du bâtiment avant travaux",
    fields: [
      {
        id: "gtb_existante",
        label: "Système de gestion existant",
        type: "select",
        options: ["Aucune GTB", "GTB de classe D (non éligible)", "GTB de classe C", "Régulation locale uniquement", "Système obsolète à remplacer"],
        required: true,
      },
      {
        id: "regulation_chauffage_existante",
        label: "Régulation du chauffage existante",
        type: "select",
        options: ["Aucune régulation", "Régulation locale (thermostat simple)", "Programmation horaire", "Loi d'eau", "Autre"],
        required: true,
      },
      {
        id: "regulation_clim_existante",
        label: "Régulation de la climatisation existante",
        type: "select",
        options: ["Aucune climatisation", "Aucune régulation", "Régulation locale", "Programmation horaire", "Autre"],
      },
      {
        id: "gestion_eclairage_existante",
        label: "Gestion de l'éclairage existante",
        type: "select",
        options: ["Interrupteurs manuels uniquement", "Détecteurs de présence partiels", "Programmation horaire", "Aucune gestion centralisée"],
      },
    ],
  },
  {
    titre: "4. GTB projetée",
    description: "Système de GTB de classe A ou B selon la norme EN 15232",
    fields: [
      {
        id: "classe_gtb",
        label: "Classe de la GTB projetée (EN 15232)",
        type: "select",
        options: ["Classe A — Haute performance énergétique", "Classe B — Avancée"],
        required: true,
        help: "Exigence fiche BAT-TH-116 : GTB de classe A ou B selon EN 15232",
      },
      { id: "marque_gtb", label: "Marque du système GTB", type: "text", placeholder: "Ex: Siemens, Schneider, Honeywell, Sauter...", required: true },
      { id: "modele_gtb", label: "Modèle / plateforme logicielle", type: "text", placeholder: "Ex: Desigo CC, EcoStruxure...", required: true },
      {
        id: "fonc_chauffage",
        label: "Régulation chauffage",
        type: "select",
        options: ["Oui — régulation pièce par pièce avec programmation", "Oui — régulation par zone avec programmation", "Non inclus"],
        required: true,
      },
      {
        id: "fonc_climatisation",
        label: "Régulation climatisation",
        type: "select",
        options: ["Oui — régulation pièce par pièce avec programmation", "Oui — régulation par zone avec programmation", "Non applicable", "Non inclus"],
      },
      {
        id: "fonc_eclairage",
        label: "Gestion de l'éclairage",
        type: "select",
        options: ["Oui — détection de présence + gradation", "Oui — détection de présence", "Oui — programmation horaire", "Non inclus"],
      },
      {
        id: "fonc_ventilation",
        label: "Gestion de la ventilation",
        type: "select",
        options: ["Oui — régulation en fonction de l'occupation", "Oui — programmation horaire", "Non inclus"],
      },
      {
        id: "justification_choix",
        label: "Justification du choix du système GTB",
        type: "textarea",
        placeholder: "Expliquer le choix : classe A ou B justifiée, fonctionnalités couvertes, protocoles de communication, interopérabilité, conformité BAT-TH-116...",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Estimation des économies d'énergie générées par la GTB",
    fields: [
      {
        id: "detail_calcul",
        label: "Détail du calcul de gain énergétique",
        type: "textarea",
        placeholder: "Détailler :\n1. Consommations avant travaux par poste (chauffage, climatisation, éclairage, ventilation)\n2. Facteurs de réduction selon la classe GTB (EN 15232)\n3. Consommations après travaux estimées\n4. Gain global par poste et total",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul prouve le gain d'énergie — utiliser les facteurs de la norme EN 15232",
      },
      { id: "gain_energetique_pct", label: "Gain énergétique global", type: "number", placeholder: "Ex: 20", unit: "%", required: true },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 80", unit: "MWh/an", required: true },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 1500", unit: "MWh cumac", help: "Selon la fiche standardisée BAT-TH-116" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 12000", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 60000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 5", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAT-TH-116",
    fields: [
      {
        id: "conformite_classe",
        label: "La GTB est de classe A ou B selon EN 15232",
        type: "select",
        options: ["Oui — classe A", "Oui — classe B", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_fonctions",
        label: "Les fonctions de régulation couvrent les postes principaux (chauffage, clim, éclairage, ventilation)",
        type: "select",
        options: ["Oui — tous les postes couverts", "Partiellement — certains postes non couverts", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_installateur",
        label: "L'intégrateur est qualifié",
        type: "select",
        options: ["Oui — qualification vérifiée", "Non — non qualifié", "En cours de vérification"],
        required: true,
      },
      { id: "date_installation_prevue", label: "Date d'installation prévue", type: "date", required: true },
      { id: "duree_vie_equipement", label: "Durée de vie conventionnelle", type: "text", placeholder: "20 ans (selon fiche BAT-TH-116)" },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse : confirmer que la GTB est adaptée, le gain justifié, la conformité BAT-TH-116, émettre un avis favorable ou réserves.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAT-TH-142 — Déstratification d'air ──────────────────────

const QUESTIONNAIRE_142: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du site, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire (raison sociale)", type: "text", placeholder: "Raison sociale", required: true },
      { id: "client_siret", label: "SIRET du bénéficiaire", type: "text", placeholder: "Ex: 123 456 789 00012" },
      { id: "adresse", label: "Adresse du site des travaux", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du bâtiment et du local",
    description: "Description du bâtiment et des locaux concernés — hauteur minimale 5 m",
    fields: [
      {
        id: "type_batiment",
        label: "Type de bâtiment",
        type: "select",
        options: ["Entrepôt / Logistique", "Atelier industriel", "Hall d'exposition", "Grande surface commerciale", "Gymnase / Salle de sport", "Église / Lieu de culte", "Autre bâtiment tertiaire à grande hauteur"],
        required: true,
      },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
      { id: "surface_local", label: "Surface au sol du local", type: "number", placeholder: "Ex: 2000", unit: "m²", required: true },
      { id: "hauteur_sous_plafond", label: "Hauteur sous plafond / sous toiture", type: "number", placeholder: "Ex: 8", unit: "m", required: true, help: "Minimum 5 m exigé par la fiche BAT-TH-142" },
      { id: "volume_local", label: "Volume du local", type: "number", placeholder: "Ex: 16000", unit: "m³", help: "= Surface × hauteur — calculé auto si vide" },
      { id: "annee_construction", label: "Année de construction", type: "number", placeholder: "Ex: 1985" },
      {
        id: "type_chauffage",
        label: "Type de chauffage existant",
        type: "select",
        options: ["Aérothermes à gaz", "Aérothermes à eau chaude", "Tubes radiants gaz", "Panneaux radiants", "Chauffage soufflé (CTA)", "Plancher chauffant", "Autre"],
        required: true,
        help: "La fiche s'applique aux locaux chauffés par systèmes convectifs et/ou radiants",
      },
      { id: "puissance_chauffage", label: "Puissance de chauffage installée", type: "number", placeholder: "Ex: 250", unit: "kW", required: true },
      { id: "consigne_chauffage", label: "Température de consigne de chauffage", type: "number", placeholder: "Ex: 18", unit: "°C", required: true, help: "Doit être ≥ 15°C quand le local est occupé" },
      {
        id: "energie_chauffage",
        label: "Énergie de chauffage",
        type: "select",
        options: ["Gaz naturel", "Électricité", "Fioul", "GPL", "Réseau de chaleur", "Autre"],
        required: true,
      },
      {
        id: "isolation_toiture",
        label: "Isolation de la toiture",
        type: "select",
        options: ["Non isolée", "Faiblement isolée (R < 2)", "Moyennement isolée (R 2-4)", "Bien isolée (R > 4)", "Inconnu"],
      },
      { id: "conso_chauffage_annuelle", label: "Consommation annuelle de chauffage", type: "number", placeholder: "Ex: 350", unit: "MWh/an", required: true, help: "Sur la base des factures énergie" },
      { id: "source_conso", label: "Source de la donnée", type: "select", options: ["Factures énergétiques (3 ans)", "Compteur dédié", "Estimation par calcul", "DPE existant"], required: true },
      {
        id: "description_local",
        label: "Description complémentaire du local",
        type: "textarea",
        placeholder: "Dimensions, particularités (portes sectionnelles, ponts roulants, quais, zones d'activité…), problèmes de confort thermique observés…",
        colSpan: 2,
      },
    ],
  },
  {
    titre: "3. Stratification thermique existante",
    description: "Diagnostic de la stratification de l'air avant travaux",
    fields: [
      { id: "temp_sol_mesuree", label: "Température mesurée au sol (zone de travail)", type: "number", placeholder: "Ex: 14", unit: "°C", required: true },
      { id: "temp_mi_hauteur", label: "Température mesurée à mi-hauteur", type: "number", placeholder: "Ex: 18", unit: "°C" },
      { id: "temp_sous_toiture", label: "Température mesurée sous toiture", type: "number", placeholder: "Ex: 28", unit: "°C", required: true },
      { id: "gradient_thermique", label: "Gradient thermique mesuré (sol → plafond)", type: "number", placeholder: "Ex: 14", unit: "°C", required: true, help: "= T° sous toiture - T° au sol" },
      { id: "gradient_par_metre", label: "Gradient par mètre de hauteur", type: "number", placeholder: "Ex: 1.75", unit: "°C/m", help: "= Gradient total / hauteur" },
      {
        id: "conditions_mesure",
        label: "Conditions de mesure",
        type: "textarea",
        placeholder: "Date, heure, température extérieure, état du chauffage (régime établi / démarrage), instruments utilisés…",
        colSpan: 2,
        required: true,
      },
      {
        id: "probleme_confort",
        label: "Problèmes de confort identifiés",
        type: "textarea",
        placeholder: "Pieds froids, inconfort en zone basse, surchauffe en hauteur, sur-consommation de chauffage…",
        colSpan: 2,
      },
    ],
  },
  {
    titre: "4. Système de déstratification projeté",
    description: "Caractéristiques techniques des déstratificateurs",
    fields: [
      { id: "marque_destratificateur", label: "Marque", type: "text", placeholder: "Ex: Airius, Envira-Norte, Big Ass Fans…", required: true },
      { id: "modele_destratificateur", label: "Modèle / Référence", type: "text", placeholder: "Référence constructeur", required: true },
      { id: "nb_destratificateurs", label: "Nombre de déstratificateurs", type: "number", placeholder: "Ex: 8", required: true },
      { id: "puissance_unitaire", label: "Puissance électrique unitaire", type: "number", placeholder: "Ex: 0.03", unit: "kW", required: true },
      { id: "puissance_totale_destrat", label: "Puissance électrique totale", type: "number", placeholder: "Ex: 0.24", unit: "kW" },
      { id: "debit_air_unitaire", label: "Débit d'air unitaire", type: "number", placeholder: "Ex: 1200", unit: "m³/h" },
      { id: "hauteur_installation", label: "Hauteur d'installation", type: "number", placeholder: "Ex: 7.5", unit: "m", required: true, help: "Aspiration ≤ 1 m sous plafond exigée" },
      {
        id: "type_destratificateur",
        label: "Type de déstratificateur",
        type: "select",
        options: ["Déstratificateur hélicoïdal (colonne d'air)", "Brasseur d'air HVLS (grand diamètre)", "Ventilateur axial directionnel", "Déstratificateur à jet orientable", "Autre"],
        required: true,
      },
      {
        id: "regulation_destrat",
        label: "Régulation du système",
        type: "select",
        options: [
          "Sonde différentielle (sol / plafond) — automatique",
          "Thermostat simple + horloge",
          "Intégration GTB",
          "Fonctionnement continu en période de chauffe",
        ],
        required: true,
        help: "Surveillance continue de la température recommandée",
      },
      { id: "vitesse_air_sol", label: "Vitesse d'air au sol garantie", type: "text", placeholder: "Ex: 0.1 à 0.25 m/s", required: true, help: "Doit être comprise entre 0.1 et 0.3 m/s (confort)" },
      { id: "niveau_sonore", label: "Niveau sonore", type: "number", placeholder: "Ex: 38", unit: "dB(A)", help: "Maximum 45 dB(A) exigé" },
      {
        id: "justification_choix",
        label: "Justification du dimensionnement et du choix du matériel",
        type: "textarea",
        placeholder: "Expliquer :\n- Nombre d'appareils retenu par rapport au volume et à la hauteur\n- Couverture de la surface au sol\n- Compatibilité avec le type de chauffage existant\n- Respect des critères BAT-TH-142 (hauteur ≥ 5m, aspiration ≤ 1m du plafond, vitesse 0.1-0.3 m/s, bruit ≤ 45 dB)",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Estimation des économies de chauffage par réduction de la stratification",
    fields: [
      {
        id: "methode_calcul",
        label: "Méthode de calcul utilisée",
        type: "select",
        options: [
          "Méthode par gradient thermique (réduction du ΔT sol-plafond)",
          "Méthode forfaitaire (3% d'économie par °C de gradient réduit)",
          "Simulation logicielle (CFD ou thermique)",
          "Données constructeur + retour d'expérience",
        ],
        required: true,
      },
      { id: "gradient_avant", label: "Gradient thermique AVANT travaux", type: "number", placeholder: "Ex: 14", unit: "°C", required: true },
      { id: "gradient_apres", label: "Gradient thermique APRÈS travaux (estimé)", type: "number", placeholder: "Ex: 3", unit: "°C", required: true, help: "Objectif : réduction de 70-80% du gradient" },
      { id: "reduction_gradient", label: "Réduction du gradient", type: "number", placeholder: "Ex: 11", unit: "°C" },
      { id: "conso_chauffage_avant", label: "Consommation de chauffage AVANT travaux", type: "number", placeholder: "Ex: 350", unit: "MWh/an", required: true },
      { id: "conso_chauffage_apres", label: "Consommation de chauffage APRÈS travaux (estimée)", type: "number", placeholder: "Ex: 248", unit: "MWh/an", required: true },
      {
        id: "detail_calcul",
        label: "Détail du calcul de gain énergétique",
        type: "textarea",
        placeholder: "Détailler le calcul :\n1. Gradient thermique avant : X °C sur Y m → Z °C/m\n2. Gradient après (estimé) : X' °C → réduction de N °C\n3. Économie = 3% par °C de gradient réduit × conso avant\n   Ou : réduction de la consigne effective de ΔT °C\n4. Surconsommation des déstratificateurs à déduire\n5. Gain net = Économie brute - Conso déstratificateurs",
        colSpan: 2,
        required: true,
        help: "Règle usuelle : 3% d'économie de chauffage par °C de gradient réduit",
      },
      { id: "gain_energetique_pct", label: "Gain énergétique total", type: "number", placeholder: "Ex: 28", unit: "%", required: true },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 102", unit: "MWh/an", required: true },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 1200", unit: "MWh cumac", help: "Selon la fiche standardisée BAT-TH-142" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 8000", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 15000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 1.8", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAT-TH-142",
    fields: [
      {
        id: "conformite_hauteur",
        label: "La hauteur sous plafond est ≥ 5 m",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_aspiration",
        label: "L'aspiration est à ≤ 1 m du plafond",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_vitesse",
        label: "La vitesse d'air au sol est comprise entre 0.1 et 0.3 m/s",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_bruit",
        label: "Le niveau sonore est ≤ 45 dB(A)",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_consigne",
        label: "La consigne de chauffage est ≥ 15°C en occupation",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_usage",
        label: "Le local n'est pas un entrepôt logistique, réserve ou stockage",
        type: "select",
        options: ["Oui — local éligible", "Non — local exclu"],
        required: true,
        help: "Les entrepôts logistiques, réserves et stockages sont exclus de la fiche",
      },
      { id: "date_installation_prevue", label: "Date d'installation prévue", type: "date", required: true },
      { id: "duree_vie_equipement", label: "Durée de vie conventionnelle", type: "text", placeholder: "15 ans (selon fiche BAT-TH-142)" },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse : confirmer la conformité BAT-TH-142, le dimensionnement adapté, le gain énergétique justifié. Émettre un avis favorable ou réserves.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── BAT-TH-139 — Récupération de chaleur sur groupe froid ─────

const QUESTIONNAIRE_139: QuestionSection[] = [
  {
    titre: "1. Informations du projet",
    description: "Identification du site, du demandeur et du bureau d'étude",
    fields: [
      { id: "ref_projet", label: "Référence du projet", type: "text", placeholder: "Ex: ND-2026-XXX", required: true },
      { id: "date_visite", label: "Date de visite technique", type: "date", required: true },
      { id: "date_note", label: "Date de la note", type: "date", required: true },
      { id: "redacteur", label: "Rédacteur de la note", type: "text", placeholder: "Nom du technicien / ingénieur", required: true },
      { id: "client_nom", label: "Bénéficiaire (raison sociale)", type: "text", placeholder: "Raison sociale", required: true },
      { id: "client_siret", label: "SIRET du bénéficiaire", type: "text", placeholder: "Ex: 123 456 789 00012" },
      { id: "adresse", label: "Adresse du site des travaux", type: "text", placeholder: "Adresse complète", required: true, colSpan: 2 },
      { id: "installateur", label: "Installateur / entreprise", type: "text", placeholder: "Raison sociale de l'installateur", required: true },
      { id: "installateur_rge", label: "N° qualification RGE", type: "text", placeholder: "Ex: QUA-XXX-XXXX" },
    ],
  },
  {
    titre: "2. Caractéristiques du site et besoins thermiques",
    description: "Description du bâtiment et des besoins en chaleur",
    fields: [
      {
        id: "type_batiment",
        label: "Secteur d'activité",
        type: "select",
        options: ["Commerce / Grande distribution", "Hôtellerie / Restauration", "Santé / Hôpital", "Sport / Loisirs / Culture", "Transport / Logistique", "Industrie agroalimentaire", "Autre tertiaire"],
        required: true,
        help: "Le secteur influence le volume CEE cumac",
      },
      {
        id: "zone_climatique",
        label: "Zone climatique",
        type: "select",
        options: ["H1a — Nord", "H1b — Nord-Est", "H1c — Est", "H2a — Nord-Ouest", "H2b — Ouest", "H2c — Sud-Ouest", "H2d — Centre", "H3 — Méditerranée"],
        required: true,
      },
      { id: "surface_batiment", label: "Surface du bâtiment", type: "number", placeholder: "Ex: 5000", unit: "m²" },
      {
        id: "usage_chaleur_recuperee",
        label: "Usage de la chaleur récupérée",
        type: "select",
        options: ["Production d'eau chaude sanitaire (ECS)", "Préchauffage d'eau (process ou ECS)", "Chauffage de locaux (boucle d'eau)", "Dégivrage (chambres froides)", "Autre usage thermique sur site"],
        required: true,
        help: "La chaleur doit être utilisée sur site — pas pour le préchauffage d'air",
      },
      { id: "besoin_chaleur_annuel", label: "Besoin thermique annuel couvert par la récupération", type: "number", placeholder: "Ex: 200", unit: "MWh/an", required: true, help: "Besoin en chaleur qui sera satisfait par la récupération" },
      {
        id: "source_chaleur_actuelle",
        label: "Source de chaleur actuelle (avant récupération)",
        type: "select",
        options: ["Chaudière gaz", "Chaudière fioul", "Résistance électrique", "Réseau de chaleur", "Aucune (besoin non couvert)", "Autre"],
        required: true,
      },
      { id: "conso_chaleur_actuelle", label: "Consommation annuelle de la production de chaleur actuelle", type: "number", placeholder: "Ex: 230", unit: "MWh/an", help: "Énergie finale consommée par le générateur de chaleur remplacé" },
      {
        id: "description_besoins",
        label: "Description des besoins thermiques",
        type: "textarea",
        placeholder: "Décrire les besoins en chaleur : ECS pour vestiaires, préchauffage process, dégivrage chambres froides, profil de consommation saisonnier/constant…",
        colSpan: 2,
      },
    ],
  },
  {
    titre: "3. Installation frigorifique existante",
    description: "Groupe de production de froid sur lequel sera installée la récupération",
    fields: [
      {
        id: "type_groupe_froid",
        label: "Type de groupe de froid",
        type: "select",
        options: ["Groupe à condensation à air", "Groupe à condensation à eau", "Centrale frigorifique", "Groupe semi-hermétique", "Groupe à vis", "Autre"],
        required: true,
      },
      { id: "marque_groupe", label: "Marque du groupe froid", type: "text", placeholder: "Ex: Bitzer, Carrier, Copeland…", required: true },
      { id: "modele_groupe", label: "Modèle / référence", type: "text", placeholder: "Référence constructeur" },
      { id: "annee_installation", label: "Année d'installation", type: "number", placeholder: "Ex: 2015" },
      { id: "puissance_froid", label: "Puissance frigorifique nominale", type: "number", placeholder: "Ex: 250", unit: "kW", required: true },
      { id: "puissance_absorbee", label: "Puissance électrique absorbée", type: "number", placeholder: "Ex: 90", unit: "kW", required: true },
      {
        id: "fluide_frigorigene",
        label: "Fluide frigorigène",
        type: "select",
        options: ["R-404A", "R-407C", "R-134a", "R-410A", "R-448A", "R-449A", "R-744 (CO₂)", "R-290 (propane)", "R-717 (ammoniac)", "Autre"],
        required: true,
      },
      { id: "temp_evaporation", label: "Température d'évaporation", type: "number", placeholder: "Ex: -10", unit: "°C", required: true, help: "Doit être ≤ 18°C (condition d'éligibilité)" },
      { id: "temp_condensation", label: "Température de condensation", type: "number", placeholder: "Ex: 40", unit: "°C", required: true },
      { id: "heures_fonctionnement", label: "Heures de fonctionnement annuelles du groupe froid", type: "number", placeholder: "Ex: 6000", unit: "h/an", required: true },
      { id: "taux_charge_moyen", label: "Taux de charge moyen", type: "number", placeholder: "Ex: 65", unit: "%", required: true, help: "Taux de charge moyen annuel du compresseur" },
      {
        id: "description_installation",
        label: "Description de l'installation frigorifique",
        type: "textarea",
        placeholder: "Nombre d'évaporateurs, température des chambres froides, type de distribution, état général…",
        colSpan: 2,
      },
    ],
  },
  {
    titre: "4. Système de récupération de chaleur projeté",
    description: "Caractéristiques techniques du système de récupération",
    fields: [
      {
        id: "type_echangeur",
        label: "Type d'échangeur de récupération",
        type: "select",
        options: [
          "Désurchauffeur sur refoulement compresseur",
          "Échangeur sur circuit de condensation (sous-refroidisseur)",
          "Condenseur dédié récupération (double condenseur)",
          "Échangeur à plaques sur circuit secondaire",
          "Autre",
        ],
        required: true,
      },
      { id: "marque_echangeur", label: "Marque de l'échangeur", type: "text", placeholder: "Ex: Alfa Laval, SWEP, Danfoss…", required: true },
      { id: "modele_echangeur", label: "Modèle / Référence", type: "text", placeholder: "Référence constructeur", required: true },
      { id: "puissance_recuperation", label: "Puissance thermique de récupération", type: "number", placeholder: "Ex: 80", unit: "kW", required: true, help: "Puissance thermique récupérable à pleine charge" },
      { id: "temp_eau_entree", label: "Température d'eau entrée échangeur", type: "number", placeholder: "Ex: 15", unit: "°C" },
      { id: "temp_eau_sortie", label: "Température d'eau sortie échangeur", type: "number", placeholder: "Ex: 55", unit: "°C" },
      { id: "debit_eau", label: "Débit d'eau circuit secondaire", type: "number", placeholder: "Ex: 3.5", unit: "m³/h" },
      {
        id: "regulation_recup",
        label: "Régulation du système de récupération",
        type: "select",
        options: [
          "Vanne 3 voies thermostatique",
          "Régulation électronique (sonde T° + vanne motorisée)",
          "Intégration automate / GTB",
          "Autre",
        ],
        required: true,
      },
      { id: "ballon_stockage", label: "Ballon de stockage", type: "select", options: ["Oui", "Non"], required: true },
      { id: "volume_ballon", label: "Volume du ballon de stockage", type: "number", placeholder: "Ex: 1000", unit: "L" },
      { id: "compteur_energie", label: "Compteur d'énergie récupérée prévu", type: "select", options: ["Oui", "Non"], required: true, help: "Recommandé pour le suivi des performances" },
      {
        id: "justification_choix",
        label: "Justification du choix et du dimensionnement",
        type: "textarea",
        placeholder: "Expliquer :\n- Adéquation entre la chaleur récupérable et les besoins\n- Choix du point de récupération (désurchauffe vs condensation)\n- Dimensionnement de l'échangeur et du stockage\n- Impact sur le fonctionnement du groupe froid\n- Conformité à la fiche BAT-TH-139",
        colSpan: 2,
        required: true,
      },
    ],
  },
  {
    titre: "5. Calcul des gains énergétiques",
    description: "Bilan thermique de la récupération et preuve du gain d'énergie",
    fields: [
      {
        id: "methode_calcul",
        label: "Méthode de calcul utilisée",
        type: "select",
        options: [
          "Bilan thermique (puissance × heures × taux de charge × taux de récup.)",
          "Analyse sur données 24h représentatives (2 ans historique)",
          "Simulation logicielle (préciser)",
          "Données constructeur + historique consommation",
        ],
        required: true,
      },
      { id: "chaleur_rejetee_annuelle", label: "Chaleur totale rejetée par le groupe froid", type: "number", placeholder: "Ex: 520", unit: "MWh/an", required: true, help: "= (Pfroid + Pélec) × heures × taux charge / 1000" },
      { id: "taux_recuperation", label: "Taux de récupération effectif", type: "number", placeholder: "Ex: 35", unit: "%", required: true, help: "Part de la chaleur rejetée effectivement récupérée" },
      { id: "chaleur_recuperee_annuelle", label: "Chaleur récupérée annuellement", type: "number", placeholder: "Ex: 182", unit: "MWh/an", required: true },
      { id: "conso_evitee", label: "Consommation d'énergie évitée (production de chaleur substituée)", type: "number", placeholder: "Ex: 210", unit: "MWh/an", required: true, help: "= Chaleur récupérée / rendement du générateur remplacé" },
      {
        id: "detail_calcul",
        label: "Détail du calcul de gain énergétique",
        type: "textarea",
        placeholder: "Détailler :\n1. Chaleur totale au condenseur = (Pfroid + Pélec) × heures × taux charge\n2. Chaleur récupérable = Chaleur totale × taux de récupération\n3. Énergie évitée = Chaleur récupérée / rendement générateur existant\n4. Surcoût électrique pompe de circulation (à déduire si significatif)\n5. Gain net = Énergie évitée - surcoût auxiliaires",
        colSpan: 2,
        required: true,
        help: "Le détail du calcul prouve le gain d'énergie — pièce essentielle du dossier CEE",
      },
      { id: "gain_energetique_pct", label: "Gain énergétique", type: "number", placeholder: "Ex: 35", unit: "%", required: true },
      { id: "gain_energetique_mwh", label: "Gain annuel en énergie finale", type: "number", placeholder: "Ex: 182", unit: "MWh/an", required: true },
      { id: "reduction_co2", label: "Réduction des émissions CO₂", type: "number", placeholder: "Ex: 42", unit: "t CO₂/an" },
      { id: "economie_cee_cumac", label: "Volume CEE estimé", type: "number", placeholder: "Ex: 2500", unit: "MWh cumac", help: "Selon la fiche BAT-TH-139 et le secteur d'activité" },
      { id: "economie_euros", label: "Économie financière annuelle", type: "number", placeholder: "Ex: 18000", unit: "€/an" },
      { id: "cout_investissement", label: "Coût total de l'investissement", type: "number", placeholder: "Ex: 45000", unit: "€ HT" },
      { id: "duree_retour", label: "Temps de retour sur investissement", type: "number", placeholder: "Ex: 2.5", unit: "ans" },
    ],
  },
  {
    titre: "6. Conformité et conclusion",
    description: "Vérification de la conformité à la fiche CEE BAT-TH-139",
    fields: [
      {
        id: "conformite_evaporation",
        label: "La température d'évaporation est ≤ 18°C",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
        help: "Condition obligatoire de la fiche BAT-TH-139",
      },
      {
        id: "conformite_usage",
        label: "La chaleur récupérée est utilisée sur site (hors préchauffage d'air)",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
      },
      {
        id: "conformite_etude",
        label: "Une étude de dimensionnement préalable a été réalisée",
        type: "select",
        options: ["Oui — étude signée par un professionnel / BE", "Non"],
        required: true,
        help: "Étude obligatoire couvrant besoins thermiques, besoins froid, puissances, économies",
      },
      {
        id: "conformite_compression",
        label: "Le groupe de froid est à compression mécanique (circuit fermé)",
        type: "select",
        options: ["Oui — conforme", "Non — non conforme"],
        required: true,
        help: "Exclusion des PAC et des groupes de secours",
      },
      {
        id: "conformite_installateur",
        label: "L'installateur est qualifié",
        type: "select",
        options: ["Oui — qualification vérifiée", "Non — non qualifié", "En cours de vérification"],
        required: true,
      },
      { id: "date_installation_prevue", label: "Date d'installation prévue", type: "date", required: true },
      { id: "duree_vie_equipement", label: "Durée de vie conventionnelle", type: "text", placeholder: "14 ans (selon fiche BAT-TH-139)" },
      {
        id: "conclusion",
        label: "Conclusion et avis technique du bureau d'étude",
        type: "textarea",
        placeholder: "Synthèse : confirmer l'adéquation du dimensionnement, le gain énergétique justifié, la conformité BAT-TH-139. Émettre un avis favorable ou réserves.",
        colSpan: 2,
        required: true,
      },
    ],
  },
];

// ─── Constantes de calcul ───────────────────────────────────────

// DJU (base 18°C) et T° base par zone climatique
const ZONE_CLIMATIQUE_DATA: Record<string, { dju: number; tBase: number; bins: Array<{ tExt: number; heures: number }> }> = {
  "H1a — Nord":      { dju: 2800, tBase: -7,  bins: [{ tExt: -7, heures: 200 }, { tExt: -2, heures: 600 }, { tExt: 3, heures: 1200 }, { tExt: 8, heures: 1800 }, { tExt: 13, heures: 1500 }, { tExt: 18, heures: 1200 }, { tExt: 23, heures: 700 }, { tExt: 28, heures: 300 }, { tExt: 33, heures: 60 }] },
  "H1b — Nord-Est":  { dju: 2700, tBase: -9,  bins: [{ tExt: -9, heures: 150 }, { tExt: -4, heures: 500 }, { tExt: 1, heures: 1100 }, { tExt: 6, heures: 1700 }, { tExt: 11, heures: 1600 }, { tExt: 16, heures: 1300 }, { tExt: 21, heures: 900 }, { tExt: 26, heures: 400 }, { tExt: 31, heures: 100 }] },
  "H1c — Est":       { dju: 2600, tBase: -10, bins: [{ tExt: -10, heures: 120 }, { tExt: -5, heures: 450 }, { tExt: 0, heures: 1000 }, { tExt: 5, heures: 1600 }, { tExt: 10, heures: 1600 }, { tExt: 15, heures: 1400 }, { tExt: 20, heures: 1000 }, { tExt: 25, heures: 450 }, { tExt: 30, heures: 100 }] },
  "H2a — Nord-Ouest": { dju: 2400, tBase: -4, bins: [{ tExt: -4, heures: 150 }, { tExt: 1, heures: 700 }, { tExt: 6, heures: 1400 }, { tExt: 11, heures: 1800 }, { tExt: 16, heures: 1600 }, { tExt: 21, heures: 1200 }, { tExt: 26, heures: 550 }, { tExt: 31, heures: 100 }] },
  "H2b — Ouest":     { dju: 2200, tBase: -2,  bins: [{ tExt: -2, heures: 100 }, { tExt: 3, heures: 600 }, { tExt: 8, heures: 1300 }, { tExt: 13, heures: 1800 }, { tExt: 18, heures: 1700 }, { tExt: 23, heures: 1200 }, { tExt: 28, heures: 500 }, { tExt: 33, heures: 100 }] },
  "H2c — Sud-Ouest": { dju: 2000, tBase: -3,  bins: [{ tExt: -3, heures: 80 }, { tExt: 2, heures: 500 }, { tExt: 7, heures: 1200 }, { tExt: 12, heures: 1700 }, { tExt: 17, heures: 1700 }, { tExt: 22, heures: 1300 }, { tExt: 27, heures: 600 }, { tExt: 32, heures: 150 }] },
  "H2d — Centre":    { dju: 2300, tBase: -5,  bins: [{ tExt: -5, heures: 120 }, { tExt: 0, heures: 600 }, { tExt: 5, heures: 1300 }, { tExt: 10, heures: 1700 }, { tExt: 15, heures: 1600 }, { tExt: 20, heures: 1200 }, { tExt: 25, heures: 600 }, { tExt: 30, heures: 150 }] },
  "H3 — Méditerranée": { dju: 1400, tBase: 0, bins: [{ tExt: 0, heures: 50 }, { tExt: 5, heures: 400 }, { tExt: 10, heures: 1000 }, { tExt: 15, heures: 1600 }, { tExt: 20, heures: 1800 }, { tExt: 25, heures: 1500 }, { tExt: 30, heures: 700 }, { tExt: 35, heures: 200 }] },
};

// U-values forfaitaires (W/m².K) par type d'isolation
const U_MURS: Record<string, number> = {
  "Non isolés": 2.5,
  "Isolation intérieure (ITE)": 0.36,
  "Isolation extérieure (ITE)": 0.28,
  "Isolation répartie": 0.32,
  "Inconnu": 1.5,
};

const U_TOITURE: Record<string, number> = {
  "Non isolés": 3.0,
  "Combles perdus isolés": 0.20,
  "Rampants isolés": 0.28,
  "Toiture terrasse isolée": 0.25,
  "Inconnu": 1.5,
};

const U_VITRAGE: Record<string, number> = {
  "Simple vitrage": 5.8,
  "Double vitrage ancien (avant 2000)": 2.9,
  "Double vitrage performant": 1.4,
  "Triple vitrage": 0.8,
  "Mixte": 2.5,
};

// Rendement par type de générateur existant (PCI)
const RENDEMENTS_GENERATEURS: Record<string, number> = {
  "Chaudière standard": 0.80,
  "Chaudière basse température": 0.88,
  "Chaudière condensation": 0.95,
  "Convecteurs électriques": 1.0,
  "Radiateurs électriques": 1.0,
  "CTA avec batterie électrique": 1.0,
  "PAC existante (à remplacer)": 2.5,
  "Autre": 0.85,
};

// Facteur d'émission CO₂ (kg CO₂e / kWh EF)
// Sources : arrêté DPE 31 mars 2021 (art. R.126-17), Base Carbone ADEME 2024.
const FACTEUR_CO2: Record<string, number> = {
  "Gaz naturel": 0.227,        // Base Carbone (amont + combustion)
  "Fioul domestique": 0.324,   // Arrêté DPE 2021
  "Charbon": 0.385,            // Base Carbone
  "Électricité (effet Joule)": 0.079, // Arrêté DPE 2021 — usage chauffage (ex 0.0569 obsolète)
  "Électricité (usage ECS)": 0.065,   // Arrêté DPE 2021 — usage ECS
  "Électricité (mix moyen)": 0.060,   // Base Carbone ADEME 2024 (mix annuel)
  "GPL": 0.272,                // Base Carbone
  "Réseau de chaleur": 0.180,  // Moyenne France (à ajuster selon réseau — arrêté DPE réseaux)
  "Bois": 0.030,               // Base Carbone (combustion nette, biogène court)
  "Autre": 0.200,
};

// Facteur CO₂ de l'électricité pour les calculs post-travaux (PAC, récup).
// = arrêté DPE 2021 usage chauffage.
const FACTEUR_CO2_ELEC_CHAUFFAGE = 0.079;

// Prix moyens HT tertiaire France 2025-2026 (€/kWh EF)
// Sources : Pégase SDES, observatoire CEREN, FNCCR.
const PRIX_ELEC_KWH = 0.18;   // tertiaire moyen (fourchette 0.15–0.22)
const PRIX_GAZ_KWH  = 0.09;   // gaz naturel B2I (fourchette 0.07–0.12)
const PRIX_FIOUL_KWH = 0.11;  // fioul domestique
const PRIX_PROPANE_KWH = 0.14;
const PRIX_RESEAU_CHALEUR_KWH = 0.10;

function prixEnergie(source: string): number {
  const s = source.toLowerCase();
  if (s.includes("lectric")) return PRIX_ELEC_KWH;
  if (s.includes("fioul")) return PRIX_FIOUL_KWH;
  if (s.includes("propane") || s.includes("gpl")) return PRIX_PROPANE_KWH;
  if (s.includes("seau de chaleur")) return PRIX_RESEAU_CHALEUR_KWH;
  if (s.includes("gaz")) return PRIX_GAZ_KWH;
  return PRIX_GAZ_KWH; // défaut gaz
}

// ─── Calculs BAT-TH-134 — HP Flottante ─────────────────────────

interface Calcul134Result {
  copMoyenAvant: number;
  copMoyenApres: number;
  consoApres: number;
  gainMwh: number;
  gainPct: number;
  economiEuros: number;
  dureeRetour: number | null;
  detailMethode: string;
}

function calculer134(v: FormValues): Calcul134Result | null {
  const zone = v.zone_climatique;
  const zoneData = zone ? ZONE_CLIMATIQUE_DATA[zone] : null;
  if (!zoneData) return null;

  // Récupérer les données des groupes froids
  const nbGroupes = parseInt(v.nb_groupes_multi || "1", 10) || 1;
  let puissanceFroidTotale = 0;
  let puissanceAbsorbeeTotale = 0;
  let tCondFixeMoyenne = 0;
  let countGroupes = 0;

  for (let i = 1; i <= nbGroupes; i++) {
    const pf = parseFloat(v[`puissance_froid_${i}`] || "0");
    const pa = parseFloat(v[`puissance_absorbee_${i}`] || "0");
    const tc = parseFloat(v[`temp_condensation_fixe_${i}`] || "0");
    if (pf > 0 && pa > 0) {
      puissanceFroidTotale += pf;
      puissanceAbsorbeeTotale += pa;
      tCondFixeMoyenne += tc * pf; // pondéré par puissance
      countGroupes++;
    }
  }

  if (countGroupes === 0 || puissanceFroidTotale === 0 || puissanceAbsorbeeTotale === 0) return null;
  tCondFixeMoyenne /= puissanceFroidTotale;

  const consoAvant = parseFloat(v.conso_electrique_avant || "0");
  if (consoAvant <= 0) return null;

  const tCondMin = parseFloat(v.temp_condensation_min || "25");
  const ecartApproche = parseFloat(v.ecart_approche || "10");
  const heuresFonctionnement = parseFloat(v.heures_fonctionnement || "6500");

  // Températures d'évaporation
  const tEvapPos = parseFloat(v.temp_evaporation_pos || "-8");
  const tEvapNeg = parseFloat(v.temp_evaporation_neg || "-30");
  const regime = v.regime_froid || "Froid positif uniquement (> 0°C)";

  let tEvapMoyen: number;
  if (regime.includes("négatif uniquement")) {
    tEvapMoyen = tEvapNeg;
  } else if (regime.includes("positif + négatif")) {
    tEvapMoyen = (tEvapPos + tEvapNeg) / 2;
  } else {
    tEvapMoyen = tEvapPos;
  }

  // COP moyen existant (réel mesuré)
  const copMoyenAvant = puissanceFroidTotale / puissanceAbsorbeeTotale;

  // Calcul par méthode bin — COP pondéré avec HP flottante
  const etaCarnot = copMoyenAvant / ((273.15 + tEvapMoyen) / (tCondFixeMoyenne - tEvapMoyen));
  let heuresPonderees = 0;
  let copPondereApres = 0;

  const detailBins: string[] = [];

  for (const bin of zoneData.bins) {
    const heuresBin = bin.heures * (heuresFonctionnement / 8760);
    if (heuresBin <= 0) continue;

    // T° condensation flottante = max(T_ext + écart, T_cond_min)
    const tCondFlottante = Math.max(bin.tExt + ecartApproche, tCondMin);

    // COP pour ce bin (basé sur Carnot corrigé)
    const deltaT = tCondFlottante - tEvapMoyen;
    if (deltaT <= 0) continue;
    const copBin = etaCarnot * (273.15 + tEvapMoyen) / deltaT;

    copPondereApres += copBin * heuresBin;
    heuresPonderees += heuresBin;

    detailBins.push(`T°ext=${bin.tExt}°C → T°cond=${tCondFlottante.toFixed(1)}°C → COP=${copBin.toFixed(2)} (${Math.round(heuresBin)}h)`);
  }

  if (heuresPonderees === 0) return null;
  const copMoyenApres = copPondereApres / heuresPonderees;

  // Gains
  const ratioGain = 1 - (copMoyenAvant / copMoyenApres);
  const consoApres = consoAvant * (1 - ratioGain);
  const gainMwh = consoAvant - consoApres;
  const gainPct = ratioGain * 100;
  const economiEuros = gainMwh * 1000 * PRIX_ELEC_KWH;

  const coutInvest = parseFloat(v.cout_investissement || "0");
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const detailMethode = [
    `Méthode bin — Zone ${zone}`,
    `${countGroupes} groupe(s) froid · Puissance totale: ${puissanceFroidTotale} kW`,
    `COP moyen AVANT (HP fixe ${tCondFixeMoyenne.toFixed(1)}°C): ${copMoyenAvant.toFixed(2)}`,
    `Écart d'approche: ${ecartApproche} K · T° condensation min: ${tCondMin}°C`,
    `Rendement Carnot corrigé η = ${(etaCarnot * 100).toFixed(1)}%`,
    "",
    "Détail par tranche de température:",
    ...detailBins,
    "",
    `COP moyen APRÈS (HP flottante): ${copMoyenApres.toFixed(2)}`,
    `Gain = 1 - (${copMoyenAvant.toFixed(2)} / ${copMoyenApres.toFixed(2)}) = ${gainPct.toFixed(1)}%`,
    `Conso avant: ${consoAvant} MWh/an → Conso après: ${consoApres.toFixed(1)} MWh/an`,
    `Économie: ${gainMwh.toFixed(1)} MWh/an · ${Math.round(economiEuros)} €/an`,
  ].join("\n");

  return { copMoyenAvant, copMoyenApres, consoApres, gainMwh, gainPct, economiEuros, dureeRetour, detailMethode };
}

// ─── Calculs BAT-TH-163 — PAC air/eau ──────────────────────────

interface Calcul163Result {
  volumeChauffe: number;
  deperditionsParois: number;
  deperditionsVentilation: number;
  deperditionsTotales: number;
  coeffG: number;
  deperditionsParM2: number;
  besoinChauffage: number;
  consoAvant: number;
  consoApres: number;
  gainMwh: number;
  gainPct: number;
  reductionCo2: number;
  economiEuros: number;
  dureeRetour: number | null;
  detailMethode: string;
}

function calculer163(v: FormValues): Calcul163Result | null {
  const surfaceChauffee = parseFloat(v.surface_chauffee || "0");
  const zone = v.zone_climatique;
  const zoneData = zone ? ZONE_CLIMATIQUE_DATA[zone] : null;
  if (!zoneData || surfaceChauffee <= 0) return null;

  const tempBase = parseFloat(v.temp_base || String(zoneData.tBase));
  const tempInt = parseFloat(v.temp_interieure || "19");
  const deltaT = tempInt - tempBase;
  if (deltaT <= 0) return null;

  const nbNiveaux = parseFloat(v.nb_niveaux || "1") || 1;
  const hsp = parseFloat(v.hauteur_sous_plafond || "3");
  const volumeChauffe = parseFloat(v.volume_chauffe || "0") || (surfaceChauffee * hsp);

  // Surfaces d'enveloppe
  const surfaceToiture = parseFloat(v.surface_toiture || String(surfaceChauffee / nbNiveaux));
  const surfacePlancher = surfaceToiture;
  const perimetre = Math.sqrt(surfacePlancher) * 4; // approximation carré
  const hauteurTotale = hsp * nbNiveaux;
  const surfaceMursExt = parseFloat(v.surface_murs_ext || String(perimetre * hauteurTotale));
  const tauxVitrage = parseFloat(v.taux_vitrage || "25") / 100;
  const surfaceVitree = surfaceMursExt * tauxVitrage;
  const surfaceMursOpaques = surfaceMursExt - surfaceVitree;

  // U-values
  const uMur = U_MURS[v.isolation_murs || "Inconnu"] || 1.5;
  const uToiture = U_TOITURE[v.isolation_toiture || "Inconnu"] || 1.5;
  const uVitrage = U_VITRAGE[v.type_vitrage || "Mixte"] || 2.5;
  const uPlancher = 0.8; // valeur forfaitaire

  // Déperditions par les parois (W)
  const depMurs = surfaceMursOpaques * uMur * deltaT;
  const depToiture = surfaceToiture * uToiture * deltaT;
  const depVitrage = surfaceVitree * uVitrage * deltaT;
  const depPlancher = surfacePlancher * uPlancher * deltaT * 0.6; // facteur sol
  const deperditionsParois = (depMurs + depToiture + depVitrage + depPlancher) / 1000; // kW

  // Déperditions par renouvellement d'air
  const tauxRenouv = parseFloat(v.taux_renouvellement_air || "0.7"); // vol/h
  const depVentilation = (0.34 * tauxRenouv * volumeChauffe * deltaT) / 1000; // kW

  // Ponts thermiques forfait +15%
  const deperditionsTotales = (deperditionsParois + depVentilation) * 1.15;
  const coeffG = (deperditionsTotales * 1000) / (volumeChauffe * deltaT);
  const deperditionsParM2 = (deperditionsTotales * 1000) / surfaceChauffee;

  // Besoins bruts de chauffage (MWh/an) — intégrale G×V sur DJU base 18°C.
  // Formule : Besoin_brut = G × V × DJU × 24 h/jour / 1e6 → MWh/an
  const besoinBrut = (coeffG * volumeChauffe * zoneData.dju * 24) / 1e6;

  // Prise en compte des apports gratuits (solaires + internes).
  // Méthode simplifiée inspirée de EN ISO 52016 : un coefficient d'utilisation
  // des apports γ·η est appliqué.
  //  - tertiaire bureaux : coef apports ~ 0.15 (15 % des besoins couverts)
  //  - résidentiel peu occupé : coef ~ 0.10
  //  - logement occupé + sud : coef ~ 0.20
  // L'utilisateur peut saisir "part_apports_gratuits" en %, sinon défaut 15 %.
  const partApports = parseFloat(v.part_apports_gratuits || "15") / 100;
  const coefApports = Math.max(0, Math.min(0.35, partApports)); // borné 0–35%
  const besoinChauffage = besoinBrut * (1 - coefApports);

  // Conso avant
  const rendExistant = RENDEMENTS_GENERATEURS[v.type_generateur_existant || "Autre"] || 0.85;
  const consoAvant = besoinChauffage / rendExistant;

  // Conso après (PAC)
  const scop = parseFloat(v.scop || "0");
  const tauxCouverture = parseFloat(v.taux_couverture || "90") / 100;
  if (scop <= 0) return null;

  const consoApres = (besoinChauffage * tauxCouverture) / scop + (besoinChauffage * (1 - tauxCouverture)) / rendExistant;

  // Gains
  const gainMwh = consoAvant - consoApres;
  const gainPct = (gainMwh / consoAvant) * 100;

  // CO₂ — arrêté DPE 2021 (chauffage) + Base Carbone ADEME 2024
  const energieExistante = v.energie_existante || "Gaz naturel";
  const facteurCo2Avant = FACTEUR_CO2[energieExistante] || 0.200;
  const facteurCo2Apres = FACTEUR_CO2_ELEC_CHAUFFAGE; // 0.079 kgCO₂e/kWh
  const reductionCo2 = consoAvant * facteurCo2Avant - consoApres * facteurCo2Apres;

  // Coûts — prix spécifiques par énergie (avant) et élec (après)
  const prixAvant = prixEnergie(energieExistante);
  const coutAvant = consoAvant * 1000 * prixAvant;
  const coutApres = consoApres * 1000 * PRIX_ELEC_KWH;
  const economiEuros = coutAvant - coutApres;
  const coutInvest = parseFloat(v.cout_investissement || "0");
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const detailMethode = [
    `Méthode G × V × DJU avec apports gratuits — Zone ${zone}`,
    `DJU base 18°C: ${zoneData.dju} · T° base: ${tempBase}°C · T° int: ${tempInt}°C · ΔT dim.: ${deltaT}K`,
    "",
    "Déperditions par les parois:",
    `  Murs (${surfaceMursOpaques.toFixed(0)} m² × U=${uMur} W/m².K): ${(depMurs / 1000).toFixed(1)} kW`,
    `  Toiture (${surfaceToiture.toFixed(0)} m² × U=${uToiture} W/m².K): ${(depToiture / 1000).toFixed(1)} kW`,
    `  Vitrages (${surfaceVitree.toFixed(0)} m² × U=${uVitrage} W/m².K): ${(depVitrage / 1000).toFixed(1)} kW`,
    `  Plancher (${surfacePlancher.toFixed(0)} m² × U=${uPlancher} × 0.6): ${(depPlancher / 1000).toFixed(1)} kW`,
    `  Sous-total parois: ${deperditionsParois.toFixed(1)} kW`,
    "",
    `Déperditions par ventilation (${tauxRenouv} vol/h × ${volumeChauffe.toFixed(0)} m³): ${depVentilation.toFixed(1)} kW`,
    `Ponts thermiques forfait +15%`,
    `Déperditions totales: ${deperditionsTotales.toFixed(1)} kW · G = ${coeffG.toFixed(2)} W/m³.K`,
    "",
    `Besoins BRUTS chauffage: G × V × DJU × 24 / 10⁶ = ${besoinBrut.toFixed(1)} MWh/an`,
    `Apports gratuits (solaire + internes) retenus: ${(coefApports * 100).toFixed(0)} %`,
    `Besoins NETS = ${besoinBrut.toFixed(1)} × (1 − ${coefApports.toFixed(2)}) = ${besoinChauffage.toFixed(1)} MWh/an`,
    `Conso AVANT: ${besoinChauffage.toFixed(1)} / η${rendExistant.toFixed(2)} = ${consoAvant.toFixed(1)} MWh/an`,
    `Conso APRÈS: (${(besoinChauffage * tauxCouverture).toFixed(1)} / SCOP ${scop}) + appoint = ${consoApres.toFixed(1)} MWh/an`,
    `Gain énergétique: ${gainMwh.toFixed(1)} MWh/an (${gainPct.toFixed(1)}%)`,
    `Réduction CO₂: ${reductionCo2.toFixed(1)} tCO₂e/an (facteurs : ${facteurCo2Avant} → ${facteurCo2Apres} kgCO₂e/kWh)`,
    `Économie : ${Math.round(coutAvant)} € (avant) − ${Math.round(coutApres)} € (après) = ${Math.round(economiEuros)} €/an`,
  ].join("\n");

  return {
    volumeChauffe, deperditionsParois, deperditionsVentilation: depVentilation,
    deperditionsTotales, coeffG, deperditionsParM2, besoinChauffage,
    consoAvant, consoApres, gainMwh, gainPct, reductionCo2, economiEuros, dureeRetour, detailMethode,
  };
}

// ─── Calculs BAT-TH-142 — Déstratification ─────────────────────

interface Calcul142Result {
  reductionGradient: number;
  gainBrutPct: number;
  consoDestrat: number;
  consoApres: number;
  gainNetMwh: number;
  gainNetPct: number;
  economiEuros: number;
  dureeRetour: number | null;
  detailMethode: string;
}

function calculer142(v: FormValues): Calcul142Result | null {
  const gradientAvant = parseFloat(v.gradient_avant || v.gradient_thermique || "0");
  const gradientApres = parseFloat(v.gradient_apres || "0");
  const consoAvant = parseFloat(v.conso_chauffage_avant || v.conso_chauffage_annuelle || "0");
  if (gradientAvant <= 0 || consoAvant <= 0) return null;

  const reductionGradient = gradientAvant - gradientApres;
  if (reductionGradient <= 0) return null;

  // Règle usuelle : 3% d'économie de chauffage par °C de gradient réduit
  const gainBrutPct = reductionGradient * 3;
  const economieBrute = consoAvant * (gainBrutPct / 100);

  // Surconsommation des déstratificateurs
  const nbDestrat = parseInt(v.nb_destratificateurs || "0", 10);
  const puissanceUnit = parseFloat(v.puissance_unitaire || "0");
  const heuresFonctionnement = parseFloat(v.heures_fonctionnement_destrat || "4000"); // ~saison de chauffe
  const consoDestrat = (nbDestrat * puissanceUnit * heuresFonctionnement) / 1000; // MWh

  const gainNetMwh = economieBrute - consoDestrat;
  const consoApres = consoAvant - gainNetMwh;
  const gainNetPct = (gainNetMwh / consoAvant) * 100;

  // Économie financière — prix par vecteur énergétique (réel 2025-2026)
  const prix = prixEnergie(v.energie_chauffage || "Gaz");
  const economiEuros = gainNetMwh * 1000 * prix;

  const coutInvest = parseFloat(v.cout_investissement || "0");
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const hauteur = parseFloat(v.hauteur_sous_plafond || "0");
  const detailMethode = [
    `Méthode par gradient thermique — Règle des 3%/°C`,
    `Hauteur sous plafond: ${hauteur} m · Surface: ${v.surface_local || "?"} m²`,
    "",
    "Diagnostic de stratification:",
    `  T° au sol: ${v.temp_sol_mesuree || "?"}°C · T° sous toiture: ${v.temp_sous_toiture || "?"}°C`,
    `  Gradient AVANT: ${gradientAvant.toFixed(1)}°C (${(gradientAvant / hauteur).toFixed(2)} °C/m)`,
    `  Gradient APRÈS (estimé): ${gradientApres.toFixed(1)}°C`,
    `  Réduction: ${reductionGradient.toFixed(1)}°C`,
    "",
    "Calcul du gain:",
    `  Économie brute = ${reductionGradient.toFixed(1)}°C × 3%/°C = ${gainBrutPct.toFixed(1)}%`,
    `  Économie brute = ${consoAvant.toFixed(1)} × ${(gainBrutPct / 100).toFixed(3)} = ${economieBrute.toFixed(1)} MWh/an`,
    `  Conso déstratificateurs = ${nbDestrat} × ${puissanceUnit} kW × ${heuresFonctionnement}h / 1000 = ${consoDestrat.toFixed(2)} MWh/an`,
    `  Gain NET = ${economieBrute.toFixed(1)} - ${consoDestrat.toFixed(2)} = ${gainNetMwh.toFixed(1)} MWh/an (${gainNetPct.toFixed(1)}%)`,
    "",
    `Conso AVANT: ${consoAvant.toFixed(1)} MWh/an → Conso APRÈS: ${consoApres.toFixed(1)} MWh/an`,
    `Économie: ${Math.round(economiEuros)} €/an`,
  ].join("\n");

  return { reductionGradient, gainBrutPct, consoDestrat, consoApres, gainNetMwh, gainNetPct, economiEuros, dureeRetour, detailMethode };
}

// ─── Calculs BAT-TH-139 — Récupération chaleur ─────────────────

interface Calcul139Result {
  chaleurRejetee: number;
  chaleurRecuperee: number;
  consoEvitee: number;
  gainPct: number;
  reductionCo2: number;
  economiEuros: number;
  dureeRetour: number | null;
  detailMethode: string;
}

function calculer139(v: FormValues): Calcul139Result | null {
  const puissanceFroid = parseFloat(v.puissance_froid || "0");
  const puissanceAbsorbee = parseFloat(v.puissance_absorbee || "0");
  const heures = parseFloat(v.heures_fonctionnement || "0");
  const tauxCharge = parseFloat(v.taux_charge_moyen || "0") / 100;
  const tauxRecup = parseFloat(v.taux_recuperation || "0") / 100;

  if (puissanceFroid <= 0 || puissanceAbsorbee <= 0 || heures <= 0 || tauxCharge <= 0 || tauxRecup <= 0) return null;

  // Chaleur totale rejetée au condenseur = (Pfroid + Pélec) × heures × taux charge
  const chaleurRejetee = ((puissanceFroid + puissanceAbsorbee) * heures * tauxCharge) / 1000; // MWh
  const chaleurRecuperee = chaleurRejetee * tauxRecup;

  // Énergie évitée = chaleur récupérée / rendement du générateur remplacé
  const sourceActuelle = v.source_chaleur_actuelle || "Chaudière gaz";
  let rendementRemplace = 0.90; // chaudière gaz par défaut
  if (sourceActuelle.includes("fioul")) rendementRemplace = 0.85;
  else if (sourceActuelle.includes("lectrique")) rendementRemplace = 1.0;
  else if (sourceActuelle.includes("seau de chaleur")) rendementRemplace = 0.95;
  const consoEvitee = chaleurRecuperee / rendementRemplace;

  // Gain en %
  const consoActuelle = parseFloat(v.conso_chaleur_actuelle || "0");
  const gainPct = consoActuelle > 0 ? (consoEvitee / consoActuelle) * 100 : (chaleurRecuperee > 0 ? 100 : 0);

  // CO₂ — arrêté DPE 2021 + Base Carbone ADEME 2024
  let facteurCo2 = FACTEUR_CO2["Gaz naturel"]; // 0.227
  if (sourceActuelle.includes("fioul")) facteurCo2 = FACTEUR_CO2["Fioul domestique"]; // 0.324
  else if (sourceActuelle.includes("lectrique")) facteurCo2 = FACTEUR_CO2_ELEC_CHAUFFAGE; // 0.079
  else if (sourceActuelle.includes("seau de chaleur")) facteurCo2 = FACTEUR_CO2["Réseau de chaleur"]; // 0.180
  const reductionCo2 = consoEvitee * facteurCo2; // tCO₂e/an (consoEvitee en MWh × kgCO₂/kWh → kg/1000=t)

  // Économie financière — prix par vecteur énergétique (réel 2025-2026)
  const prix = prixEnergie(sourceActuelle);
  const economiEuros = consoEvitee * 1000 * prix;

  const coutInvest = parseFloat(v.cout_investissement || "0");
  const dureeRetour = coutInvest > 0 && economiEuros > 0 ? coutInvest / economiEuros : null;

  const detailMethode = [
    `Bilan thermique de récupération de chaleur sur groupe froid`,
    `Groupe froid: ${v.marque_groupe || "?"} · Pfroid = ${puissanceFroid} kW · Pélec = ${puissanceAbsorbee} kW`,
    `Fonctionnement: ${heures}h/an · Taux de charge moyen: ${(tauxCharge * 100).toFixed(0)}%`,
    "",
    "Calcul de la chaleur disponible:",
    `  Chaleur au condenseur = (${puissanceFroid} + ${puissanceAbsorbee}) × ${heures}h × ${(tauxCharge * 100).toFixed(0)}% / 1000`,
    `  = ${chaleurRejetee.toFixed(1)} MWh/an`,
    "",
    "Chaleur récupérée:",
    `  Taux de récupération: ${(tauxRecup * 100).toFixed(0)}%`,
    `  Chaleur récupérée = ${chaleurRejetee.toFixed(1)} × ${(tauxRecup * 100).toFixed(0)}% = ${chaleurRecuperee.toFixed(1)} MWh/an`,
    "",
    "Énergie substituée:",
    `  Source actuelle: ${sourceActuelle} (η = ${(rendementRemplace * 100).toFixed(0)}%)`,
    `  Conso évitée = ${chaleurRecuperee.toFixed(1)} / ${rendementRemplace.toFixed(2)} = ${consoEvitee.toFixed(1)} MWh/an`,
    "",
    `Réduction CO₂: ${reductionCo2.toFixed(1)} t/an`,
    `Économie: ${consoEvitee.toFixed(1)} MWh/an · ${Math.round(economiEuros)} €/an`,
  ].join("\n");

  return { chaleurRejetee, chaleurRecuperee, consoEvitee, gainPct, reductionCo2, economiEuros, dureeRetour, detailMethode };
}

// ─── Textes par défaut pour 3 champs rédactionnels ──────────────
// Pré-remplissage générique cohérent, librement éditable par l'utilisateur.

function getDefaultTexts(ficheId: FicheId): {
  justification_choix: string;
  detail_calcul: string;
  conclusion: string;
} {
  const fiche = FICHES.find((f) => f.id === ficheId);
  const operation = fiche ? `${fiche.titre} — ${fiche.sousTitre}` : "l'opération";
  const shortOp = fiche ? fiche.sousTitre : "l'opération projetée";

  const justification_choix = `Le matériel retenu pour l'opération « ${shortOp} » a été sélectionné au regard des critères suivants :

• Conformité stricte aux exigences techniques de la fiche d'opération standardisée ${fiche?.titre ?? "applicable"} (performances minimales, marquage CE, certifications).
• Adéquation du dimensionnement aux besoins réels du bâtiment identifiés en phase d'audit (déperditions calculées, puissance utile, profils d'appel de puissance).
• Pérennité et qualité de la filière d'installation : équipement disponible auprès de fabricants reconnus, pièces détachées garanties, réseau SAV structuré.
• Optimisation du coût global sur la durée de vie (CAPEX + OPEX + maintenance), en cohérence avec le budget de l'opération et les aides mobilisables.

Les références exactes du matériel, ses caractéristiques techniques et les fiches constructeur sont fournies en annexe du présent dossier.`;

  const detail_calcul = `Méthode de calcul du gain d'énergie pour l'opération « ${shortOp} » :

1. Données d'entrée
   – Caractéristiques du bâtiment : surface chauffée/refroidie, zone climatique, DJU de référence.
   – Situation initiale : rendement ou performance saisonnière du système existant, consommations mesurées (factures) ou estimées (DPE, audit).
   – Situation projetée : performances contractuelles de l'équipement retenu (SCOP, SEER, coefficient U après travaux, R des isolants, etc.).

2. Méthodologie
   Le gain énergétique est établi par différence entre la consommation de référence (situation initiale) et la consommation prévisionnelle après mise en œuvre des travaux, selon la méthode de la fiche ${fiche?.titre ?? "CEE applicable"} et les normes en vigueur (EN 15232 / EN 15316 / RE2020 selon les cas).

3. Résultats
   – Consommation avant travaux : [à compléter] kWh EF/an
   – Consommation après travaux : [à compléter] kWh EF/an
   – Gain annuel en énergie finale : [à compléter] MWh/an soit [à compléter] % d'économie.

4. Hypothèses et limites
   – Usage normal des occupants, sans modification des consignes de confort.
   – DJU moyen décennal retenu pour la zone climatique concernée.
   – Conversion énergie finale ↔ énergie primaire selon les coefficients réglementaires en vigueur.
   – Tolérance calculatoire estimée à ± 10 % compte tenu des incertitudes de mesure et de comportement.`;

  const conclusion = `Au terme de l'étude de dimensionnement, le bureau d'étude confirme la faisabilité technique et la pertinence énergétique de l'opération ${operation}.

Le dimensionnement retenu est cohérent avec les besoins du bâtiment, le matériel sélectionné satisfait aux exigences de la fiche d'opération standardisée ${fiche?.titre ?? "applicable"}, et le gain énergétique calculé dépasse le seuil minimal ouvrant droit à la valorisation CEE.

Le bureau d'étude émet un avis technique favorable à la mise en œuvre des travaux, sous les réserves d'usage suivantes :
• respect des règles de l'art et des DTU en vigueur lors de la réalisation ;
• qualification RGE de l'entreprise d'installation pour la famille de travaux concernée ;
• mise en service conforme aux prescriptions du fabricant, avec procès-verbal de réception ;
• mise en place d'un contrat de maintenance préventive assurant la pérennité des performances dans le temps.

Les éléments justificatifs (photographies datées, notes de calcul, fiches techniques, attestations d'assurance décennale, factures) constituent le dossier de preuve à archiver pendant la durée réglementaire de 9 ans au titre du dispositif des Certificats d'Économies d'Énergie.`;

  return { justification_choix, detail_calcul, conclusion };
}

const QUESTIONNAIRES: Record<FicheId, QuestionSection[]> = {
  "BAT-TH-134": QUESTIONNAIRE_134,
  "BAT-TH-163": QUESTIONNAIRE_163,
  "BAT-TH-142": QUESTIONNAIRE_142,
  "BAT-TH-139": QUESTIONNAIRE_139,
  "BAR-TH-171": QUESTIONNAIRE_171,
  "BAR-TH-159": QUESTIONNAIRE_159,
  "BAR-EN-101": QUESTIONNAIRE_101,
  "BAR-EN-102": QUESTIONNAIRE_102,
  "BAR-EN-103": QUESTIONNAIRE_103,
  "BAT-TH-116": QUESTIONNAIRE_116,
};

const PHOTO_CATEGORIES: Record<FicheId, string[]> = {
  "BAT-TH-134": PHOTO_CATEGORIES_134,
  "BAT-TH-163": PHOTO_CATEGORIES_163,
  "BAT-TH-142": PHOTO_CATEGORIES_142,
  "BAT-TH-139": PHOTO_CATEGORIES_139,
  "BAR-TH-171": PHOTO_CATEGORIES_171,
  "BAR-TH-159": PHOTO_CATEGORIES_159,
  "BAR-EN-101": PHOTO_CATEGORIES_101,
  "BAR-EN-102": PHOTO_CATEGORIES_102,
  "BAR-EN-103": PHOTO_CATEGORIES_103,
  "BAT-TH-116": PHOTO_CATEGORIES_116,
};

// ─── Calcul kWh cumac ───────────────────────────────────────────
// Durée de vie conventionnelle (années) par fiche CEE — source : arrêtés
// publiés au JO fixant les forfaits des fiches d'opérations standardisées.
// kWh cumac = gain annuel (kWh EF) × durée de vie conv. × coef. actualisation.
const DUREE_VIE_CONV: Record<FicheId, number> = {
  "BAT-TH-134": 15, // Haute pression flottante — 15 ans
  "BAT-TH-163": 17, // PAC air/eau tertiaire — 17 ans
  "BAT-TH-142": 10, // Déstratification air — 10 ans
  "BAT-TH-139": 15, // Récupération de chaleur sur GF — 15 ans
  "BAR-TH-171": 17, // PAC air/eau résidentiel — 17 ans
  "BAR-TH-159": 17, // PAC hybride résidentiel — 17 ans
  "BAR-EN-101": 30, // Isolation combles / toiture — 30 ans
  "BAR-EN-102": 25, // Isolation des murs — 25 ans
  "BAR-EN-103": 30, // Isolation d'un plancher — 30 ans
  "BAT-TH-116": 10, // GTB classes A/B — 10 ans
};

// Coefficient d'actualisation réglementaire (taux 4 %/an).
// Formule : a(N) = (1 - (1 + r)^-N) / (1 - (1 + r)^-1) avec r = 0.04.
// Conservé en valeurs usuelles pour la robustesse des résultats.
function coefActualisation(dureeVieAns: number): number {
  const r = 0.04;
  if (dureeVieAns <= 0) return 0;
  return (1 - Math.pow(1 + r, -dureeVieAns)) / (1 - Math.pow(1 + r, -1));
}

/**
 * Calcule le volume de CEE en kWh cumac.
 * @param ficheId  Fiche CEE concernée (détermine la durée de vie conv.)
 * @param gainMWhAn Gain énergétique annuel en énergie finale (MWh/an)
 * @returns cumac en kWh, ou null si données insuffisantes.
 */
function computeCumac(ficheId: FicheId, gainMWhAn: number): {
  cumacKWh: number;
  cumacMWh: number;
  duree: number;
  coefActu: number;
} | null {
  if (!ficheId || !Number.isFinite(gainMWhAn) || gainMWhAn <= 0) return null;
  const duree = DUREE_VIE_CONV[ficheId];
  const coefActu = coefActualisation(duree);
  const cumacKWh = gainMWhAn * 1000 * duree * coefActu;
  return { cumacKWh, cumacMWh: cumacKWh / 1000, duree, coefActu };
}

// ─── Section "Entreprise RGE" — commune à toutes les fiches ─────
// Exigée pour la recevabilité des dossiers CEE (circulaire RGE,
// décret n° 2014-812 du 16/07/2014). Ajoutée automatiquement à
// chaque questionnaire après sa définition.
const SECTION_ENTREPRISE_RGE: QuestionSection = {
  titre: "Entreprise RGE titulaire",
  description:
    "Identification de l'entreprise qualifiée RGE qui réalise les travaux. Pièces à archiver au dossier : attestation RGE en cours de validité, attestation d'assurance décennale, K-bis de moins de 3 mois.",
  fields: [
    { id: "rge_raison_sociale", label: "Raison sociale de l'entreprise", type: "text", placeholder: "Ex: ENERGIES SUD SARL", required: true, colSpan: 2 },
    { id: "rge_siret", label: "SIRET", type: "text", placeholder: "Ex: 812 345 678 00021", required: true },
    { id: "rge_forme", label: "Forme juridique", type: "select", options: ["SARL", "SAS", "SASU", "EURL", "SA", "Artisan / EI", "Autre"] },
    { id: "rge_adresse", label: "Adresse du siège social", type: "text", placeholder: "N°, rue, CP, commune", required: true, colSpan: 2 },
    { id: "rge_telephone", label: "Téléphone", type: "text", placeholder: "Ex: 04 XX XX XX XX" },
    { id: "rge_email", label: "Email contact dossier", type: "text", placeholder: "contact@entreprise.fr" },
    { id: "rge_contact_nom", label: "Interlocuteur (nom, fonction)", type: "text", placeholder: "Ex: M. Durand, conducteur de travaux", colSpan: 2 },
    {
      id: "rge_organisme",
      label: "Organisme de qualification RGE",
      type: "select",
      options: [
        "Qualibat",
        "Qualit'EnR (QualiPAC / Qualisol / QualiBois / Chauffage+)",
        "Qualifelec",
        "OPQIBI (études)",
        "Cequami",
        "CERTIBAT",
        "Autre",
      ],
      required: true,
    },
    {
      id: "rge_famille",
      label: "Famille / domaine de travaux RGE",
      type: "select",
      options: [
        "1911 — Installation de pompes à chaleur (Qualibat)",
        "1531 — Chauffage ou refroidissement biomasse / ENR",
        "8621 — Isolation thermique par l'intérieur",
        "7141 — Isolation thermique par l'extérieur (ITE)",
        "8731 — Étanchéité et isolation de toiture",
        "QualiPAC (Qualit'EnR)",
        "QualiPV (Qualit'EnR)",
        "OPQIBI 1905 — Audit énergétique bâtiment (tertiaire)",
        "OPQIBI 0901 — Étude thermique bâtiment",
        "Autre (à préciser dans remarques)",
      ],
      required: true,
      colSpan: 2,
    },
    { id: "rge_numero", label: "Numéro de certification RGE", type: "text", placeholder: "Ex: E-E123456 / QPAC-2024-XXXX", required: true },
    { id: "rge_date_debut", label: "Date de début de validité", type: "date" },
    { id: "rge_date_validite", label: "Date de fin de validité", type: "date", required: true, help: "La qualification doit être valide à la date de signature du devis." },
    { id: "rge_assurance_compagnie", label: "Compagnie d'assurance décennale", type: "text", placeholder: "Ex: MAAF PRO, SMABTP" },
    { id: "rge_assurance_police", label: "N° de police d'assurance décennale", type: "text", placeholder: "Ex: 987654321" },
    { id: "rge_assurance_validite", label: "Validité de l'assurance", type: "date" },
    {
      id: "rge_sous_traitance",
      label: "Recours à la sous-traitance ?",
      type: "select",
      options: ["Non — travaux réalisés en propre", "Oui — entreprise sous-traitante RGE (à préciser)"],
      help: "La sous-traitance est admise si le sous-traitant est lui-même RGE pour la famille de travaux concernée.",
    },
    {
      id: "rge_remarques",
      label: "Remarques complémentaires sur l'entreprise",
      type: "textarea",
      placeholder: "Références similaires, antécédents sur ce bénéficiaire, précisions éventuelles sur la sous-traitance, etc.",
      colSpan: 2,
    },
  ],
};

// Ajout automatique de la section RGE à chaque questionnaire — évite la
// duplication du bloc dans chacune des 10 fiches.
for (const k of Object.keys(QUESTIONNAIRES) as FicheId[]) {
  const arr = QUESTIONNAIRES[k];
  if (!arr.some((s) => s.titre === SECTION_ENTREPRISE_RGE.titre)) {
    arr.push(SECTION_ENTREPRISE_RGE);
  }
}

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
  fiche: FicheConfig,
  sections: QuestionSection[],
  values: FormValues,
  sectionPhotos: Record<number, PhotoItem[]>,
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const {
    drawCoverPage,
    drawSommaire,
    drawSectionHeader,
    drawFooter,
    drawPhotoEntry,
    drawProse,
    getDataTableConfig,
    needsPageBreak,
    resetTextState,
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

  const reference = values.ref_projet || "Ref. non definie";

  // ─── Page 1 : Cover ──────────────────────────────────────
  drawCoverPage(
    doc,
    "Note de dimensionnement",
    `Fiche CEE : ${fiche.id} — ${fiche.sousTitre}`,
    [
      ["Reference",     reference],
      ["Beneficiaire",  values.client_nom  || "—"],
      ["Adresse",       values.adresse     || "—"],
      ["Date visite",   values.date_visite || "—"],
      ["Date de note",  values.date_note   || "—"],
      ["Redacteur",     values.redacteur   || "—"],
    ],
    reference,
  );

  // ─── Page 2 : Sommaire (filled after content) ────────────
  doc.addPage();
  const tocPageNum = doc.getNumberOfPages();
  const tocEntries: { title: string; page: number }[] = [];

  // ─── Page 3+ : Content ───────────────────────────────────
  doc.addPage();
  let y: number = PDF_LAYOUT.topMargin;

  // ─── Fiche description ────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  const descLines = doc.splitTextToSize(fiche.description, contentWidth);
  doc.text(descLines, margin, y);
  y += descLines.length * 3.5 + 8;

  // ─── Sections ─────────────────────────────────────────────
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx];
    const tableData: string[][] = [];
    const freeText: { label: string; text: string }[] = [];
    for (const field of section.fields) {
      const val = values[field.id];
      if (!val || !val.trim()) continue;
      if (field.type === "textarea") {
        freeText.push({ label: field.label, text: val.trim() });
      } else {
        const label = field.unit ? `${field.label} (${field.unit})` : field.label;
        tableData.push([label, val]);
      }
    }
    if (tableData.length === 0 && freeText.length === 0 && !(sectionPhotos[sIdx]?.length > 0)) continue;

    checkPage(30);
    tocEntries.push({ title: section.titre, page: doc.getNumberOfPages() - 1 });
    y = drawSectionHeader(doc, section.titre, y, section.description);

    if (tableData.length > 0) {
      autoTable(doc, getDataTableConfig(y, tableData, contentWidth));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 6;
      resetTextState(doc);
    }

    // Textareas → paragraphes rédigés
    for (const ft of freeText) {
      checkPage(30);
      y = drawProse(doc, ft.label, y, { size: 9, spacingAfter: 1 });
      y = drawProse(doc, ft.text, y, { size: 9.5, spacingAfter: 4 });
    }

    // ─── Encart volume CEE calculé (après la section "gain") ───
    const hasGainField = section.fields.some((f) => f.id === "gain_energetique_mwh");
    const gainMWh = parseFloat(values.gain_energetique_mwh || "0");
    if (hasGainField && gainMWh > 0) {
      const cumac = computeCumac(fiche.id, gainMWh);
      if (cumac) {
        checkPage(28);
        const boxY = y;
        const boxH = 22;
        doc.setFillColor(240, 246, 255);
        doc.setDrawColor(180, 200, 230);
        doc.roundedRect(margin, boxY, contentWidth, boxH, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 60, 120);
        doc.text("Volume CEE calcule automatiquement", margin + 3, boxY + 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        const line1 = `Gain annuel : ${gainMWh.toFixed(1)} MWh/an  |  Duree de vie conv. : ${cumac.duree} ans  |  Coef. actualisation 4% : ${cumac.coefActu.toFixed(3)}`;
        const line2 = `Volume CEE : ${cumac.cumacMWh.toFixed(0)} MWh cumac   (${Math.round(cumac.cumacKWh).toLocaleString("fr-FR")} kWh cumac)`;
        doc.text(line1, margin + 3, boxY + 11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 60, 120);
        doc.text(line2, margin + 3, boxY + 17);
        y = boxY + boxH + 6;
      }
    }

    // Photos de cette section
    const photos = sectionPhotos[sIdx] || [];
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        checkPage(85);
        y = await drawPhotoEntry(doc, i, photos[i].preview, photos[i].categorie, photos[i].legende, y);
      }
    }

    y += PDF_LAYOUT.sectionGap - 6;
  }

  // ─── Fill sommaire page ───────────────────────────────────
  doc.setPage(tocPageNum);
  drawSommaire(doc, tocEntries, `${fiche.id} — Note de dimensionnement`, reference);

  // ─── Footers (skip page 1 = dark cover) ──────────────────
  const totalPages = doc.getNumberOfPages();
  const contentPages = totalPages - 1;
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, `${fiche.id} — Note de dimensionnement`, reference, i - 1, contentPages);
  }

  // ─── Download ─────────────────────────────────────────────
  const filename = `Note_Dimensionnement_${fiche.id}_${values.ref_projet || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ─── Component ──────────────────────────────────────────────────

export default function NoteDimensionnement({ onBack, onSaved, existingDoc }: Props) {
  const [selectedFiche, setSelectedFiche] = useState<FicheId | null>(() => {
    if (existingDoc?.donnees) {
      try {
        const d = JSON.parse(existingDoc.donnees);
        return d._ficheId || null;
      } catch { return null; }
    }
    return null;
  });
  const [activeSection, setActiveSection] = useState(0);
  const [values, setValues] = useState<FormValues>(() => {
    if (existingDoc?.donnees) {
      try {
        const parsed = JSON.parse(existingDoc.donnees);
        delete parsed._sectionPhotos;
        return parsed;
      } catch { return {}; }
    }
    return {};
  });
  const [docId, setDocId] = useState<string | null>(existingDoc?.id ?? null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  // ─── Pré-remplissage éditable des 3 champs rédactionnels ─────
  // Quand une fiche est choisie, on injecte un texte générique cohérent
  // pour justification_choix / detail_calcul / conclusion — uniquement
  // si le champ est vide (on n'écrase jamais la saisie de l'utilisateur).
  useEffect(() => {
    if (!selectedFiche) return;
    const defaults = getDefaultTexts(selectedFiche);
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of ["justification_choix", "detail_calcul", "conclusion"] as const) {
        if (!next[key] || !next[key].trim()) {
          next[key] = defaults[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedFiche]);

  // ─── Calcul automatique kWh cumac ────────────────────────────
  // Le gain annuel en énergie finale (MWh/an) saisi par l'utilisateur,
  // combiné à la durée de vie conventionnelle de la fiche, donne le
  // volume de CEE en kWh cumac avec actualisation 4 %.
  const cumacInfo = selectedFiche
    ? computeCumac(selectedFiche, parseFloat(values.gain_energetique_mwh || "0"))
    : null;

  // Persistance du cumac calculé dans les valeurs du formulaire — utile
  // pour la sérialisation (JSON document.donnees) et l'injection PDF.
  useEffect(() => {
    if (!cumacInfo) return;
    const mwh = cumacInfo.cumacMWh.toFixed(0);
    const kwh = Math.round(cumacInfo.cumacKWh).toString();
    setValues((prev) => {
      if (prev.cee_cumac_calcule_mwh === mwh && prev.cee_cumac_calcule_kwh === kwh) return prev;
      return { ...prev, cee_cumac_calcule_mwh: mwh, cee_cumac_calcule_kwh: kwh };
    });
  }, [cumacInfo?.cumacKWh, cumacInfo?.cumacMWh]);

  // ─── Auto-calcul BAT-TH-134 ──────────────────────────────────
  const calcul134 = selectedFiche === "BAT-TH-134" ? calculer134(values) : null;

  // ─── Auto-calcul BAT-TH-163 ──────────────────────────────────
  const calcul163 = selectedFiche === "BAT-TH-163" ? calculer163(values) : null;

  // ─── Auto-calcul BAT-TH-142 ──────────────────────────────────
  const calcul142 = selectedFiche === "BAT-TH-142" ? calculer142(values) : null;

  // ─── Auto-calcul BAT-TH-139 ──────────────────────────────────
  const calcul139 = selectedFiche === "BAT-TH-139" ? calculer139(values) : null;

  // ─── Pré-remplissage auto section "Calcul gains" BAT-TH-134 ──
  // Étape 1 : pré-remplir les champs d'entrée de la section 5 à partir des sections précédentes
  const didPrefill134Ref = useRef(false);
  useEffect(() => {
    if (selectedFiche !== "BAT-TH-134" || activeSection !== 4) return;
    if (didPrefill134Ref.current) return;

    // Calculer la conso avant à partir des groupes froids (section 3)
    // Puissance absorbée totale = compresseurs + ventilateurs condenseur (kW)
    const nbGroupes = parseInt(values.nb_groupes_multi || "1", 10) || 1;
    let puissanceAbsorbeeTotale = 0;
    for (let i = 1; i <= nbGroupes; i++) {
      puissanceAbsorbeeTotale += parseFloat(values[`puissance_absorbee_${i}`] || "0");
      puissanceAbsorbeeTotale += parseFloat(values[`puissance_ventilateurs_${i}`] || "0");
    }
    if (puissanceAbsorbeeTotale <= 0) return; // pas assez de données des sections précédentes

    didPrefill134Ref.current = true;
    const heures = values.heures_fonctionnement || "6500";
    const consoEstimee = (puissanceAbsorbeeTotale * parseFloat(heures)) / 1000;

    setValues((prev) => {
      const updates: FormValues = {};
      if (!prev.methode_calcul) updates.methode_calcul = "Méthode bin (répartition des heures par tranche de T° ext.)";
      if (!prev.heures_fonctionnement) updates.heures_fonctionnement = heures;
      if (!prev.conso_electrique_avant) updates.conso_electrique_avant = consoEstimee.toFixed(1);
      if (!prev.source_conso_avant) updates.source_conso_avant = "Estimation par calcul";
      if (!prev.regime_froid) updates.regime_froid = "Froid positif uniquement (> 0°C)";
      if (!prev.profil_utilisation) updates.profil_utilisation = "Continu (24h/24, 7j/7)";
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
    setSaved(false);
  }, [selectedFiche, activeSection, values]);

  // Étape 2 : une fois calculer134 disponible, pré-remplir les champs de résultat
  const prevCalcul134Ref = useRef<string | null>(null);
  useEffect(() => {
    if (selectedFiche !== "BAT-TH-134" || activeSection !== 4 || !calcul134) return;
    // Signature des résultats pour éviter les boucles infinies
    const sig = `${calcul134.consoApres.toFixed(1)}|${calcul134.gainPct.toFixed(1)}|${calcul134.gainMwh.toFixed(1)}|${Math.round(calcul134.economiEuros)}|${calcul134.dureeRetour?.toFixed(1) ?? ""}`;
    if (prevCalcul134Ref.current === sig) return;
    prevCalcul134Ref.current = sig;

    setValues((prev) => ({
      ...prev,
      conso_electrique_apres: calcul134.consoApres.toFixed(1),
      gain_energetique_pct: calcul134.gainPct.toFixed(1),
      gain_energetique_mwh: calcul134.gainMwh.toFixed(1),
      economie_euros: String(Math.round(calcul134.economiEuros)),
      ...(calcul134.dureeRetour ? { duree_retour: calcul134.dureeRetour.toFixed(1) } : {}),
      detail_calcul: calcul134.detailMethode,
    }));
    setSaved(false);
  }, [selectedFiche, activeSection, calcul134]);

  // ─── Pré-remplissage auto section "Dimensionnement" BAT-TH-163 ──
  // Étape 1 : pré-remplir les champs d'entrée de la section 6 à partir des sections précédentes
  const didPrefill163Ref = useRef(false);
  useEffect(() => {
    if (selectedFiche !== "BAT-TH-163" || activeSection !== 5) return;
    if (didPrefill163Ref.current) return;

    // Vérifier qu'on a assez de données des sections précédentes
    const surface = parseFloat(values.surface_chauffee || "0");
    const scop = parseFloat(values.scop || "0");
    const zone = values.zone_climatique;
    const zoneData = zone ? ZONE_CLIMATIQUE_DATA[zone] : null;
    if (surface <= 0 || scop <= 0 || !zoneData) return;

    didPrefill163Ref.current = true;

    // Calculer le volume chauffé si pas renseigné
    const hsp = parseFloat(values.hauteur_sous_plafond || "3");
    const volumeCalc = (surface * hsp).toFixed(0);

    // Température de base depuis la zone climatique
    const tempBase = values.temp_base || String(zoneData.tBase);

    // Taux de couverture par défaut
    const tauxCouverture = "90";

    // Point de bivalence estimé (température de base + 5°C typiquement)
    const bivalence = String(parseFloat(tempBase) + 5);

    setValues((prev) => {
      const updates: FormValues = {};
      if (!prev.methode_calcul) updates.methode_calcul = "Calcul simplifié (G × V × ΔT)";
      if (!prev.taux_couverture) updates.taux_couverture = tauxCouverture;
      if (!prev.appoint) updates.appoint = "Résistance électrique intégrée";
      if (!prev.volume_chauffe) updates.volume_chauffe = volumeCalc;
      if (!prev.temp_base) updates.temp_base = tempBase;
      if (!prev.point_bivalence) updates.point_bivalence = bivalence;
      // Pré-remplir conso avant travaux depuis section 3 si renseignée
      if (!prev.conso_avant_travaux && prev.conso_chauffage_existante) {
        updates.conso_avant_travaux = prev.conso_chauffage_existante;
      }
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
    setSaved(false);
  }, [selectedFiche, activeSection, values]);

  // Étape 2 : une fois calculer163 disponible, pré-remplir les champs de résultat (déperditions + gains)
  const prevCalcul163Ref = useRef<string | null>(null);
  useEffect(() => {
    if (selectedFiche !== "BAT-TH-163" || activeSection !== 5 || !calcul163) return;
    const sig = `${calcul163.deperditionsTotales.toFixed(1)}|${calcul163.consoAvant.toFixed(1)}|${calcul163.gainPct.toFixed(1)}|${calcul163.gainMwh.toFixed(1)}|${Math.round(calcul163.economiEuros)}|${calcul163.dureeRetour?.toFixed(1) ?? ""}`;
    if (prevCalcul163Ref.current === sig) return;
    prevCalcul163Ref.current = sig;

    setValues((prev) => ({
      ...prev,
      // Déperditions thermiques (calculées auto)
      deperditions_totales: calcul163.deperditionsTotales.toFixed(1),
      deperditions_par_m2: calcul163.deperditionsParM2.toFixed(0),
      coeff_G: calcul163.coeffG.toFixed(2),
      besoin_chauffage: calcul163.besoinChauffage.toFixed(1),
      // Gains énergétiques (calculés auto)
      conso_avant_travaux: calcul163.consoAvant.toFixed(1),
      conso_apres_travaux: calcul163.consoApres.toFixed(1),
      gain_energetique_pct: calcul163.gainPct.toFixed(1),
      gain_energetique_mwh: calcul163.gainMwh.toFixed(1),
      reduction_co2: calcul163.reductionCo2.toFixed(1),
      economie_euros: String(Math.round(calcul163.economiEuros)),
      ...(calcul163.dureeRetour ? { duree_retour: calcul163.dureeRetour.toFixed(1) } : {}),
      detail_calcul: calcul163.detailMethode,
    }));
    setSaved(false);
  }, [selectedFiche, activeSection, calcul163]);

  // ─── Pré-remplissage auto section "Calcul gains" BAT-TH-142 ──
  const didPrefill142Ref = useRef(false);
  useEffect(() => {
    if (selectedFiche !== "BAT-TH-142" || activeSection !== 4) return;
    if (didPrefill142Ref.current) return;

    // Pré-remplir depuis les sections précédentes
    const gradient = parseFloat(values.gradient_thermique || "0");
    const consoAnnuelle = parseFloat(values.conso_chauffage_annuelle || "0");
    if (gradient <= 0 || consoAnnuelle <= 0) return;

    didPrefill142Ref.current = true;
    const hauteur = parseFloat(values.hauteur_sous_plafond || "8");

    setValues((prev) => {
      const updates: FormValues = {};
      if (!prev.methode_calcul) updates.methode_calcul = "Méthode forfaitaire (3% d'économie par °C de gradient réduit)";
      if (!prev.gradient_avant) updates.gradient_avant = String(gradient);
      // Estimer gradient après : réduction de 75% typique
      if (!prev.gradient_apres) updates.gradient_apres = (gradient * 0.25).toFixed(1);
      if (!prev.conso_chauffage_avant) updates.conso_chauffage_avant = String(consoAnnuelle);
      if (!prev.reduction_gradient) updates.reduction_gradient = (gradient * 0.75).toFixed(1);
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
    setSaved(false);
  }, [selectedFiche, activeSection, values]);

  // Étape 2 : résultats calculés BAT-TH-142
  const prevCalcul142Ref = useRef<string | null>(null);
  useEffect(() => {
    if (selectedFiche !== "BAT-TH-142" || activeSection !== 4 || !calcul142) return;
    const sig = `${calcul142.gainNetMwh.toFixed(1)}|${calcul142.gainNetPct.toFixed(1)}|${Math.round(calcul142.economiEuros)}`;
    if (prevCalcul142Ref.current === sig) return;
    prevCalcul142Ref.current = sig;

    setValues((prev) => ({
      ...prev,
      conso_chauffage_apres: calcul142.consoApres.toFixed(1),
      gain_energetique_pct: calcul142.gainNetPct.toFixed(1),
      gain_energetique_mwh: calcul142.gainNetMwh.toFixed(1),
      economie_euros: String(Math.round(calcul142.economiEuros)),
      ...(calcul142.dureeRetour ? { duree_retour: calcul142.dureeRetour.toFixed(1) } : {}),
      detail_calcul: calcul142.detailMethode,
      reduction_gradient: calcul142.reductionGradient.toFixed(1),
    }));
    setSaved(false);
  }, [selectedFiche, activeSection, calcul142]);

  // ─── Pré-remplissage auto section "Calcul gains" BAT-TH-139 ──
  const didPrefill139Ref = useRef(false);
  useEffect(() => {
    if (selectedFiche !== "BAT-TH-139" || activeSection !== 4) return;
    if (didPrefill139Ref.current) return;

    // Pré-remplir depuis les sections précédentes
    const puissanceFroid = parseFloat(values.puissance_froid || "0");
    const puissanceAbsorbee = parseFloat(values.puissance_absorbee || "0");
    const heures = parseFloat(values.heures_fonctionnement || "0");
    const tauxCharge = parseFloat(values.taux_charge_moyen || "0");
    if (puissanceFroid <= 0 || puissanceAbsorbee <= 0 || heures <= 0 || tauxCharge <= 0) return;

    didPrefill139Ref.current = true;

    // Estimer la chaleur rejetée et proposer un taux de récupération
    const chaleurRejetee = ((puissanceFroid + puissanceAbsorbee) * heures * (tauxCharge / 100)) / 1000;

    setValues((prev) => {
      const updates: FormValues = {};
      if (!prev.methode_calcul) updates.methode_calcul = "Bilan thermique (puissance × heures × taux de charge × taux de récup.)";
      if (!prev.chaleur_rejetee_annuelle) updates.chaleur_rejetee_annuelle = chaleurRejetee.toFixed(1);
      if (!prev.taux_recuperation) updates.taux_recuperation = "35";
      if (!prev.chaleur_recuperee_annuelle) updates.chaleur_recuperee_annuelle = (chaleurRejetee * 0.35).toFixed(1);
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
    setSaved(false);
  }, [selectedFiche, activeSection, values]);

  // Étape 2 : résultats calculés BAT-TH-139
  const prevCalcul139Ref = useRef<string | null>(null);
  useEffect(() => {
    if (selectedFiche !== "BAT-TH-139" || activeSection !== 4 || !calcul139) return;
    const sig = `${calcul139.consoEvitee.toFixed(1)}|${calcul139.gainPct.toFixed(1)}|${Math.round(calcul139.economiEuros)}`;
    if (prevCalcul139Ref.current === sig) return;
    prevCalcul139Ref.current = sig;

    setValues((prev) => ({
      ...prev,
      chaleur_rejetee_annuelle: calcul139.chaleurRejetee.toFixed(1),
      chaleur_recuperee_annuelle: calcul139.chaleurRecuperee.toFixed(1),
      conso_evitee: calcul139.consoEvitee.toFixed(1),
      gain_energetique_pct: calcul139.gainPct.toFixed(1),
      gain_energetique_mwh: calcul139.chaleurRecuperee.toFixed(1),
      reduction_co2: calcul139.reductionCo2.toFixed(1),
      economie_euros: String(Math.round(calcul139.economiEuros)),
      ...(calcul139.dureeRetour ? { duree_retour: calcul139.dureeRetour.toFixed(1) } : {}),
      detail_calcul: calcul139.detailMethode,
    }));
    setSaved(false);
  }, [selectedFiche, activeSection, calcul139]);

  async function handleSave() {
    if (!selectedFiche) return;
    setSaving(true);
    try {
      const ficheConfig = FICHES.find((f) => f.id === selectedFiche);
      const titre = values.ref_projet
        ? `${selectedFiche} — ${values.client_nom || "Sans client"}`
        : `Note de dimensionnement ${selectedFiche} (brouillon)`;
      const reference = values.ref_projet || `ND-${Date.now().toString(36).toUpperCase()}`;
      const photosToSave: Record<number, Array<{ id: string; preview: string; legende: string; categorie: string }>> = {};
      for (const [key, photos] of Object.entries(sectionPhotos)) {
        if (photos.length > 0) {
          photosToSave[Number(key)] = photos.map((p) => ({ id: p.id, preview: p.preview, legende: p.legende, categorie: p.categorie }));
        }
      }
      const donnees = JSON.stringify({ ...values, _ficheId: selectedFiche, _ficheTitre: ficheConfig?.sousTitre, _sectionPhotos: Object.keys(photosToSave).length > 0 ? photosToSave : undefined });

      if (docId) {
        const res = await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titre,
            reference,
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
            type: "NOTE_DIMENSIONNEMENT",
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
              categorie: "Autre",
            },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, [activeSection]);

  function removePhoto(sectionIdx: number, id: string) {
    setSectionPhotos((prev) => ({
      ...prev,
      [sectionIdx]: (prev[sectionIdx] || []).filter((p) => p.id !== id),
    }));
  }

  function updatePhotoLegende(sectionIdx: number, id: string, legende: string) {
    setSectionPhotos((prev) => ({
      ...prev,
      [sectionIdx]: (prev[sectionIdx] || []).map((p) => p.id === id ? { ...p, legende } : p),
    }));
  }

  function updatePhotoCategorie(sectionIdx: number, id: string, categorie: string) {
    setSectionPhotos((prev) => ({
      ...prev,
      [sectionIdx]: (prev[sectionIdx] || []).map((p) => p.id === id ? { ...p, categorie } : p),
    }));
  }

  async function handleGeneratePDF() {
    if (!selectedFiche) return;
    setGenerating(true);
    try {
      const fiche = FICHES.find((f) => f.id === selectedFiche)!;
      const sections = QUESTIONNAIRES[selectedFiche];
      await generatePDF(fiche, sections, values, sectionPhotos);
      // Mark as TERMINE after PDF generation
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
                  setSectionPhotos({});
                  didPrefill134Ref.current = false;
                  prevCalcul134Ref.current = null;
                  didPrefill163Ref.current = false;
                  prevCalcul163Ref.current = null;
                  didPrefill142Ref.current = false;
                  prevCalcul142Ref.current = null;
                  didPrefill139Ref.current = false;
                  prevCalcul139Ref.current = null;
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
                    Commencer la note de dimensionnement
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
  const photoCategories = PHOTO_CATEGORIES[selectedFiche];
  const currentSection = sections[activeSection];
  const totalPhotos = Object.values(sectionPhotos).reduce((sum, arr) => sum + arr.length, 0);

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
              {totalPhotos > 0 && ` — ${totalPhotos} photo${totalPhotos > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Sauvegarde..." : saved ? "Sauvegardé" : "Sauvegarder"}
          </Button>
          <Button size="sm" onClick={handleGeneratePDF} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {generating ? "Génération..." : "Générer le PDF"}
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
            const sectionPhotoCount = (sectionPhotos[i] || []).length;

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
                {sectionPhotoCount > 0 && (
                  <Badge variant="outline" className="ml-auto text-[10px] gap-1">
                    <Camera className="h-3 w-3" />{sectionPhotoCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Contenu */}
        <AnimatePresence mode="wait">
          {currentSection ? (
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

                        {field.help && (
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            {field.help}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ─── Volume CEE — kWh cumac calculé automatiquement ─── */}
                  {cumacInfo && currentSection.fields.some((f) => f.id === "gain_energetique_mwh") && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <h4 className="text-sm font-semibold text-primary">Volume CEE — calcul automatique</h4>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Gain annuel</div>
                          <div className="text-lg font-semibold">{parseFloat(values.gain_energetique_mwh || "0").toFixed(1)} MWh/an</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Durée de vie conventionnelle</div>
                          <div className="text-lg font-semibold">{cumacInfo.duree} ans</div>
                          <div className="text-[11px] text-muted-foreground">coef. actualisation 4 % = {cumacInfo.coefActu.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Volume CEE</div>
                          <div className="text-lg font-semibold text-primary">{cumacInfo.cumacMWh.toFixed(0)} MWh cumac</div>
                          <div className="text-[11px] text-muted-foreground">= {Math.round(cumacInfo.cumacKWh).toLocaleString("fr-FR")} kWh cumac</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug pt-1 border-t border-primary/20">
                        Formule : kWh cumac = gain annuel (kWh EF) × durée de vie conv. × coefficient d&apos;actualisation 4 %.
                        Valeur indicative à consolider avec la formule forfaitaire de la fiche {selectedFiche} et les exigences du PNCEE.
                      </p>
                    </div>
                  )}

                  {/* ─── Résultats calculés BAT-TH-134 ─── */}
                  {selectedFiche === "BAT-TH-134" && currentSection.titre.includes("5.") && calcul134 && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">Résultats calculés automatiquement</h4>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: "COP moyen AVANT", value: calcul134.copMoyenAvant.toFixed(2), sub: "HP fixe" },
                          { label: "COP moyen APRÈS", value: calcul134.copMoyenApres.toFixed(2), sub: "HP flottante" },
                          { label: "Gain énergétique", value: `${calcul134.gainPct.toFixed(1)}%`, sub: `${calcul134.gainMwh.toFixed(1)} MWh/an` },
                          { label: "Économie annuelle", value: `${Math.round(calcul134.economiEuros).toLocaleString("fr-FR")} €`, sub: calcul134.dureeRetour ? `Retour: ${calcul134.dureeRetour.toFixed(1)} ans` : "" },
                        ].map((kpi) => (
                          <div key={kpi.label} className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                            <p className="text-xl font-bold text-green-700 dark:text-green-400">{kpi.value}</p>
                            {kpi.sub && <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => {
                            if (!calcul134) return;
                            updateValue("conso_electrique_apres", calcul134.consoApres.toFixed(1));
                            updateValue("gain_energetique_pct", calcul134.gainPct.toFixed(1));
                            updateValue("gain_energetique_mwh", calcul134.gainMwh.toFixed(1));
                            updateValue("economie_euros", String(Math.round(calcul134.economiEuros)));
                            if (calcul134.dureeRetour) updateValue("duree_retour", calcul134.dureeRetour.toFixed(1));
                            updateValue("detail_calcul", calcul134.detailMethode);
                            updateValue("methode_calcul", "Méthode bin (répartition des heures par tranche de T° ext.)");
                          }}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Appliquer les résultats aux champs du formulaire
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ─── Résultats calculés BAT-TH-163 ─── */}
                  {selectedFiche === "BAT-TH-163" && currentSection.titre.includes("6.") && calcul163 && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Résultats calculés automatiquement</h4>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: "Déperditions totales", value: `${calcul163.deperditionsTotales.toFixed(1)} kW`, sub: `${calcul163.deperditionsParM2.toFixed(0)} W/m² · G=${calcul163.coeffG.toFixed(2)}` },
                          { label: "Besoins chauffage", value: `${calcul163.besoinChauffage.toFixed(1)} MWh/an`, sub: `Volume: ${calcul163.volumeChauffe.toFixed(0)} m³` },
                          { label: "Gain énergétique", value: `${calcul163.gainPct.toFixed(1)}%`, sub: `${calcul163.gainMwh.toFixed(1)} MWh/an` },
                          { label: "Réduction CO₂", value: `${calcul163.reductionCo2.toFixed(1)} t/an`, sub: calcul163.dureeRetour ? `Retour: ${calcul163.dureeRetour.toFixed(1)} ans` : `${Math.round(calcul163.economiEuros).toLocaleString("fr-FR")} €/an` },
                        ].map((kpi) => (
                          <div key={kpi.label} className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{kpi.value}</p>
                            {kpi.sub && <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>}
                          </div>
                        ))}
                      </div>
                      <details className="rounded-lg border bg-muted/30 p-3">
                        <summary className="text-xs font-medium cursor-pointer">Détail des déperditions</summary>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs">
                          <div>Murs: <strong>{calcul163.deperditionsParois.toFixed(1)} kW</strong></div>
                          <div>Ventilation: <strong>{calcul163.deperditionsVentilation.toFixed(1)} kW</strong></div>
                          <div>Total (+15% PT): <strong>{calcul163.deperditionsTotales.toFixed(1)} kW</strong></div>
                        </div>
                      </details>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-blue-700 border-blue-300 hover:bg-blue-50"
                          onClick={() => {
                            if (!calcul163) return;
                            updateValue("volume_chauffe", calcul163.volumeChauffe.toFixed(0));
                            updateValue("deperditions_totales", calcul163.deperditionsTotales.toFixed(1));
                            updateValue("deperditions_par_m2", calcul163.deperditionsParM2.toFixed(0));
                            updateValue("coeff_G", calcul163.coeffG.toFixed(2));
                            updateValue("besoin_chauffage", calcul163.besoinChauffage.toFixed(1));
                            updateValue("conso_avant_travaux", calcul163.consoAvant.toFixed(1));
                            updateValue("conso_apres_travaux", calcul163.consoApres.toFixed(1));
                            updateValue("gain_energetique_pct", calcul163.gainPct.toFixed(1));
                            updateValue("gain_energetique_mwh", calcul163.gainMwh.toFixed(1));
                            updateValue("reduction_co2", calcul163.reductionCo2.toFixed(1));
                            updateValue("economie_euros", String(Math.round(calcul163.economiEuros)));
                            if (calcul163.dureeRetour) updateValue("duree_retour", calcul163.dureeRetour.toFixed(1));
                            updateValue("detail_calcul", calcul163.detailMethode);
                            updateValue("methode_calcul", "Calcul simplifié (G × V × ΔT)");
                          }}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Appliquer les résultats aux champs du formulaire
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ─── Résultats calculés BAT-TH-142 ─── */}
                  {selectedFiche === "BAT-TH-142" && currentSection.titre.includes("5.") && calcul142 && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Résultats calculés automatiquement</h4>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: "Réduction gradient", value: `${calcul142.reductionGradient.toFixed(1)}°C`, sub: `${calcul142.gainBrutPct.toFixed(0)}% brut` },
                          { label: "Conso déstratificateurs", value: `${calcul142.consoDestrat.toFixed(2)} MWh`, sub: "À déduire" },
                          { label: "Gain net", value: `${calcul142.gainNetPct.toFixed(1)}%`, sub: `${calcul142.gainNetMwh.toFixed(1)} MWh/an` },
                          { label: "Économie annuelle", value: `${Math.round(calcul142.economiEuros).toLocaleString("fr-FR")} €`, sub: calcul142.dureeRetour ? `Retour: ${calcul142.dureeRetour.toFixed(1)} ans` : "" },
                        ].map((kpi) => (
                          <div key={kpi.label} className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{kpi.value}</p>
                            {kpi.sub && <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-amber-700 border-amber-300 hover:bg-amber-50"
                          onClick={() => {
                            if (!calcul142) return;
                            updateValue("conso_chauffage_apres", calcul142.consoApres.toFixed(1));
                            updateValue("gain_energetique_pct", calcul142.gainNetPct.toFixed(1));
                            updateValue("gain_energetique_mwh", calcul142.gainNetMwh.toFixed(1));
                            updateValue("economie_euros", String(Math.round(calcul142.economiEuros)));
                            if (calcul142.dureeRetour) updateValue("duree_retour", calcul142.dureeRetour.toFixed(1));
                            updateValue("detail_calcul", calcul142.detailMethode);
                            updateValue("reduction_gradient", calcul142.reductionGradient.toFixed(1));
                          }}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Appliquer les résultats aux champs du formulaire
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ─── Résultats calculés BAT-TH-139 ─── */}
                  {selectedFiche === "BAT-TH-139" && currentSection.titre.includes("5.") && calcul139 && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Résultats calculés automatiquement</h4>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                          { label: "Chaleur rejetée", value: `${calcul139.chaleurRejetee.toFixed(1)} MWh`, sub: "Total condenseur" },
                          { label: "Chaleur récupérée", value: `${calcul139.chaleurRecuperee.toFixed(1)} MWh/an`, sub: `${calcul139.gainPct.toFixed(0)}% du besoin` },
                          { label: "Énergie évitée", value: `${calcul139.consoEvitee.toFixed(1)} MWh/an`, sub: `CO₂: -${calcul139.reductionCo2.toFixed(1)} t/an` },
                          { label: "Économie annuelle", value: `${Math.round(calcul139.economiEuros).toLocaleString("fr-FR")} €`, sub: calcul139.dureeRetour ? `Retour: ${calcul139.dureeRetour.toFixed(1)} ans` : "" },
                        ].map((kpi) => (
                          <div key={kpi.label} className="rounded-xl border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 p-3 text-center">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                            <p className="text-xl font-bold text-orange-700 dark:text-orange-400">{kpi.value}</p>
                            {kpi.sub && <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-orange-700 border-orange-300 hover:bg-orange-50"
                          onClick={() => {
                            if (!calcul139) return;
                            updateValue("chaleur_rejetee_annuelle", calcul139.chaleurRejetee.toFixed(1));
                            updateValue("chaleur_recuperee_annuelle", calcul139.chaleurRecuperee.toFixed(1));
                            updateValue("conso_evitee", calcul139.consoEvitee.toFixed(1));
                            updateValue("gain_energetique_pct", calcul139.gainPct.toFixed(1));
                            updateValue("gain_energetique_mwh", calcul139.chaleurRecuperee.toFixed(1));
                            updateValue("reduction_co2", calcul139.reductionCo2.toFixed(1));
                            updateValue("economie_euros", String(Math.round(calcul139.economiEuros)));
                            if (calcul139.dureeRetour) updateValue("duree_retour", calcul139.dureeRetour.toFixed(1));
                            updateValue("detail_calcul", calcul139.detailMethode);
                          }}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Appliquer les résultats aux champs du formulaire
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Multi-group dynamic fields */}
                  {currentSection.multiGroup && (() => {
                    const mg = currentSection.multiGroup;
                    const groupCount = parseInt(values[mg.countKey] || "1", 10) || 1;
                    const safeCount = Math.max(mg.minCount ?? 1, Math.min(groupCount, mg.maxCount ?? 10));

                    return (
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">{mg.label}s ({safeCount})</h4>
                          <div className="flex gap-2">
                            {safeCount > (mg.minCount ?? 1) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newCount = safeCount - 1;
                                  updateValue(mg.countKey, String(newCount));
                                  // Clean up removed group values
                                  const removedIdx = safeCount;
                                  for (const tf of mg.templateFields) {
                                    const key = `${tf.id}_${removedIdx}`;
                                    if (values[key]) updateValue(key, "");
                                  }
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Retirer
                              </Button>
                            )}
                            {safeCount < (mg.maxCount ?? 10) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateValue(mg.countKey, String(safeCount + 1))}
                              >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                Ajouter un {mg.label.toLowerCase()}
                              </Button>
                            )}
                          </div>
                        </div>

                        {Array.from({ length: safeCount }, (_, idx) => {
                          const groupNum = idx + 1;
                          return (
                            <div key={groupNum} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                              <h5 className="text-sm font-medium text-primary">
                                {mg.label} {groupNum}
                              </h5>
                              <div className="grid gap-4 sm:grid-cols-2">
                                {mg.templateFields.map((field) => {
                                  const fieldKey = `${field.id}_${groupNum}`;
                                  return (
                                    <div
                                      key={fieldKey}
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
                                          value={values[fieldKey] || ""}
                                          onChange={(e) => updateValue(fieldKey, e.target.value)}
                                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        >
                                          <option value="">— Sélectionner —</option>
                                          {field.options?.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      ) : field.type === "textarea" ? (
                                        <textarea
                                          value={values[fieldKey] || ""}
                                          onChange={(e) => updateValue(fieldKey, e.target.value)}
                                          rows={3}
                                          placeholder={field.placeholder}
                                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                                        />
                                      ) : (
                                        <input
                                          type={field.type}
                                          value={values[fieldKey] || ""}
                                          onChange={(e) => updateValue(fieldKey, e.target.value)}
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
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Photos de cette étape */}
                  <div className="border-t pt-4 space-y-3">
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
                              <button onClick={() => removePhoto(activeSection, photo.id)} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white shadow-sm">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <span className="text-xs font-medium text-muted-foreground">Photo {i + 1}</span>
                              <select
                                value={photo.categorie}
                                onChange={(e) => updatePhotoCategorie(activeSection, photo.id, e.target.value)}
                                className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
                              >
                                {photoCategories.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={photo.legende}
                                onChange={(e) => updatePhotoLegende(activeSection, photo.id, e.target.value)}
                                placeholder="Légende de la photo..."
                                className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Navigation entre sections */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                      disabled={activeSection === 0}
                    >
                      &larr; Précédent
                    </Button>
                    {activeSection < sections.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={() => setActiveSection(activeSection + 1)}
                      >
                        Suivant &rarr;
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleGeneratePDF} disabled={generating}>
                        {generating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
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
