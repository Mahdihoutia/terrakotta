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
      {
        id: "presence_cta", label: "Présence d\u0027une CTA", type: "select",
        options: ["Oui", "Non"],
      },
      {
        id: "type_cta", label: "Type de CTA", type: "select",
        options: ["CTA simple flux", "CTA double flux", "CTA double flux avec récupération de chaleur", "Rooftop"],
      },
      { id: "marque_modele_cta", label: "Marque / Modèle CTA", type: "text", placeholder: "Ex : Aldes DFE 600, France Air Cocoon..." },
      { id: "puissance_cta", label: "Puissance CTA (kW)", type: "text", placeholder: "Ex : 12 kW" },
      { id: "debit_cta", label: "Débit d\u0027air CTA (m³/h)", type: "text", placeholder: "Ex : 3000 m³/h" },
      {
        id: "etat_cta", label: "État de la CTA", type: "select",
        options: ["Bon état", "Usé / vieillissant", "Encrassé", "Hors service"],
      },
      { id: "annee_installation_cta", label: "Année d\u0027installation CTA", type: "text", placeholder: "Ex : 2008" },
      { id: "observations_cta", label: "Observations CTA", type: "textarea", colSpan: 2, placeholder: "Filtres, registres, gaine, calorifugeage, régulation, programmation horaire..." },
      { id: "observations_ventilation", label: "Observations ventilation", type: "textarea", colSpan: 2, placeholder: "Condensation, moisissures, courants d\u0027air, qualité de l\u0027air intérieur..." },
    ],
  },
  {
    titre: "10. Groupe froid",
    description: "Installation frigorifique du bâtiment (si applicable)",
    fields: [
      {
        id: "presence_groupe_froid", label: "Présence d\u0027un groupe froid", type: "select", required: true,
        options: ["Oui", "Non"],
      },
      {
        id: "type_groupe_froid", label: "Type de groupe froid", type: "select",
        options: ["Groupe à condensation à air", "Groupe à condensation à eau", "Centrale frigorifique", "Groupe semi-hermétique", "Groupe à vis", "Rooftop", "Autre"],
      },
      { id: "nb_groupes_froid", label: "Nombre de groupes froid", type: "text", placeholder: "Ex : 2" },
      { id: "marque_modele_gf", label: "Marque / Modèle", type: "text", placeholder: "Ex : Carrier 30RBS, Daikin EWAD..." },
      { id: "puissance_froid", label: "Puissance frigorifique (kW)", type: "text", placeholder: "Ex : 150 kW" },
      { id: "puissance_absorbee_gf", label: "Puissance électrique absorbée (kW)", type: "text", placeholder: "Ex : 50 kW" },
      {
        id: "fluide_frigorigene", label: "Fluide frigorigène", type: "select",
        options: ["R-410A", "R-407C", "R-134a", "R-404A", "R-32", "R-448A", "R-449A", "R-744 (CO₂)", "R-290 (propane)", "Autre"],
      },
      { id: "charge_fluide", label: "Charge en fluide (kg)", type: "text", placeholder: "Ex : 45 kg" },
      {
        id: "type_condenseur_gf", label: "Type de condenseur", type: "select",
        options: ["À air (ventilateurs axiaux)", "À air (ventilateurs centrifuges)", "À eau (tour de refroidissement)", "Évaporatif", "Adiabatique"],
      },
      { id: "annee_installation_gf", label: "Année d\u0027installation", type: "text", placeholder: "Ex : 2012" },
      {
        id: "etat_groupe_froid", label: "État du groupe froid", type: "select",
        options: ["Bon état", "Usé / vieillissant", "Encrassé", "Fuites détectées", "Hors service"],
      },
      {
        id: "type_distribution_froid", label: "Type de distribution", type: "select",
        options: ["Réseau d\u0027eau glacée", "Détente directe", "Volume Réfrigérant Variable (VRV/VRF)", "Mixte"],
      },
      { id: "emetteurs_froid", label: "Émetteurs de froid", type: "text", placeholder: "Ventilo-convecteurs, cassettes, gainable, splits..." },
      { id: "regulation_froid", label: "Régulation / GTB", type: "text", placeholder: "Type de régulation, programmation horaire, consignes..." },
      { id: "observations_groupe_froid", label: "Observations", type: "textarea", colSpan: 2, placeholder: "État général, nuisances sonores, entretien, conformité réglementaire, fuites, contrôle d\u0027étanchéité..." },
    ],
  },
  {
    titre: "11. Préconisations et conclusion",
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

// ─── Littérature / prose contextualisée ────────────────────────

const PREAMBULE_INTRO =
  "Le présent rapport retranscrit les constats réalisés lors de la visite technique du bâtiment. Il a pour objet de dresser un état des lieux objectif de l'enveloppe et des équipements énergétiques, d'identifier les pathologies et points d'amélioration, puis de formuler un bouquet de préconisations cohérent avec les usages, le budget et les objectifs réglementaires du maître d'ouvrage.";

const PREAMBULE_METHODE =
  "La démarche suit une logique d'audit in situ : relevé visuel contradictoire, prise de photographies datées, recueil documentaire lorsque disponible (factures, DPE antérieurs, plans), et recoupement avec les exigences réglementaires en vigueur. Les chiffres et repères utilisés s'appuient sur les référentiels RE2020, DPE 2021 et Décret Tertiaire 2019. Aucun calcul thermique dynamique n'est engagé à ce stade : les ordres de grandeur énergétiques indiqués dans les préconisations devront, le cas échéant, être précisés par une étude thermique (STD, DTG ou audit RGE).";

const PREAMBULE_LECTURE =
  "Le document s'organise en onze sections thématiques. Les six premières décrivent l'existant (enveloppe, systèmes, ventilation, froid) ; la septième synthétise les préconisations, leur priorisation et les aides financières mobilisables. Chaque constat est, autant que possible, illustré par une ou plusieurs photographies annexées au fil du rapport. La conclusion dresse l'avis technique global et trace les prochaines étapes opérationnelles.";

const SECTION_PROSE: Record<number, string> = {
  0: "Cadre administratif de la visite : identification du bénéficiaire, du bien et du rédacteur. Ces éléments conditionnent la recevabilité du document dans les dispositifs d'aides.",
  1: "La description du bâti oriente l'analyse thermique à venir : année de construction, surface, orientation et mitoyenneté déterminent le potentiel de rénovation et les déperditions attendues.",
  2: "Les murs représentent 20 à 25 % des déperditions d'un bâtiment non isolé. L'objectif est d'identifier la composition existante, les pathologies éventuelles et le mode d'isolation le plus adapté.",
  3: "La toiture concentre 25 à 30 % des déperditions d'un logement mal isolé. C'est généralement le chantier le plus rentable et le point de départ naturel d'une rénovation performante.",
  4: "Les menuiseries jouent un double rôle : isolation thermique (Uw) et étanchéité à l'air. Simple vitrage ou double vitrage ancien constituent des cibles d'amélioration prioritaires.",
  5: "Le plancher bas représente 7 à 10 % des déperditions et influence le confort au sol. Son traitement dépend de la configuration (terre-plein, vide sanitaire, sous-sol) et de l'accessibilité.",
  6: "Le chauffage est le premier poste de consommation (≈ 66 % en résidentiel). L'audit porte sur la technologie, l'âge, la régulation et la cohérence avec l'enveloppe, en cohérence avec la trajectoire de décarbonation.",
  7: "L'ECS pèse 10 à 15 % de la consommation, davantage en bâtiment à forte occupation. Les solutions décarbonées (thermodynamique, solaire, PAC) constituent un gisement d'économie encore sous-exploité.",
  8: "La ventilation protège le bâti, garantit la qualité de l'air et conditionne la performance réelle de l'isolation. Une enveloppe étanche sans renouvellement d'air maîtrisé produit pathologies et dégradations.",
  9: "La production de froid, lorsqu'elle existe, constitue un poste électrique notable et relève de réglementations spécifiques (fluides frigorigènes, F-Gaz). L'audit vise la performance (EER, SEER) et la conformité.",
  10: "Les préconisations ordonnent les actions selon un triple critère : urgence technique, rentabilité énergétique et éligibilité aux aides. Le séquençage privilégie la logique « d'abord l'enveloppe, puis les systèmes ».",
};

const METHODOLOGIE_CLOSING =
  "Le présent rapport rend compte de constats visuels effectués sans démontage ni investigation destructive. Les valeurs d'épaisseur d'isolant, de performance d'équipement ou d'étanchéité à l'air indiquées reposent sur les éléments accessibles lors de la visite et sur la documentation transmise par le bénéficiaire. Un audit énergétique réglementaire, une étude thermique dynamique ou un test d'infiltrométrie permettront, au besoin, de fiabiliser ces données avant phase travaux.";


// ─── PDF Generation ─────────────────────────────────────────────

async function generatePDF(
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
    drawCallout,
    getDataTableConfig,
    needsPageBreak,
    resetTextState,
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

  // ─── Page 1 : Cover ──────────────────────────────────────
  drawCoverPage(
    doc,
    "Rapport de visite technique",
    "Constat de l'existant et preconisations de travaux",
    [
      ["Reference",    reference],
      ["Beneficiaire", values.client_nom       || "—"],
      ["Adresse",      values.adresse          || "—"],
      ["Date visite",  values.date_visite      || "—"],
      ["Redacteur",    values.redacteur        || "—"],
      ["Telephone",    values.client_telephone || "—"],
    ],
    reference,
  );

  // ─── Page 2 : Sommaire (filled after content) ────────────
  doc.addPage();
  const tocPageNum = doc.getNumberOfPages();

  // ─── Page 3+ : Content ───────────────────────────────────
  doc.addPage();
  let y: number = PDF_LAYOUT.topMargin;
  const tocEntries: { title: string; page: number }[] = [];

  // ─── Préambule littéraire ─────────────────────────────────
  tocEntries.push({ title: "Préambule", page: doc.getNumberOfPages() - 1 });
  y = drawSectionHeader(doc, "Préambule", y, "Objet, méthodologie et clé de lecture du rapport");
  y = drawProse(doc, PREAMBULE_INTRO, y, { spacingAfter: 4 });
  y = drawProse(doc, PREAMBULE_METHODE, y, { spacingAfter: 4 });
  y = drawProse(doc, PREAMBULE_LECTURE, y, { spacingAfter: 4 });
  y = drawCallout(
    doc,
    "Ce rapport ne vaut ni diagnostic de performance énergétique (DPE) ni audit énergétique réglementaire. Il constitue une base technique pour orienter les arbitrages de rénovation et préparer les études détaillées à venir.",
    y,
    { title: "Portée du document" },
  );
  y += PDF_LAYOUT.sectionGap - 6;

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
    const photos = sectionPhotos[sIdx] || [];
    if (tableData.length === 0 && freeText.length === 0 && photos.length === 0) continue;

    checkPage(40);
    tocEntries.push({ title: section.titre, page: doc.getNumberOfPages() - 1 });
    y = drawSectionHeader(doc, section.titre, y, section.description);

    // Paragraphe de contextualisation (littérature)
    const prose = SECTION_PROSE[sIdx];
    if (prose) {
      checkPage(30);
      y = drawProse(doc, prose, y, { italic: true, size: 8.5, spacingAfter: 5 });
    }

    // Tableau synthétique des saisies structurées
    if (tableData.length > 0) {
      autoTable(doc, getDataTableConfig(y, tableData, contentWidth));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 6;
      resetTextState(doc);
    }

    // Champs libres (observations, descriptions) — rendus en prose
    for (const ft of freeText) {
      checkPage(30);
      y = drawProse(doc, ft.label, y, { size: 9, spacingAfter: 1 });
      y = drawProse(doc, ft.text, y, { size: 9.5, spacingAfter: 4 });
    }

    // Photos de cette section
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        checkPage(85);
        y = await drawPhotoEntry(doc, i, photos[i].preview, photos[i].categorie, photos[i].legende, y);
      }
    }

    y += PDF_LAYOUT.sectionGap - 6;
  }

  // ─── Clôture méthodologique ───────────────────────────────
  checkPage(50);
  tocEntries.push({ title: "Réserves et suites à donner", page: doc.getNumberOfPages() - 1 });
  y = drawSectionHeader(doc, "Réserves et suites à donner", y);
  y = drawProse(doc, METHODOLOGIE_CLOSING, y, { spacingAfter: 4 });
  y = drawCallout(
    doc,
    "La mise en œuvre des préconisations suppose une étude de conception approfondie (dimensionnement, vérification de la faisabilité technique, coordination des lots) et, le cas échéant, le dépôt d'un dossier de financement auprès des dispositifs d'aides mobilisables.",
    y,
    { title: "Prochaine étape" },
  );

  // ─── Fill sommaire page ───────────────────────────────────
  doc.setPage(tocPageNum);
  drawSommaire(doc, tocEntries, "Rapport de visite technique", reference);

  // ─── Footers (skip page 1 = dark cover) ──────────────────
  const totalPages = doc.getNumberOfPages();
  const contentPages = totalPages - 1;
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Rapport de visite technique", reference, i - 1, contentPages);
  }

  const filename = `Rapport_Visite_${values.ref_rapport || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ─── Component ──────────────────────────────────────────────────

export default function RapportVisite({ onBack, onSaved, existingDoc }: Props) {
  const [activeSection, setActiveSection] = useState(0);
  const [values, setValues] = useState<FormValues>(() => {
    if (existingDoc?.donnees) {
      try {
        const parsed = JSON.parse(existingDoc.donnees);
        // Remove internal keys
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
              id: p.id,
              file: new File([], "restored"),
              preview: p.preview,
              legende: p.legende,
              categorie: p.categorie,
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
    setSaving(true);
    try {
      const titre = values.ref_rapport
        ? `Visite technique — ${values.client_nom || "Sans client"}`
        : "Rapport de visite (brouillon)";
      const reference = values.ref_rapport || `RV-${Date.now().toString(36).toUpperCase()}`;
      // Serialize photos (sans File object) dans donnees
      const photosToSave: Record<number, Array<{ id: string; preview: string; legende: string; categorie: string }>> = {};
      for (const [key, photos] of Object.entries(sectionPhotos)) {
        if (photos.length > 0) {
          photosToSave[Number(key)] = photos.map((p) => ({ id: p.id, preview: p.preview, legende: p.legende, categorie: p.categorie }));
        }
      }
      const donnees = JSON.stringify({ ...values, _sectionPhotos: Object.keys(photosToSave).length > 0 ? photosToSave : undefined });

      if (docId) {
        // Update existing
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

  function removePhoto(sectionIdx: number, id: string) {
    setSectionPhotos((prev) => ({
      ...prev,
      [sectionIdx]: (prev[sectionIdx] || []).filter((p) => p.id !== id),
    }));
  }

  function updatePhotoLegende(sectionIdx: number, id: string, legende: string) {
    setSectionPhotos((prev) => ({
      ...prev,
      [sectionIdx]: (prev[sectionIdx] || []).map((p) => (p.id === id ? { ...p, legende } : p)),
    }));
  }

  function updatePhotoCategorie(sectionIdx: number, id: string, categorie: string) {
    setSectionPhotos((prev) => ({
      ...prev,
      [sectionIdx]: (prev[sectionIdx] || []).map((p) => (p.id === id ? { ...p, categorie } : p)),
    }));
  }

  async function handleGeneratePDF() {
    setGenerating(true);
    try {
      await generatePDF(SECTIONS, values, sectionPhotos);
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

  const currentSection = SECTIONS[activeSection];
  const totalPhotos = Object.values(sectionPhotos).reduce((sum, arr) => sum + arr.length, 0);
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
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">{i + 1}</span>
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

        {/* Content */}
        <AnimatePresence mode="wait">
          {currentSection ? (
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
                            <div className="relative w-28 h-20 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.preview} alt={photo.legende || `Photo ${i + 1}`} className="max-w-full max-h-full object-contain" />
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
                                {PHOTO_CATEGORIES.map((cat) => (
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
