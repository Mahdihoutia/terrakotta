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

type FicheId = "BAT-TH-134" | "BAT-TH-163" | "BAR-TH-171" | "BAR-TH-159" | "BAR-EN-101" | "BAR-EN-102" | "BAR-EN-103" | "BAT-TH-116";

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
      { id: "volume_chauffe", label: "Volume chauffé", type: "number", placeholder: "Ex: 3600", unit: "m³", help: "Surface × hauteur sous plafond moyenne" },
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

const QUESTIONNAIRES: Record<FicheId, QuestionSection[]> = {
  "BAT-TH-134": QUESTIONNAIRE_134,
  "BAT-TH-163": QUESTIONNAIRE_163,
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
  "BAR-TH-171": PHOTO_CATEGORIES_171,
  "BAR-TH-159": PHOTO_CATEGORIES_159,
  "BAR-EN-101": PHOTO_CATEGORIES_101,
  "BAR-EN-102": PHOTO_CATEGORIES_102,
  "BAR-EN-103": PHOTO_CATEGORIES_103,
  "BAT-TH-116": PHOTO_CATEGORIES_116,
};

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
    for (const field of section.fields) {
      const val = values[field.id];
      if (!val || !val.trim()) continue;
      const label = field.unit ? `${field.label} (${field.unit})` : field.label;
      tableData.push([label, val]);
    }
    if (tableData.length === 0 && !(sectionPhotos[sIdx]?.length > 0)) continue;

    checkPage(30);
    tocEntries.push({ title: section.titre, page: doc.getNumberOfPages() - 1 });
    y = drawSectionHeader(doc, section.titre, y, section.description);

    if (tableData.length > 0) {
      autoTable(doc, getDataTableConfig(y, tableData, contentWidth));
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
