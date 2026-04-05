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
    description: "Description complète du groupe de production de froid avant travaux",
    fields: [
      {
        id: "type_groupe_froid",
        label: "Type de groupe de froid",
        type: "select",
        options: ["Groupe à condensation à air", "Groupe à condensation à eau", "Centrale frigorifique", "Groupe semi-hermétique", "Groupe à vis", "Autre"],
        required: true,
      },
      { id: "nb_groupes", label: "Nombre de groupes de production de froid", type: "number", placeholder: "Ex: 3", required: true },
      { id: "marque_groupe_existant", label: "Marque du groupe existant", type: "text", placeholder: "Ex: Bitzer, Carrier, Copeland...", required: true },
      { id: "modele_groupe_existant", label: "Modèle / référence du groupe", type: "text", placeholder: "Référence constructeur" },
      { id: "annee_installation_existante", label: "Année d'installation", type: "number", placeholder: "Ex: 2010", required: true },
      { id: "puissance_froid_existante", label: "Puissance frigorifique totale installée", type: "number", placeholder: "Ex: 350", unit: "kW", required: true },
      { id: "puissance_absorbee_existante", label: "Puissance électrique absorbée compresseurs", type: "number", placeholder: "Ex: 120", unit: "kW", required: true },
      {
        id: "fluide_frigorigene_existant",
        label: "Fluide frigorigène",
        type: "select",
        options: ["R-404A", "R-407C", "R-134a", "R-410A", "R-448A", "R-449A", "R-744 (CO₂)", "R-290 (propane)", "R-717 (ammoniac)", "Autre"],
        required: true,
      },
      { id: "charge_fluide_existant", label: "Charge en fluide frigorigène", type: "number", placeholder: "Ex: 85", unit: "kg" },
      {
        id: "type_condenseur",
        label: "Type de condenseur",
        type: "select",
        options: ["À air (ventilateurs axiaux)", "À air (ventilateurs centrifuges)", "À eau (tour de refroidissement)", "Évaporatif", "Adiabatique", "Autre"],
        required: true,
      },
      { id: "surface_condenseur", label: "Surface d'échange condenseur", type: "number", placeholder: "Ex: 120", unit: "m²" },
      { id: "nb_ventilateurs", label: "Nombre de ventilateurs condenseur", type: "number", placeholder: "Ex: 6", required: true },
      { id: "puissance_ventilateurs", label: "Puissance totale ventilateurs", type: "number", placeholder: "Ex: 12", unit: "kW" },
      {
        id: "regulation_hp_existante",
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
      {
        id: "etat_installation_existante",
        label: "État général de l'installation existante",
        type: "textarea",
        placeholder: "Décrire l'état des compresseurs, condenseur, détendeurs, tuyauteries, isolation, fuites éventuelles...",
        colSpan: 2,
      },
    ],
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

const QUESTIONNAIRES: Record<FicheId, QuestionSection[]> = {
  "BAT-TH-134": QUESTIONNAIRE_134,
  "BAT-TH-163": QUESTIONNAIRE_163,
};

const PHOTO_CATEGORIES: Record<FicheId, string[]> = {
  "BAT-TH-134": PHOTO_CATEGORIES_134,
  "BAT-TH-163": PHOTO_CATEGORIES_163,
};

// ─── Props ──────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

// ─── PDF Generation ─────────────────────────────────────────────

async function generatePDF(
  fiche: FicheConfig,
  sections: QuestionSection[],
  values: FormValues,
  photos: PhotoItem[],
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  function checkPage(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      y = 20;
    }
  }

  function addFooter(pageNum: number, totalPages: number) {
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(`${fiche.id} — Note de dimensionnement`, margin, footerY);
    doc.text(`${values.ref_projet || "Réf. non définie"} — Page ${pageNum}/${totalPages}`, pageWidth - margin, footerY, { align: "right" });
    doc.text("TERRAKOTTA — Bureau d'étude en rénovation énergétique", pageWidth / 2, footerY, { align: "center" });
  }

  // ─── Page de garde ────────────────────────────────────────
  doc.setFillColor(160, 82, 45);
  doc.rect(0, 0, pageWidth, 55, "F");

  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.text("TERRAKOTTA", margin, 18);
  doc.setFontSize(9);
  doc.text("Bureau d'étude en rénovation énergétique", margin, 25);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NOTE DE DIMENSIONNEMENT", margin, 42);

  doc.setTextColor(50);
  y = 70;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Fiche CEE : ${fiche.id}`, margin, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const sousTitreLines = doc.splitTextToSize(fiche.sousTitre, contentWidth);
  doc.text(sousTitreLines, margin, y);
  y += sousTitreLines.length * 5 + 6;

  doc.setDrawColor(160, 82, 45);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Info box
  const infoData = [
    ["Référence", values.ref_projet || "—"],
    ["Bénéficiaire", values.client_nom || "—"],
    ["Adresse du site", values.adresse || "—"],
    ["Date de visite", values.date_visite || "—"],
    ["Date de la note", values.date_note || "—"],
    ["Rédacteur", values.redacteur || "—"],
  ];
  autoTable(doc, {
    startY: y,
    head: [["Information", "Valeur"]],
    body: infoData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [160, 82, 45], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 245, 235] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 15;

  // ─── Sections du questionnaire ────────────────────────────
  for (const section of sections) {
    checkPage(30);

    doc.setFillColor(160, 82, 45);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(section.titre, margin + 3, y + 5.5);
    doc.setTextColor(50);
    y += 12;

    if (section.description) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text(section.description, margin, y);
      doc.setTextColor(50);
      y += 6;
    }

    const tableData: string[][] = [];
    for (const field of section.fields) {
      const val = values[field.id] || "—";
      const label = field.unit ? `${field.label} (${field.unit})` : field.label;
      tableData.push([label, val]);
    }

    autoTable(doc, {
      startY: y,
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.5, overflow: "linebreak" },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70, textColor: [80, 80, 80] },
        1: { cellWidth: contentWidth - 70 },
      },
      alternateRowStyles: { fillColor: [250, 248, 242] },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.cell.raw === "—") {
          data.cell.styles.textColor = [180, 180, 180];
          data.cell.styles.fontStyle = "italic";
        }
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Annexe photos ────────────────────────────────────────
  if (photos.length > 0) {
    doc.addPage();
    y = 20;

    doc.setFillColor(160, 82, 45);
    doc.rect(0, 0, pageWidth, 15, "F");
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ANNEXE PHOTOGRAPHIQUE", margin, 10);
    doc.setTextColor(50);
    y = 25;

    for (let i = 0; i < photos.length; i++) {
      checkPage(90);

      const photo = photos[i];
      try {
        const imgData = photo.preview;
        doc.addImage(imgData, "JPEG", margin, y, contentWidth, 70, undefined, "MEDIUM");
        y += 73;
      } catch {
        doc.setFontSize(9);
        doc.setTextColor(180);
        doc.text(`[Photo ${i + 1} — impossible de charger l'image]`, margin, y + 35);
        doc.setTextColor(50);
        y += 73;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Photo ${i + 1} — ${photo.categorie}`, margin, y);
      y += 4;
      if (photo.legende) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const legendeLines = doc.splitTextToSize(photo.legende, contentWidth);
        doc.text(legendeLines, margin, y);
        y += legendeLines.length * 3.5;
      }
      y += 10;
    }
  }

  // ─── Footers ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // ─── Download ─────────────────────────────────────────────
  const filename = `Note_Dimensionnement_${fiche.id}_${values.ref_projet || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ─── Component ──────────────────────────────────────────────────

export default function NoteDimensionnement({ onBack }: Props) {
  const [selectedFiche, setSelectedFiche] = useState<FicheId | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [values, setValues] = useState<FormValues>({});
  const [saved, setSaved] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showPhotos, setShowPhotos] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const handleAddPhotos = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newPhoto: PhotoItem = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview: reader.result as string,
          legende: "",
          categorie: "Autre",
        };
        setPhotos((prev) => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  }, []);

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePhotoLegende(id: string, legende: string) {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, legende } : p));
  }

  function updatePhotoCategorie(id: string, categorie: string) {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, categorie } : p));
  }

  async function handleGeneratePDF() {
    if (!selectedFiche) return;
    setGenerating(true);
    try {
      const fiche = FICHES.find((f) => f.id === selectedFiche)!;
      const sections = QUESTIONNAIRES[selectedFiche];
      await generatePDF(fiche, sections, values, photos);
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
                  setPhotos([]);
                  setShowPhotos(false);
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
  const currentSection = showPhotos ? null : sections[activeSection];

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
          <Button variant="ghost" size="sm" onClick={() => { setSelectedFiche(null); setShowPhotos(false); }}>
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
              {photos.length > 0 && ` — ${photos.length} photo${photos.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            {saved ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> : <Save className="mr-2 h-4 w-4" />}
            {saved ? "Sauvegardé" : "Sauvegarder"}
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
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">
                    {i + 1}
                  </span>
                )}
                <span className="truncate">{section.titre}</span>
              </button>
            );
          })}

          {/* Bouton Photos */}
          <button
            onClick={() => setShowPhotos(true)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors mt-2 border-t pt-3",
              showPhotos
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Camera className="h-4 w-4 shrink-0" />
            <span className="truncate">Photos du dossier</span>
            {photos.length > 0 && (
              <Badge variant="outline" className="ml-auto text-[10px]">
                {photos.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Contenu */}
        <AnimatePresence mode="wait">
          {showPhotos ? (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Photos du dossier
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez des photos de l&apos;installation existante, du matériel projeté, des plaques signalétiques, etc.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload button */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Ajouter des photos</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG — Cliquez ou glissez-déposez</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddPhotos}
                    />
                  </div>

                  {/* Photo grid */}
                  {photos.length > 0 && (
                    <div className="space-y-4">
                      {photos.map((photo, i) => (
                        <div key={photo.id} className="flex gap-4 rounded-lg border p-3">
                          <div className="relative w-32 h-24 shrink-0 rounded-md overflow-hidden bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.preview}
                              alt={photo.legende || `Photo ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removePhoto(photo.id)}
                              className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white shadow-sm"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">Photo {i + 1}</span>
                            </div>
                            <select
                              value={photo.categorie}
                              onChange={(e) => updatePhotoCategorie(photo.id, e.target.value)}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                            >
                              {photoCategories.map((cat) => (
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
