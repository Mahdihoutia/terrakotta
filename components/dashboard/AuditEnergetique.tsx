"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  FileType,
  Camera,
  X,
  ImagePlus,
  Loader2,
  Plus,
  Star,
  Trash2,
  Target,
  Building2,
  Sparkles,
} from "lucide-react";
import { exportToWord, type WordSectionInput, type WordChart } from "@/lib/word-export";
import ValidationBanner, { type ValidationItem } from "./audit/ValidationBanner";
import SuggestionsPanel from "./audit/SuggestionsPanel";
import BatimentTypePicker from "./audit/BatimentTypePicker";
import FicheChoiceDialog from "./audit/FicheChoiceDialog";
import DpeGesMatrix, { parseDpeLetter, type Letter as DpeGesLetter } from "./audit/DpeGesMatrix";
import {
  detectFichesCandidates,
  mapAuditToNote,
  type FicheCandidate,
} from "@/lib/thermal/audit-to-note-mapping";
import {
  computeSuggestions,
  getFieldIssue,
  type Suggestion,
} from "@/lib/thermal";
import type { PreconisationAction } from "@/lib/pdf-styles";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  calculerDeperditions,
  calculerApportsSolaires,
  calculerBesoinsChauffage,
  calculerDpe,
  estimerPontsForfaitaire,
  mapIsolationMurLabel,
  parseZone,
  vecteurFromLabel,
  checkSommeDeperditions,
  checkEcartFactureCalc,
  checkCoherenceUMurs,
  U_MURS,
  U_TOITURE,
  U_VITRAGE,
  U_PLANCHER,
  RENDEMENTS_GENERATEURS,
  type ApportSolaireResult,
  type DeperditionsResult,
  type BesoinsChauffageResult,
  type DpeResult,
} from "@/lib/thermal";

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

// ─── Préconisations structurées (catalogue d'actions) ──────────

const PRECO_FAMILLES: Array<{ key: string; prefix: string; label: string }> = [
  { key: "Enveloppe",        prefix: "ENV", label: "Enveloppe (isolation, étanchéité)" },
  { key: "Chauffage",        prefix: "CHA", label: "Chauffage" },
  { key: "Climatisation",    prefix: "CLI", label: "Climatisation" },
  { key: "Ventilation",      prefix: "VEN", label: "Ventilation" },
  { key: "Eclairage",        prefix: "ECL", label: "Éclairage" },
  { key: "ECS",              prefix: "ECS", label: "Eau chaude sanitaire" },
  { key: "Regulation / GTB", prefix: "REG", label: "Régulation / GTB" },
  { key: "ENR",              prefix: "ENR", label: "Énergies renouvelables" },
  { key: "Comportemental",   prefix: "COM", label: "Comportemental / usages" },
];

const PRECO_HORIZONS = [
  "Immédiat (< 3 mois)",
  "Court terme (3-12 mois)",
  "Moyen terme (1-3 ans)",
  "Long terme (3-10 ans)",
];
const PRECO_FAISABILITE = ["Facile", "Moyenne", "Difficile"];
const PRECO_RESPONSABILITES = ["Propriétaire", "Locataire", "ADB (annexe bail)", "Mixte"];

function nextPrecoCode(list: PreconisationAction[], famille: string): string {
  const prefix = PRECO_FAMILLES.find((f) => f.key === famille)?.prefix ?? "ACT";
  const existing = list.filter((a) => a.code.startsWith(prefix + "-"));
  const nums = existing
    .map((a) => parseInt(a.code.slice(prefix.length + 1), 10))
    .filter((n) => !isNaN(n));
  const n = nums.length === 0 ? 1 : Math.max(...nums) + 1;
  return `${prefix}-${String(n).padStart(2, "0")}`;
}

// ─── Sections ───────────────────────────────────────────────────

const SECTIONS: QuestionSection[] = [
  {
    titre: "1. Informations générales",
    description: "Identification du bâtiment et du commanditaire",
    fields: [
      { id: "ref_audit", label: "Référence de l'audit", type: "text", placeholder: "Ex: AU-2026-XXX", required: true },
      {
        id: "type_audit",
        label: "Type d'audit",
        type: "select",
        required: true,
        options: [
          "Tertiaire / Industrie — NF EN 16247-1/2 (Décret Tertiaire, DEET)",
          "Résidentiel collectif — audit énergétique réglementaire (logements ≥ 2 lots)",
        ],
        help: "Conditionne les référentiels applicables et le niveau de détail attendu (étanchéité à l'air, ACV, Décret Tertiaire).",
        colSpan: 2,
      },
      { id: "regime_reglementaire", label: "Régime réglementaire applicable", type: "select", options: ["Audit énergétique obligatoire (Code de l'énergie L233-1, entreprises > 250 sal.)", "Décret Tertiaire (DEET) — bât. > 1000 m²", "Audit incitatif (aide, CEE, MPR Copro)", "Audit volontaire"] },
      { id: "date_visite", label: "Date de visite", type: "date", required: true },
      { id: "redacteur", label: "Auditeur / Rédacteur", type: "text", placeholder: "Nom et qualification", required: true },
      { id: "redacteur_qualif", label: "Qualification de l'auditeur", type: "select", options: ["OPQIBI 1905 — Audit énergétique bâtiment tertiaire", "OPQIBI 1906 — Audit énergétique bâtiment industriel", "OPQIBI 0901 — Étude thermique réglementaire", "Qualibat 8731", "Autre"], help: "Obligatoire pour les audits réglementaires et incitatifs." },
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
    titre: "4. Étanchéité à l'air & apports",
    description: "Mesures d'infiltrométrie et bilan d'apports solaires / internes (EN 13829 / EN ISO 52016)",
    fields: [
      { id: "test_infiltrometrie", label: "Test d'infiltrométrie réalisé ?", type: "select", options: ["Non réalisé — valeurs estimées", "Oui — par tiers certifié Qualibat 8721", "Oui — mesure de réception (livraison)", "Oui — audit a posteriori"], required: true },
      { id: "n50", label: "n50 — taux de renouvellement à 50 Pa", type: "number", placeholder: "Ex: 3.5", unit: "vol/h", help: "Cible RT2012/RE2020 : ≤ 0,6 (indiv.) / ≤ 1,0 (collectif)" },
      { id: "q4pa_surf", label: "Q4Pa-surf — perméabilité", type: "number", placeholder: "Ex: 1.2", unit: "m³/(h·m²)", help: "Référence RT2012 : 1,0 indiv. — 1,7 collectif / tertiaire" },
      { id: "date_test_infiltro", label: "Date du test", type: "date" },
      { id: "operateur_infiltro", label: "Opérateur mesure", type: "text", placeholder: "Nom, n° Qualibat 8721" },
      { id: "defauts_identifies", label: "Défauts d'étanchéité identifiés", type: "textarea", colSpan: 2, placeholder: "Jonctions menuiseries, passages de gaines, trappe de comble, boîtiers électriques..." },
      { id: "surface_vitree_totale", label: "Surface vitrée totale", type: "number", placeholder: "Ex: 35", unit: "m²", required: true },
      { id: "surface_vitree_sud", label: "Dont orientation Sud", type: "number", placeholder: "Ex: 18", unit: "m²", help: "Apports solaires majeurs en saison de chauffe" },
      { id: "surface_vitree_est", label: "Dont orientation Est", type: "number", placeholder: "Ex: 6", unit: "m²" },
      { id: "surface_vitree_ouest", label: "Dont orientation Ouest", type: "number", placeholder: "Ex: 6", unit: "m²", help: "Attention risque de surchauffe estivale" },
      { id: "surface_vitree_nord", label: "Dont orientation Nord", type: "number", placeholder: "Ex: 5", unit: "m²" },
      { id: "facteur_solaire_g", label: "Facteur solaire moyen (g)", type: "number", placeholder: "Ex: 0.55", unit: "—", help: "Double vitrage standard ≈ 0,60 ; triple ≈ 0,50 ; contrôle solaire ≈ 0,35" },
      { id: "masques_proches", label: "Masques solaires proches (débords, loggia, brise-soleil)", type: "select", options: ["Aucun", "Casquettes fixes", "Brise-soleil orientables", "Loggia / retrait", "Stores intérieurs"] },
      { id: "masques_lointains", label: "Masques lointains (bâtiments, relief, végétation)", type: "textarea", colSpan: 2, placeholder: "Décrire l'impact par orientation (hauteur angulaire des obstacles, saisons concernées)" },
      { id: "apports_internes_occup", label: "Apports internes — densité d'occupation", type: "number", placeholder: "Ex: 12", unit: "m²/occ.", help: "Tertiaire bureaux : 10–15 m²/pers. ; enseignement : 2–3 m²/pers." },
      { id: "apports_internes_equip", label: "Apports internes — équipements", type: "number", placeholder: "Ex: 15", unit: "W/m²", help: "Bureaux : 10–20 W/m² (PC + éclairage) ; commerces : 25–40 W/m²" },
      { id: "scenario_occupation", label: "Scénario d'occupation", type: "select", options: ["Bureaux 8h-18h, 5j/7", "Occupation continue 24h/24", "Intermittence forte (scolaire, hôtellerie)", "Saisonnière", "Autre"] },
      { id: "synthese_apports", label: "Synthèse des gains gratuits et préconisations", type: "textarea", colSpan: 2, placeholder: "Exploitation des apports solaires hivernaux, protections estivales à mettre en place, risques de surchauffe identifiés..." },
    ],
  },
  {
    titre: "5. Systèmes énergétiques",
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
      { id: "presence_groupe_froid", label: "Groupe froid", type: "select", options: ["Aucun", "Groupe à condensation à air", "Groupe à condensation à eau", "Centrale frigorifique", "Rooftop", "Autre"] },
      { id: "gf_marque_modele", label: "Groupe froid — Marque / modèle", type: "text", placeholder: "Ex: Carrier 30RBS 120" },
      { id: "gf_puissance", label: "Puissance froid", type: "number", placeholder: "Ex: 150", unit: "kW" },
      { id: "gf_fluide", label: "Fluide frigorigène", type: "select", options: ["R-410A", "R-407C", "R-134a", "R-404A", "R-32", "R-744 (CO₂)", "Autre"] },
      { id: "gf_annee", label: "Année installation GF", type: "number", placeholder: "Ex: 2012" },
      { id: "gf_etat", label: "État groupe froid", type: "select", options: ["Bon état", "Usé / vieillissant", "Encrassé", "Hors service"] },
      { id: "observations_systemes", label: "Observations sur les systèmes", type: "textarea", colSpan: 2, placeholder: "État des équipements, entretien, dysfonctionnements observés..." },
    ],
  },
  {
    titre: "6. Consommations et étiquettes énergétiques",
    description: "Bilan énergétique annuel et classement DPE/GES officiels (Arrêté 31 mars 2021)",
    fields: [
      { id: "conso_totale", label: "Consommation totale énergie primaire", type: "number", placeholder: "Ex: 22000", unit: "kWhEP/an", required: true },
      { id: "conso_par_m2", label: "Consommation par m²", type: "number", placeholder: "Ex: 280", unit: "kWhEP/m²/an", required: true, help: "Auto-calculé si conso totale + SHAB sont renseignés" },
      { id: "facture_annuelle", label: "Facture énergétique annuelle", type: "number", placeholder: "Ex: 2800", unit: "€/an" },
      { id: "source_conso", label: "Source des données", type: "select", required: true, options: ["Factures (3 ans)", "Factures (1 an)", "Estimation par calcul", "DPE existant", "Compteurs dédiés"] },
      { id: "dpe_actuel", label: "Étiquette DPE actuelle", type: "select", required: true, options: ["A — ≤ 70 kWhEP/m²/an", "B — 71 à 110", "C — 111 à 180", "D — 181 à 250", "E — 251 à 330", "F — 331 à 420", "G — > 420"], help: "Auto-déterminé à partir de la conso/m²" },
      { id: "emissions_co2", label: "Émissions CO₂ annuelles totales", type: "number", placeholder: "Ex: 4200", unit: "kgCO₂/an" },
      { id: "emissions_co2_m2", label: "Émissions par m²", type: "number", placeholder: "Ex: 35", unit: "kgCO₂/m²/an", help: "Auto-calculé si CO₂ total + SHAB sont renseignés" },
      { id: "ges_actuel", label: "Étiquette GES actuelle", type: "select", required: true, options: ["A — ≤ 6 kgCO₂/m²/an", "B — 7 à 11", "C — 12 à 30", "D — 31 à 50", "E — 51 à 70", "F — 71 à 100", "G — > 100"], help: "Auto-déterminée à partir des émissions/m²" },
    ],
  },
  {
    titre: "7. Répartition des consommations par poste",
    description: "Ventilation des consommations selon les 5 postes réglementaires (méthodologie 3CL-DPE)",
    fields: [
      { id: "poste_chauffage", label: "Chauffage", type: "number", placeholder: "Ex: 12000", unit: "kWh/an", required: true, help: "Poste 1 — généralement 50 à 75 % du total" },
      { id: "poste_ecs", label: "Eau chaude sanitaire", type: "number", placeholder: "Ex: 3500", unit: "kWh/an", required: true, help: "Poste 2 — généralement 10 à 15 %" },
      { id: "poste_refroidissement", label: "Refroidissement / climatisation", type: "number", placeholder: "Ex: 0", unit: "kWh/an", help: "Poste 3 — 0 si absence" },
      { id: "poste_eclairage", label: "Éclairage", type: "number", placeholder: "Ex: 800", unit: "kWh/an", help: "Poste 4 — 3 à 5 %" },
      { id: "poste_auxiliaires", label: "Auxiliaires (ventilation, circulateurs)", type: "number", placeholder: "Ex: 400", unit: "kWh/an", help: "Poste 5 — 1 à 3 %" },
      { id: "poste_autres", label: "Autres usages (électroménager, multimédia)", type: "number", placeholder: "Ex: 2500", unit: "kWh/an", help: "Hors champ DPE — pour information" },
      { id: "commentaire_postes", label: "Commentaires / hypothèses", type: "textarea", colSpan: 2, placeholder: "Méthode de répartition (compteurs dédiés, sous-compteurs, estimation par rendement)..." },
    ],
  },
  {
    titre: "8. Bilan thermique — déperditions par paroi",
    description: "Part relative des déperditions pour chaque élément de l'enveloppe (méthode Th-BCE)",
    fields: [
      { id: "deperd_murs", label: "Murs extérieurs", type: "number", placeholder: "Ex: 25", unit: "%", required: true, help: "Généralement 20-25 % en l'absence d'ITE/ITI" },
      { id: "deperd_toiture", label: "Toiture / combles", type: "number", placeholder: "Ex: 30", unit: "%", required: true, help: "Généralement 25-30 % non isolé" },
      { id: "deperd_plancher", label: "Plancher bas", type: "number", placeholder: "Ex: 10", unit: "%", required: true, help: "Généralement 7-10 %" },
      { id: "deperd_menuiseries", label: "Menuiseries (fenêtres, portes)", type: "number", placeholder: "Ex: 13", unit: "%", required: true, help: "Généralement 10-15 %" },
      { id: "deperd_ponts", label: "Ponts thermiques", type: "number", placeholder: "Ex: 7", unit: "%", required: true, help: "Généralement 5-10 %" },
      { id: "deperd_ventilation", label: "Ventilation (VMC)", type: "number", placeholder: "Ex: 10", unit: "%", required: true, help: "Généralement 10-15 %" },
      { id: "deperd_infiltrations", label: "Renouvellement d'air / infiltrations", type: "number", placeholder: "Ex: 5", unit: "%", required: true, help: "Généralement 3-8 %" },
      { id: "ubat", label: "Coefficient Ubat moyen estimé", type: "number", placeholder: "Ex: 1.2", unit: "W/m².K", help: "Moyenne pondérée par surfaces" },
      { id: "commentaire_deperditions", label: "Commentaires et hiérarchie des priorités", type: "textarea", colSpan: 2, placeholder: "Identifier les postes prioritaires d'intervention au regard des parts de déperdition les plus élevées..." },
    ],
  },
  {
    titre: "9. Bilan carbone — ACV et scopes 1/2/3",
    description: "Empreinte carbone du bâtiment selon les 3 scopes GHG Protocol + ACV matériaux (RE2020 / EN 15978)",
    fields: [
      { id: "acv_perimetre", label: "Périmètre du bilan", type: "select", required: true, options: ["Scopes 1+2 (énergie directe + électricité)", "Scopes 1+2+3 partiel", "Scopes 1+2+3 complet", "ACV bâtiment complète (EN 15978 — tous modules A→D)"] },
      { id: "acv_annee_ref", label: "Année de référence du bilan", type: "number", placeholder: "Ex: 2025" },
      { id: "acv_facteurs_source", label: "Source des facteurs d'émission", type: "select", options: ["Base Carbone ADEME (à jour)", "Base INIES — FDES produits", "Facteurs Bilan Carbone V8", "RE2020 — fiche de données environnementales", "Mixte"] },
      { id: "scope1_combustibles", label: "Scope 1 — Combustion directe (chauffage, ECS)", type: "number", placeholder: "Ex: 12.5", unit: "tCO₂e/an", help: "Gaz naturel : 0,204 kgCO₂e/kWh PCI ; fioul : 0,272 ; propane : 0,230" },
      { id: "scope1_fluides", label: "Scope 1 — Fuites fluides frigorigènes", type: "number", placeholder: "Ex: 0.8", unit: "tCO₂e/an", help: "Taux de fuite × PRG (R-410A = 2 088 ; R-32 = 675 ; R-744 = 1)" },
      { id: "scope1_mobilite", label: "Scope 1 — Véhicules de service / flotte", type: "number", placeholder: "Ex: 1.2", unit: "tCO₂e/an" },
      { id: "scope2_electricite", label: "Scope 2 — Électricité consommée", type: "number", placeholder: "Ex: 4.2", unit: "tCO₂e/an", help: "Mix France moyen 2024 : ~60 gCO₂e/kWh (Base Carbone)" },
      { id: "scope2_reseaux", label: "Scope 2 — Réseau de chaleur / froid urbain", type: "number", placeholder: "Ex: 0", unit: "tCO₂e/an", help: "Facteur d'émission spécifique au réseau (arrêté DPE réseaux)" },
      { id: "scope3_amont_energie", label: "Scope 3 — Amont des énergies (extraction, transport)", type: "number", placeholder: "Ex: 2.1", unit: "tCO₂e/an" },
      { id: "scope3_deplacements", label: "Scope 3 — Déplacements domicile-travail / visiteurs", type: "number", placeholder: "Ex: 8.5", unit: "tCO₂e/an" },
      { id: "scope3_dechets", label: "Scope 3 — Déchets d'activité", type: "number", placeholder: "Ex: 0.6", unit: "tCO₂e/an" },
      { id: "scope3_achats", label: "Scope 3 — Achats de biens & services", type: "number", placeholder: "Ex: 5.4", unit: "tCO₂e/an" },
      { id: "acv_materiaux_a13", label: "Matériaux — Production (A1-A3)", type: "number", placeholder: "Ex: 25", unit: "kgCO₂e/m²·an", help: "ACV bâtiment — matériaux rénovation amortis sur durée de vie" },
      { id: "acv_travaux_a45", label: "Chantier — Transport & mise en œuvre (A4-A5)", type: "number", placeholder: "Ex: 3", unit: "kgCO₂e/m²·an" },
      { id: "acv_exploitation_b", label: "Exploitation (B — usage)", type: "number", placeholder: "Ex: 12", unit: "kgCO₂e/m²·an" },
      { id: "acv_fin_de_vie_cd", label: "Fin de vie & bénéfices (C+D)", type: "number", placeholder: "Ex: 2", unit: "kgCO₂e/m²·an" },
      { id: "total_ges_annuel", label: "Total GES annuel (scopes 1+2+3)", type: "number", placeholder: "Ex: 35.3", unit: "tCO₂e/an", required: true },
      { id: "intensite_carbone_m2", label: "Intensité carbone par m²", type: "number", placeholder: "Ex: 42", unit: "kgCO₂e/m²·an", help: "Décret Tertiaire — seuil indicatif bureaux : ≤ 30 kgCO₂e/m²·an" },
      { id: "reduction_visee_2030", label: "Réduction visée à horizon 2030", type: "number", placeholder: "Ex: 40", unit: "%", help: "SNBC : −40 % vs 2015 (tertiaire)" },
      { id: "strategie_decarbonation", label: "Stratégie de décarbonation", type: "textarea", colSpan: 2, placeholder: "Leviers : sortie des énergies fossiles (gaz/fioul), électrification, EnR autoconsommées, optimisation des usages, choix matériaux biosourcés/recyclés, sobriété..." },
    ],
  },
  {
    titre: "10. Scénarios de rénovation",
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
    titre: "11. Plan de financement et aides",
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
    titre: "12. Conclusion et recommandations",
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
  {
    titre: "13. Bilan thermique avancé (STD + factures)",
    description: "Simulation thermique dynamique 3 saisons (Design Builder / équivalent) + analyse de factures par vecteur énergétique",
    fields: [
      { id: "std_annuel_chauffage", label: "Besoin annuel chauffage (STD)", type: "number", placeholder: "Ex: 185", unit: "MWh/an", help: "Résultat simulation annuelle" },
      { id: "std_annuel_froid",     label: "Besoin annuel froid (STD)",    type: "number", placeholder: "Ex: 42",  unit: "MWh/an" },
      { id: "std_dju",              label: "DJU site (base 18°C)",         type: "number", placeholder: "Ex: 2450", unit: "DJU/an", help: "Météo France ou Eurometeo, moyenne 10 ans" },
      { id: "std_periode",          label: "Période de simulation",         type: "text",   placeholder: "Ex: 2020-2024" },
      { id: "std_jour_froid_kwh",   label: "Besoin jour le plus froid",    type: "number", placeholder: "Ex: 1250", unit: "kWh/j", help: "Dimensionnement chauffage" },
      { id: "std_jour_chaud_kwh",   label: "Besoin jour le plus chaud",    type: "number", placeholder: "Ex: 780",  unit: "kWh/j", help: "Dimensionnement climatisation" },
      { id: "std_commentaire",      label: "Hypothèses STD et résultats clés", type: "textarea", colSpan: 2, placeholder: "Logiciel utilisé, zones thermiques modélisées, scénarios d'occupation et consignes, températures extrêmes retenues (-7°C, +32°C), apports internes/solaires..." },

      // Factures par vecteur
      { id: "facture_elec_abo",   label: "Électricité — abonnement", type: "number", placeholder: "Ex: 1200", unit: "€/an" },
      { id: "facture_elec_conso", label: "Électricité — consommation", type: "number", placeholder: "Ex: 8500", unit: "€/an" },
      { id: "facture_elec_taxes", label: "Électricité — taxes (TICFE, CTA, CSPE, TVA)", type: "number", placeholder: "Ex: 1800", unit: "€/an" },
      { id: "facture_gaz_abo",    label: "Gaz — abonnement", type: "number", placeholder: "Ex: 300", unit: "€/an" },
      { id: "facture_gaz_conso",  label: "Gaz — consommation", type: "number", placeholder: "Ex: 4200", unit: "€/an" },
      { id: "facture_gaz_taxes",  label: "Gaz — taxes (TICGN, CTA, TVA)", type: "number", placeholder: "Ex: 600", unit: "€/an" },
      { id: "facture_res_abo",    label: "Réseau chaleur — abonnement", type: "number", placeholder: "Ex: 0", unit: "€/an" },
      { id: "facture_res_conso",  label: "Réseau chaleur — consommation", type: "number", placeholder: "Ex: 0", unit: "€/an" },
      { id: "facture_eau_conso",  label: "Eau — facture totale", type: "number", placeholder: "Ex: 650", unit: "€/an" },
      { id: "facture_analyse",    label: "Analyse et leviers d'optimisation", type: "textarea", colSpan: 2, placeholder: "Optimisation contractuelle (tarifs réglementés vs offres de marché), effacement, capacité souscrite inadaptée, renouvellement tarif, récupération TICFE..." },
    ],
  },
  {
    titre: "14. Grille d'analyse & trajectoire DEET",
    description: "Notation multicritère 1-4/4 + trajectoire de réduction Décret Tertiaire + étude d'opportunité certification",
    fields: [
      // Grille analyse — 6 axes notés 1-4
      { id: "grille_bati",       label: "Bâti / enveloppe",     type: "select", options: ["1 — Critique", "2 — Dégradé", "3 — Correct", "4 — Performant"], help: "Évaluation globale de l'isolation, inertie, étanchéité à l'air" },
      { id: "grille_chaud",      label: "Équipements chauffage", type: "select", options: ["1 — Critique", "2 — Dégradé", "3 — Correct", "4 — Performant"] },
      { id: "grille_froid",      label: "Équipements froid",    type: "select", options: ["1 — Critique", "2 — Dégradé", "3 — Correct", "4 — Performant"] },
      { id: "grille_ventilation",label: "Ventilation",          type: "select", options: ["1 — Critique", "2 — Dégradé", "3 — Correct", "4 — Performant"] },
      { id: "grille_eclairage",  label: "Éclairage",            type: "select", options: ["1 — Critique", "2 — Dégradé", "3 — Correct", "4 — Performant"] },
      { id: "grille_ecs",        label: "ECS",                  type: "select", options: ["1 — Critique", "2 — Dégradé", "3 — Correct", "4 — Performant"] },

      // Trajectoire DEET
      { id: "deet_applicable",   label: "Bâtiment soumis au Décret Tertiaire", type: "select", options: ["Oui — surface > 1000 m²", "Non — surface < 1000 m²", "Non — usage exclu"], help: "Décret n°2019-771 du 23 juillet 2019 (DEET)" },
      { id: "deet_baseline_annee", label: "Année de référence", type: "number", placeholder: "Ex: 2019", help: "Choix libre entre 2010 et 2019 selon OPERAT" },
      { id: "deet_baseline_kwh",   label: "Consommation de référence", type: "number", placeholder: "Ex: 280", unit: "kWhEF/m²·an" },
      { id: "deet_target_2030",    label: "Objectif 2030",      type: "number", placeholder: "40", unit: "%", help: "Réduction minimale (-40% ou valeur absolue Cabs)" },
      { id: "deet_target_2040",    label: "Objectif 2040",      type: "number", placeholder: "50", unit: "%" },
      { id: "deet_target_2050",    label: "Objectif 2050",      type: "number", placeholder: "60", unit: "%" },
      { id: "deet_projection",     label: "Projection après travaux", type: "number", placeholder: "Ex: 155", unit: "kWhEF/m²·an", help: "Consommation projetée avec le scénario recommandé" },
      { id: "deet_commentaire",    label: "Stratégie de conformité DEET", type: "textarea", colSpan: 2, placeholder: "Jalons, actions mobilisées par horizon, suivi OPERAT, déclaration annuelle, modulations envisagées (Cabs, volume d'activité, conditions climatiques)..." },

      // Certification
      { id: "cert_referentiel",    label: "Référentiel de certification visé", type: "select", options: ["Aucun", "BREEAM In-Use", "HQE Exploitation", "ISO 50001 (SMé)", "Autre"] },
      { id: "cert_niveau_actuel",  label: "Niveau actuel estimé", type: "text", placeholder: "Ex: Pass / Good / Bon" },
      { id: "cert_niveau_cible",   label: "Niveau cible",         type: "text", placeholder: "Ex: Very Good / Très performant" },
      { id: "cert_commentaire",    label: "Étude d'opportunité certification", type: "textarea", colSpan: 2, placeholder: "Atouts, écarts majeurs, coût de certification, bénéfices attendus (valorisation foncière, attractivité locative, alignement taxonomie UE)..." },
    ],
  },
];

// ─── DPE visual constants (Arrêté 2021) ─────────────────────────

const DPE_HEX: Record<string, string> = {
  A: "#319834",
  B: "#33A457",
  C: "#79B72E",
  D: "#F3D93F",
  E: "#EEB239",
  F: "#E8741E",
  G: "#D7221F",
};
const GES_HEX: Record<string, string> = {
  A: "#F6F4FA",
  B: "#E4DBEF",
  C: "#C8B6DE",
  D: "#A98ACB",
  E: "#8762B6",
  F: "#633F9C",
  G: "#401C83",
};

const DPE_TIERS: Array<[string, string]> = [
  ["A", "≤ 70"],
  ["B", "71 à 110"],
  ["C", "111 à 180"],
  ["D", "181 à 250"],
  ["E", "251 à 330"],
  ["F", "331 à 420"],
  ["G", "> 420"],
];
const GES_TIERS: Array<[string, string]> = [
  ["A", "≤ 6"],
  ["B", "7 à 11"],
  ["C", "12 à 30"],
  ["D", "31 à 50"],
  ["E", "51 à 70"],
  ["F", "71 à 100"],
  ["G", "> 100"],
];

function computeDpeLetter(kwhM2: number): string {
  if (kwhM2 <= 70) return "A";
  if (kwhM2 <= 110) return "B";
  if (kwhM2 <= 180) return "C";
  if (kwhM2 <= 250) return "D";
  if (kwhM2 <= 330) return "E";
  if (kwhM2 <= 420) return "F";
  return "G";
}
function computeGesLetter(co2M2: number): string {
  if (co2M2 <= 6) return "A";
  if (co2M2 <= 11) return "B";
  if (co2M2 <= 30) return "C";
  if (co2M2 <= 50) return "D";
  if (co2M2 <= 70) return "E";
  if (co2M2 <= 100) return "F";
  return "G";
}

function EnergyLabelUI({ kind, letter, value }: { kind: "DPE" | "GES"; letter: string; value?: string }) {
  const tiers = kind === "DPE" ? DPE_TIERS : GES_TIERS;
  const colors = kind === "DPE" ? DPE_HEX : GES_HEX;
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          {kind === "DPE" ? "Consommation énergétique" : "Émissions GES"}
        </p>
        {value && (
          <p className="text-sm font-bold" style={{ color: colors[letter] ?? "#333" }}>
            {value}
          </p>
        )}
      </div>
      <div className="space-y-[2px]">
        {tiers.map(([l, range], i) => {
          const active = l === letter;
          const width = 55 + i * 6; // staircase effect
          const darkBg = kind === "DPE" ? ["A", "B", "C", "G"].includes(l) : ["E", "F", "G"].includes(l);
          return (
            <div key={l} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-sm transition-all",
                  active && "ring-2 ring-offset-1 ring-foreground",
                )}
                style={{ background: colors[l], width: `${width}%`, color: darkBg ? "#fff" : "#222" }}
              >
                <span className="text-[11px] font-bold">{l}</span>
                <span className="text-[10px] opacity-90">{range}</span>
              </div>
              {active && (
                <span className="text-[10px] font-semibold text-foreground">◀ classe actuelle</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PDF Generation ─────────────────────────────────────────────

async function generatePDF(
  sections: QuestionSection[],
  values: FormValues,
  sectionPhotos: Record<number, PhotoItem[]>,
  preconisations: PreconisationAction[],
  thermal: ThermalCalc | null,
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
    drawDPEGESDual,
    drawConsoBreakdown,
    drawDeperditionsChart,
    drawBeforeAfterComparison,
    drawExecutiveSummary,
    drawActionSheet,
    drawSeasonalBalance,
    drawFactureBreakdown,
    drawRadarChart,
    drawDeetRoadmap,
    drawCertificationStudy,
    drawKpiRow,
    computeDPEClass,
    computeGESClass,
    computeFinancialClass,
    getDataTableConfig,
    getInfoTableConfig,
    needsPageBreak,
    resetTextState,
    formatNumberPdf,
    PDF_COLORS,
    PDF_LAYOUT,
  } = await import("@/lib/pdf-styles");
  const {
    renderDeperditionsChart,
    renderPostesChart,
    renderBesoinsMensuelsChart,
    renderComparatifScenarioChart,
  } = await import("@/lib/pdf-charts");

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const contentWidth = pageWidth - margin * 2;

  function checkPage(needed: number) {
    if (needsPageBreak(y, needed)) { doc.addPage(); y = PDF_LAYOUT.topMargin; }
  }

  const reference = values.ref_audit || "Ref. non definie";

  // ─── Page 1 : Cover ──────────────────────────────────────
  drawCoverPage(
    doc,
    "Audit énergétique",
    "Diagnostic complet et scenarios de renovation",
    [
      ["Reference",    reference],
      ["Beneficiaire", values.client_nom  || "—"],
      ["Adresse",      values.adresse     || "—"],
      ["Date visite",  values.date_visite || "—"],
      ["Auditeur",     values.redacteur   || "—"],
      ["DPE actuel",   values.dpe_actuel  || "—"],
    ],
    reference,
  );

  // ─── Page 2 : Synthèse exécutive ─────────────────────────
  doc.addPage();
  {
    const shab = parseFloat(values.surface_habitable || "0");
    const consoM2 = parseFloat(values.conso_par_m2 || "0");
    const co2M2 = parseFloat(values.emissions_co2_m2 || "0");
    const factureAn = parseFloat(values.facture_annuelle || "0");
    const euroM2 = shab > 0 && factureAn > 0 ? factureAn / shab : 0;

    const dpeLetter = consoM2 > 0 ? computeDPEClass(consoM2) : ((values.dpe_actuel || "G").charAt(0) || "G");
    const gesLetter = co2M2 > 0 ? computeGESClass(co2M2) : ((values.ges_actuel || "G").charAt(0) || "G");
    const finLetter = euroM2 > 0 ? computeFinancialClass(euroM2) : "G";

    // Constats automatiques à partir des valeurs clés
    const constats: string[] = [];
    if (consoM2 > 0) constats.push(`Consommation de ${consoM2} kWhEP/m\u00B2.an — classe énergétique ${dpeLetter}.`);
    if (co2M2 > 0)   constats.push(`Émissions de ${co2M2} kgCO\u00B2/m\u00B2.an — classe environnementale ${gesLetter}.`);
    if (euroM2 > 0)  constats.push(`Facture énergétique de ${euroM2.toFixed(0)} \u20AC/m\u00B2.an — classe financière ${finLetter}.`);
    if (values.annee_construction) constats.push(`Bâtiment construit en ${values.annee_construction}, structure ${values.type_structure || "non précisée"}.`);
    if (values.chauffage_type && values.chauffage_annee) {
      constats.push(`Générateur de chauffage ${values.chauffage_type} installé en ${values.chauffage_annee}.`);
    }
    if (values.ventilation_type && values.ventilation_type !== "Aucune") {
      constats.push(`Ventilation ${values.ventilation_type}.`);
    }
    if (values.murs_isolation === "Non isolé") constats.push("Murs non isolés : poste majeur de déperdition.");
    if (values.toiture_isolation === "Non isolé") constats.push("Toiture non isolée : priorité forte d'intervention.");

    // Leviers à partir des préconisations (top 5 par opportunité)
    const topActions = [...preconisations]
      .sort((a, b) => (b.opportunite || 0) - (a.opportunite || 0))
      .slice(0, 5);
    const leviers: string[] = topActions.length > 0
      ? topActions.map((a) => {
          const euro = a.economiesEuro ? ` — ${formatNumberPdf(Math.round(a.economiesEuro))} \u20AC/an` : "";
          const tri  = a.tri ? `, TRI ${a.tri.toFixed(1)} ans` : "";
          return `${a.code} · ${a.titre}${euro}${tri}`;
        })
      : [
          "Saisir le catalogue de preconisations pour alimenter cette synthese.",
        ];

    drawExecutiveSummary(doc, {
      beneficiaire:      values.client_nom || "—",
      adresse:           values.adresse || "—",
      typeBatiment:      values.type_batiment || "—",
      anneeConstruction: values.annee_construction || "—",
      surface:           values.surface_habitable ? `${values.surface_habitable} m²` : "—",
      energetique:       { letter: dpeLetter, value: consoM2 > 0 ? `${consoM2}` : "—" },
      environnementale:  { letter: gesLetter, value: co2M2 > 0 ? `${co2M2}` : "—" },
      financiere:        { letter: finLetter, value: euroM2 > 0 ? `${euroM2.toFixed(0)}` : "—" },
      constats,
      leviers,
    });
  }

  // ─── Page 3 : Sommaire (filled after content) ────────────
  doc.addPage();
  const tocPageNum = doc.getNumberOfPages();

  // ─── Page 4+ : Content ───────────────────────────────────
  doc.addPage();
  let y: number = PDF_LAYOUT.topMargin;
  const tocEntries: { title: string; page: number }[] = [
    { title: "Synthese executive", page: 1 }, // numérotation rebasée : page 2 du doc = page 1 du contenu
  ];

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
    y = drawSectionHeader(doc, section.titre, y, section.description, { number: sIdx + 1 });

    if (tableData.length > 0) {
      autoTable(doc, getDataTableConfig(y, tableData, contentWidth));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 6;
      resetTextState(doc);
    }

    // Textareas → paragraphes rédigés, pas de tableau
    for (const ft of freeText) {
      checkPage(30);
      y = drawProse(doc, ft.label, y, { size: 9, spacingAfter: 1 });
      y = drawProse(doc, ft.text, y, { size: 9.5, spacingAfter: 4 });
    }

    // ─── Diagrammes pro selon la section ───────────────────
    // Section 6 (index 5) — étiquettes DPE + GES officielles
    if (sIdx === 5) {
      const dpeLetter = (values.dpe_actuel || "").charAt(0) || "G";
      const gesLetter = (values.ges_actuel || "").charAt(0) || "G";
      const kwhVal = values.conso_par_m2 ? `${values.conso_par_m2} kWhEP/m²/an` : "—";
      const co2Val = values.emissions_co2_m2 ? `${values.emissions_co2_m2} kgCO₂/m²/an` : "—";
      checkPage(75);
      y = drawDPEGESDual(doc, y + 2, {
        kwhValue: kwhVal,
        dpeLetter,
        co2Value: co2Val,
        gesLetter,
      });
    }

    // Section 7 (index 6) — répartition consommations par poste
    if (sIdx === 6) {
      const postes = [
        { label: "Chauffage",       kwh: parseFloat(values.poste_chauffage || "0"),       color: [37, 99, 235]   as [number, number, number] },
        { label: "ECS",             kwh: parseFloat(values.poste_ecs || "0"),             color: [14, 165, 233]  as [number, number, number] },
        { label: "Refroidissement", kwh: parseFloat(values.poste_refroidissement || "0"), color: [139, 92, 246]  as [number, number, number] },
        { label: "Éclairage",       kwh: parseFloat(values.poste_eclairage || "0"),       color: [245, 158, 11]  as [number, number, number] },
        { label: "Auxiliaires",     kwh: parseFloat(values.poste_auxiliaires || "0"),     color: [107, 91, 80]   as [number, number, number] },
        { label: "Autres usages",   kwh: parseFloat(values.poste_autres || "0"),          color: [156, 163, 175] as [number, number, number] },
      ];
      if (postes.some((p) => p.kwh > 0)) {
        checkPage(55);
        y = drawConsoBreakdown(doc, y + 2, postes, { title: "Diagramme de répartition des consommations" });

        // Camembert haute résolution (canvas) — complément visuel.
        try {
          const png = renderPostesChart({
            chauffage: postes[0].kwh,
            ecs: postes[1].kwh,
            refroidissement: postes[2].kwh,
            eclairage: postes[3].kwh,
            auxiliaires: postes[4].kwh,
          });
          checkPage(95);
          doc.addImage(png, "PNG", margin, y + 2, contentWidth, 90, undefined, "FAST");
          y += 90 + PDF_LAYOUT.sectionGap;
        } catch (err) {
          console.warn("[generatePDF] renderPostesChart failed", err);
        }
      }

      // Courbe besoins mensuels (si données thermiques dispo)
      if (thermal?.besoins && values.zone_climatique) {
        try {
          const png = renderBesoinsMensuelsChart({
            zone: values.zone_climatique,
            coefG: thermal.besoins.coefG,
            volumeChauffe: parseFloat(values.surface_habitable || "0") * (parseFloat(values.hauteur_plafond || "0") || 2.5),
          });
          checkPage(80);
          doc.addImage(png, "PNG", margin, y + 2, contentWidth, 75, undefined, "FAST");
          y += 75 + PDF_LAYOUT.sectionGap;
        } catch (err) {
          console.warn("[generatePDF] renderBesoinsMensuelsChart failed", err);
        }
      }
    }

    // Section 8 (index 7) — déperditions par paroi
    if (sIdx === 7) {
      const items = [
        { label: "Murs extérieurs",    pct: parseFloat(values.deperd_murs || "0") },
        { label: "Toiture / combles",  pct: parseFloat(values.deperd_toiture || "0") },
        { label: "Plancher bas",       pct: parseFloat(values.deperd_plancher || "0") },
        { label: "Menuiseries",        pct: parseFloat(values.deperd_menuiseries || "0") },
        { label: "Ponts thermiques",   pct: parseFloat(values.deperd_ponts || "0") },
        { label: "Ventilation",        pct: parseFloat(values.deperd_ventilation || "0") },
        { label: "Infiltrations",      pct: parseFloat(values.deperd_infiltrations || "0") },
      ];
      if (items.some((i) => i.pct > 0)) {
        checkPage(65);
        y = drawDeperditionsChart(doc, y + 2, items, { title: "Répartition des déperditions par paroi" });

        // Histogramme haute résolution (canvas) — vue triée décroissante.
        try {
          const png = renderDeperditionsChart({
            murs:            parseFloat(values.deperd_murs          || "0"),
            toiture:         parseFloat(values.deperd_toiture       || "0"),
            plancher:        parseFloat(values.deperd_plancher      || "0"),
            menuiseries:     parseFloat(values.deperd_menuiseries   || "0"),
            pontsThermiques: parseFloat(values.deperd_ponts         || "0"),
            ventilation:     parseFloat(values.deperd_ventilation   || "0"),
            infiltrations:   parseFloat(values.deperd_infiltrations || "0"),
          });
          checkPage(95);
          doc.addImage(png, "PNG", margin, y + 2, contentWidth, 85, undefined, "FAST");
          y += 85 + PDF_LAYOUT.sectionGap;
        } catch (err) {
          console.warn("[generatePDF] renderDeperditionsChart failed", err);
        }
      }
    }

    // Section 9 (index 8) — bilan carbone : répartition par scope
    if (sIdx === 8) {
      const scopes = [
        { label: "Scope 1 — Combustion", kwh: parseFloat(values.scope1_combustibles || "0"), color: [220, 38, 38]  as [number, number, number] },
        { label: "Scope 1 — Fluides",    kwh: parseFloat(values.scope1_fluides || "0"),      color: [244, 114, 22] as [number, number, number] },
        { label: "Scope 1 — Mobilité",   kwh: parseFloat(values.scope1_mobilite || "0"),     color: [234, 179, 8]  as [number, number, number] },
        { label: "Scope 2 — Électricité",kwh: parseFloat(values.scope2_electricite || "0"),  color: [37, 99, 235]  as [number, number, number] },
        { label: "Scope 2 — Réseaux",    kwh: parseFloat(values.scope2_reseaux || "0"),      color: [14, 165, 233] as [number, number, number] },
        { label: "Scope 3 — Amont énergie", kwh: parseFloat(values.scope3_amont_energie || "0"), color: [139, 92, 246] as [number, number, number] },
        { label: "Scope 3 — Déplacements", kwh: parseFloat(values.scope3_deplacements || "0"), color: [168, 85, 247] as [number, number, number] },
        { label: "Scope 3 — Déchets",    kwh: parseFloat(values.scope3_dechets || "0"),      color: [107, 91, 80]  as [number, number, number] },
        { label: "Scope 3 — Achats",     kwh: parseFloat(values.scope3_achats || "0"),       color: [156, 163, 175] as [number, number, number] },
      ];
      if (scopes.some((s) => s.kwh > 0)) {
        checkPage(60);
        y = drawConsoBreakdown(doc, y + 2, scopes, { title: "Répartition des émissions par scope (tCO₂e/an)" });
      }
    }

    // Section 12 (index 11) — comparaison DPE avant / après
    if (sIdx === 11) {
      const dpeBefore = (values.dpe_actuel || "").charAt(0);
      const dpeAfter  = (values.dpe_projete || "").charAt(0);
      if (dpeBefore && dpeAfter) {
        checkPage(45);
        y = drawBeforeAfterComparison(
          doc,
          y + 2,
          { letter: dpeBefore, value: `Classe ${dpeBefore}` },
          { letter: dpeAfter,  value: `Classe ${dpeAfter}` },
          { title: "Projection DPE après travaux", kind: "DPE" },
        );
      }

      // Comparatif scénarios (canvas) — barres absolues kWh EP/m²·an.
      const consoActuelle = parseFloat(values.conso_par_m2 || "0");
      const gain1 = parseFloat(values.scenario_1_gain || "0");
      const gain2 = parseFloat(values.scenario_2_gain || "0");
      if (consoActuelle > 0 && (gain1 > 0 || gain2 > 0)) {
        try {
          const png = renderComparatifScenarioChart({
            consoActuelle,
            scenario1: { gain: gain1, nom: "Scénario 1" },
            scenario2: { gain: gain2, nom: "Scénario 2" },
          });
          checkPage(90);
          doc.addImage(png, "PNG", margin, y + 2, contentWidth, 85, undefined, "FAST");
          y += 85 + PDF_LAYOUT.sectionGap;
        } catch (err) {
          console.warn("[generatePDF] renderComparatifScenarioChart failed", err);
        }
      }
    }

    // Section 13 (index 12) — STD 3 saisons + factures par vecteur
    if (sIdx === 12) {
      const stdHasData =
        values.std_annuel_chauffage || values.std_annuel_froid ||
        values.std_jour_froid_kwh || values.std_jour_chaud_kwh;
      if (stdHasData) {
        checkPage(50);
        y = drawSeasonalBalance(doc, y + 2, {
          annuel_chauffage:  values.std_annuel_chauffage ? parseFloat(values.std_annuel_chauffage) : undefined,
          annuel_froid:      values.std_annuel_froid     ? parseFloat(values.std_annuel_froid)     : undefined,
          besoin_chaud_jour: values.std_jour_froid_kwh   ? parseFloat(values.std_jour_froid_kwh)   : undefined,
          besoin_froid_jour: values.std_jour_chaud_kwh   ? parseFloat(values.std_jour_chaud_kwh)   : undefined,
          dju:               values.std_dju              ? parseFloat(values.std_dju)              : undefined,
          periode:           values.std_periode || undefined,
        });
      }

      const elecTotal = (parseFloat(values.facture_elec_abo || "0") + parseFloat(values.facture_elec_conso || "0") + parseFloat(values.facture_elec_taxes || "0"));
      const gazTotal  = (parseFloat(values.facture_gaz_abo  || "0") + parseFloat(values.facture_gaz_conso  || "0") + parseFloat(values.facture_gaz_taxes  || "0"));
      const resTotal  = (parseFloat(values.facture_res_abo  || "0") + parseFloat(values.facture_res_conso  || "0"));
      const eauTotal  = parseFloat(values.facture_eau_conso || "0");
      if (elecTotal + gazTotal + resTotal + eauTotal > 0) {
        const vecteurs = [
          { label: "Electricité",    abonnement: parseFloat(values.facture_elec_abo || "0"),  consommation: parseFloat(values.facture_elec_conso || "0"), taxes: parseFloat(values.facture_elec_taxes || "0"), color: [234, 179, 8]   as [number, number, number] },
          { label: "Gaz naturel",    abonnement: parseFloat(values.facture_gaz_abo  || "0"),  consommation: parseFloat(values.facture_gaz_conso  || "0"), taxes: parseFloat(values.facture_gaz_taxes  || "0"), color: [239, 68, 68]   as [number, number, number] },
          { label: "Réseau chaleur", abonnement: parseFloat(values.facture_res_abo  || "0"),  consommation: parseFloat(values.facture_res_conso  || "0"), taxes: 0,                                                color: [249, 115, 22]  as [number, number, number] },
          { label: "Eau",            abonnement: 0,                                            consommation: parseFloat(values.facture_eau_conso  || "0"), taxes: 0,                                                color: [14, 165, 233]  as [number, number, number] },
        ];
        checkPage(60);
        y = drawFactureBreakdown(doc, y + 2, vecteurs, { title: "Décomposition de la facture annuelle par vecteur" });

        const totalFacture = elecTotal + gazTotal + resTotal + eauTotal;
        const shab = parseFloat(values.surface_habitable || "0");
        const euroM2 = shab > 0 ? totalFacture / shab : 0;
        checkPage(25);
        y = drawKpiRow(doc, y + 2, [
          { label: "Total",       value: `${Math.round(totalFacture).toLocaleString("fr-FR")} EUR/an`, accent: [37, 99, 235] },
          { label: "Ratio",       value: euroM2 > 0 ? `${euroM2.toFixed(1)} EUR/m².an` : "—", accent: [59, 130, 246] },
          { label: "Electricité", value: `${Math.round(elecTotal).toLocaleString("fr-FR")} EUR`, hint: `${totalFacture > 0 ? ((elecTotal / totalFacture) * 100).toFixed(0) : 0}%`, accent: [234, 179, 8] },
          { label: "Gaz",         value: `${Math.round(gazTotal).toLocaleString("fr-FR")} EUR`,  hint: `${totalFacture > 0 ? ((gazTotal  / totalFacture) * 100).toFixed(0) : 0}%`, accent: [239, 68, 68] },
        ]);
      }
    }

    // Section 14 (index 13) — Grille analyse radar + DEET roadmap + certification
    if (sIdx === 13) {
      // Grille d'analyse radar
      const grilleAxes = [
        { id: "grille_bati",        label: "Bâti" },
        { id: "grille_chaud",       label: "Chauffage" },
        { id: "grille_froid",       label: "Froid" },
        { id: "grille_ventilation", label: "Ventilation" },
        { id: "grille_eclairage",   label: "Éclairage" },
        { id: "grille_ecs",         label: "ECS" },
      ];
      const parsed = grilleAxes.map((a) => {
        const v = values[a.id] || "";
        const num = parseInt(v.charAt(0), 10);
        return { label: a.label, value: isNaN(num) ? 0 : num };
      });
      if (parsed.some((p) => p.value > 0)) {
        checkPage(75);
        const pw = doc.internal.pageSize.getWidth();
        drawRadarChart(doc, pw / 2, y + 42, 30, parsed, {
          scale: 4,
          title: "Grille d'analyse multicritère (notation 1-4)",
        });
        y += 82;
      }

      // Trajectoire DEET
      const baseKwh = parseFloat(values.deet_baseline_kwh || "0");
      if (baseKwh > 0) {
        checkPage(70);
        y = drawDeetRoadmap(doc, y + 2, {
          baselineYear:   parseInt(values.deet_baseline_annee || "2019", 10),
          baselineKwhM2:  baseKwh,
          target2030Pct:  parseFloat(values.deet_target_2030 || "40"),
          target2040Pct:  parseFloat(values.deet_target_2040 || "50"),
          target2050Pct:  parseFloat(values.deet_target_2050 || "60"),
          currentKwhM2:   parseFloat(values.conso_par_m2 || "0") || undefined,
          projectedKwhM2: parseFloat(values.deet_projection || "0") || undefined,
        });
      }

      // Étude certification
      if (values.cert_referentiel && values.cert_referentiel !== "Aucun") {
        const ref = values.cert_referentiel as "BREEAM In-Use" | "HQE Exploitation" | "Autre";
        // Thèmes seed à partir de la grille d'analyse quand disponible (mapping pragmatique)
        const themes = parsed
          .filter((p) => p.value > 0)
          .map((p) => ({ label: p.label, note: p.value, max: 4 }));
        checkPage(70);
        y = drawCertificationStudy(doc, y + 4, {
          referentiel:  (["BREEAM In-Use", "HQE Exploitation"].includes(values.cert_referentiel) ? ref : "Autre") as "BREEAM In-Use" | "HQE Exploitation" | "Autre",
          scope:        "Partie bâtiment — évaluation initiale",
          niveauActuel: values.cert_niveau_actuel || "À évaluer",
          niveauCible:  values.cert_niveau_cible  || "À définir",
          themes:       themes.length > 0 ? themes : [
            { label: "Énergie",           note: 2, max: 4 },
            { label: "Eau",               note: 2, max: 4 },
            { label: "Matériaux",         note: 2, max: 4 },
            { label: "Confort & santé",   note: 2, max: 4 },
            { label: "Gestion",           note: 2, max: 4 },
          ],
        });
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

  // ─── Catalogue de préconisations structurées ─────────────
  if (preconisations.length > 0) {
    // Nouvelle page dédiée à la matrice
    doc.addPage();
    y = PDF_LAYOUT.topMargin;
    tocEntries.push({ title: "Catalogue de préconisations", page: doc.getNumberOfPages() - 1 });
    y = drawSectionHeader(doc, "Catalogue de préconisations", y, "Vue matricielle des actions priorisées — détail en fiches ci-après");

    // Matrice via autoTable
    const sorted = [...preconisations].sort((a, b) => (b.opportunite || 0) - (a.opportunite || 0));
    const head = [["Code", "Action", "\u2605", "Horizon", "Resp.", "\u20AC/an", "CO\u00B2", "TRI", "Cumac"]];
    const fmt = (n: number) => formatNumberPdf(Math.round(n));
    const body = sorted.map((a) => [
      a.code,
      `${a.titre}\n${a.famille}`,
      "\u2605".repeat(Math.max(0, Math.min(5, a.opportunite || 0))),
      (a.horizon || "").replace(/\s*\(.*\)\s*$/, ""),
      // Abrégé court pour tenir dans la colonne sans wrap : Loc / Prop / ADB
      (a.responsabilite || "—")
        .replace(" (annexe bail)", "")
        .replace(/Propriétaire/i, "Prop.")
        .replace(/Locataire/i, "Loc.")
        .replace(/Copropriété/i, "Copro."),
      a.economiesEuro ? fmt(a.economiesEuro) : "—",
      a.co2Evite ? `${fmt(a.co2Evite)} kg` : "—",
      a.tri ? `${a.tri.toFixed(1)} ans` : "—",
      a.ceeCumac ? `${a.ceeCumac.toFixed(1)} MWh` : "—",
    ]);
    // Total des largeurs = 166mm (contentWidth typique A4 portrait = 170mm avec margin 20).
    // Répartition ajustée pour que "Horizon", "Resp." et "€/an" tiennent sans wrap.
    autoTable(doc, {
      ...getInfoTableConfig(y, head, body, contentWidth),
      styles: {
        fontSize: 8,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        textColor: PDF_COLORS.body,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.15,
        overflow: "linebreak",
        valign: "middle",
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 14, textColor: PDF_COLORS.heading },
        1: { cellWidth: 42 },
        2: { cellWidth: 14, halign: "center", textColor: PDF_COLORS.blue, fontStyle: "bold" },
        3: { cellWidth: 18 },
        4: { cellWidth: 16, halign: "center" },
        5: { cellWidth: 18, halign: "right" },
        6: { cellWidth: 16, halign: "right" },
        7: { cellWidth: 14, halign: "right" },
        8: { cellWidth: 18, halign: "right" },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
    resetTextState(doc);

    // Fiches action détaillées
    doc.addPage();
    y = PDF_LAYOUT.topMargin;
    tocEntries.push({ title: "Fiches action détaillées", page: doc.getNumberOfPages() - 1 });
    y = drawSectionHeader(doc, "Fiches action détaillées", y, "Descriptif par action avec KPI économiques et environnementaux");

    for (const a of sorted) {
      y = drawActionSheet(doc, y, a);
    }
  }

  // ─── Fill sommaire page ───────────────────────────────────
  doc.setPage(tocPageNum);
  drawSommaire(doc, tocEntries, "Audit énergétique", reference);

  // ─── Footers (skip page 1 = dark cover) ──────────────────
  const totalPages = doc.getNumberOfPages();
  const contentPages = totalPages - 1;
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Audit énergétique", reference, i - 1, contentPages);
  }
  doc.save(`Audit_Energetique_${values.ref_audit || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Moteur thermique : hook + helpers UI ──────────────────────

interface ThermalCalc {
  deperditions: DeperditionsResult | null;
  apports: ApportSolaireResult | null;
  besoins: BesoinsChauffageResult | null;
  dpe: DpeResult | null;
}

function num(v: string | undefined): number {
  const n = parseFloat((v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Estimation U via les libellés du formulaire (R prioritaire si saisi). */
function uMurFromForm(values: FormValues): number {
  const r = num(values.murs_r);
  if (r > 0.1) return 1 / (r + 0.17); // 0.17 = R_si + R_se conventionnel
  const label = values.murs_isolation || "";
  const s = label.toLowerCase();
  if (s.includes("extérieure")) return U_MURS["Isolation extérieure (ITE)"];
  if (s.includes("intérieure")) return U_MURS["Isolation intérieure (ITE)"];
  if (s.includes("répartie")) return U_MURS["Isolation répartie"];
  if (s.includes("non isol")) return U_MURS["Non isolés"];
  return U_MURS["Inconnu"];
}

function uToitureFromForm(values: FormValues): number {
  const r = num(values.toiture_r);
  if (r > 0.1) return 1 / (r + 0.17);
  const s = (values.toiture_isolation || "").toLowerCase();
  if (s.includes("non isol")) return U_TOITURE["Non isolés"];
  if (s.includes("bien isol")) return 0.18;
  if (s.includes("correctement")) return 0.25;
  if (s.includes("insuff")) return 0.45;
  return U_TOITURE["Inconnu"];
}

function uPlancherFromForm(values: FormValues): number {
  const r = num(values.plancher_r);
  if (r > 0.1) return 1 / (r + 0.17);
  const s = (values.plancher_isolation || "").toLowerCase();
  if (s.includes("non isol")) return U_PLANCHER["Non isolé"];
  if (s.includes("sous dalle")) return U_PLANCHER["Isolé sous dalle"];
  if (s.includes("sous-face")) return U_PLANCHER["Isolé en sous-face"];
  return U_PLANCHER["Inconnu"];
}

function uVitrageFromForm(values: FormValues): number {
  const t = (values.menuiseries_type || "").toLowerCase();
  if (t.includes("simple")) return U_VITRAGE["Simple vitrage"];
  if (t.includes("ancien")) return U_VITRAGE["Double vitrage ancien (avant 2000)"];
  if (t.includes("triple")) return U_VITRAGE["Triple vitrage"];
  if (t.includes("récent") || t.includes("double")) return U_VITRAGE["Double vitrage performant"];
  return U_VITRAGE["Mixte"];
}

function rendementGenerateurFromForm(values: FormValues): number {
  const r = num(values.chauffage_rendement);
  if (r > 30) return r / 100; // saisi en %
  if (r > 0.3 && r < 5) return r; // déjà en ratio
  const t = (values.chauffage_type || "").toLowerCase();
  if (t.includes("condens")) return RENDEMENTS_GENERATEURS["Chaudière condensation"];
  if (t.includes("basse t")) return RENDEMENTS_GENERATEURS["Chaudière basse température"];
  if (t.includes("pac")) return 3.0;
  if (t.includes("convect") || t.includes("électr") || t.includes("electr") || t.includes("radiateur électr")) return 1.0;
  if (t.includes("bois") || t.includes("granulé")) return 0.75;
  return RENDEMENTS_GENERATEURS["Chaudière standard"];
}

function useThermalCalc(values: FormValues): ThermalCalc {
  return useMemo<ThermalCalc>(() => {
    const shab = num(values.surface_habitable);
    const hauteur = num(values.hauteur_plafond) || 2.5;
    const volume = shab * hauteur;
    const zoneLabel = values.zone_climatique;
    if (!shab || shab <= 0 || !zoneLabel) {
      return { deperditions: null, apports: null, besoins: null, dpe: null };
    }

    // Estimation grossière des surfaces déperditives à partir de SHAB.
    // Hypothèses : forme compacte, ratio S_murs/SHAB ≈ 1.0, S_toit ≈ SHAB,
    // S_plancher ≈ SHAB. L'utilisateur peut affiner via les U.
    const surfaceVitree = num(values.surface_vitree_totale);
    const surfaceMurs = Math.max(0, shab * 1.0 - surfaceVitree);
    const surfaceToiture = shab;
    const surfacePlancher = shab;

    const uMurs = uMurFromForm(values);
    const uToiture = uToitureFromForm(values);
    const uPlancher = uPlancherFromForm(values);
    const uVitree = surfaceVitree > 0 ? uVitrageFromForm(values) : 0;

    // Ponts thermiques — forfaitaire selon isolation.
    const isolation = mapIsolationMurLabel(values.murs_isolation);
    const hParoisOpaques = uMurs * surfaceMurs + uToiture * surfaceToiture
      + uPlancher * surfacePlancher + uVitree * surfaceVitree;
    const hPontsThermiques = estimerPontsForfaitaire(hParoisOpaques, isolation);

    // Renouvellement d'air : déduit du type de VMC.
    const ventLabel = (values.ventilation_type || "").toLowerCase();
    let renouvellementAir = 0.6;
    let efficaciteDF = 0;
    if (ventLabel.includes("aucune") || ventLabel.includes("naturelle")) renouvellementAir = 1.0;
    else if (ventLabel.includes("hygro")) renouvellementAir = 0.4;
    else if (ventLabel.includes("double flux")) { renouvellementAir = 0.4; efficaciteDF = 0.75; }
    else if (ventLabel.includes("autoréglable")) renouvellementAir = 0.5;
    if (num(values.n50) > 0) {
      // n50 → taux global ≈ n50 × 0.07 + 0.5×VMC
      renouvellementAir = Math.max(renouvellementAir, num(values.n50) * 0.07);
    }

    const tBaseMap: Record<string, number> = {
      H1a: -7, H1b: -9, H1c: -10, H2a: -4, H2b: -2, H2c: -3, H2d: -5, H3: 0,
    };
    const zoneCode = parseZone(zoneLabel);
    const deltaT = 19 - (tBaseMap[zoneCode] ?? -7);

    const deperditions = calculerDeperditions({
      surfaceMurs, surfaceToiture, surfacePlancher, surfaceVitree,
      uMurs, uToiture, uPlancher, uVitree,
      hPontsThermiques,
      volumeChauffe: volume,
      renouvellementAir,
      efficaciteDoubleFlux: efficaciteDF,
      deltaT,
    });

    // Apports solaires (mapping cardinaux → 4 orientations).
    const apports = calculerApportsSolaires({
      surfacesParOrientation: {
        S: num(values.surface_vitree_sud),
        E: num(values.surface_vitree_est),
        O: num(values.surface_vitree_ouest),
        N: num(values.surface_vitree_nord),
        SE: 0, SO: 0, NE: 0, NO: 0,
      },
      facteurSolaireG: num(values.facteur_solaire_g) || 0.55,
      facteurOmbre: 0.85,
      zone: zoneCode,
    });

    // Apports internes : approximation ~5 W/m² × 50 % d'utilisation × 8760 h.
    const apportsInternesKwh = shab * 5 * 8760 * 0.5 / 1000;

    const rendement = rendementGenerateurFromForm(values);
    const besoins = calculerBesoinsChauffage({
      zone: zoneLabel,
      surfaceHabitable: shab,
      volumeChauffe: volume,
      ubat: deperditions.ubatMoyen,
      surfaceDeperditiveTotale: deperditions.surfaceDeperditiveTotale,
      renouvellementAir,
      apportsSolairesGratuits: apports.apportAnnuel,
      apportsInternes: apportsInternesKwh,
      rendementInstallation: rendement,
    });

    // DPE : repart des 5 postes saisis si dispo, sinon estime depuis besoins.
    const chauffageKwh = num(values.poste_chauffage) || besoins.consoFinale;
    const ecsKwh = num(values.poste_ecs) || shab * 25; // 25 kWh/m²·an typique
    const refroidKwh = num(values.poste_refroidissement);
    const eclairageKwh = num(values.poste_eclairage) || shab * 5;
    const auxKwh = num(values.poste_auxiliaires) || shab * 3;

    const dpe = calculerDpe({
      chauffage_kwh: chauffageKwh,
      chauffage_vecteur: vecteurFromLabel(values.chauffage_type),
      ecs_kwh: ecsKwh,
      ecs_vecteur: vecteurFromLabel(values.ecs_type),
      refroidissement_kwh: refroidKwh,
      eclairage_kwh: eclairageKwh,
      auxiliaires_kwh: auxKwh,
    }, shab);

    return { deperditions, apports, besoins, dpe };
  }, [values]);
}

interface CalcCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}
function CalcCard({ title, subtitle, children }: CalcCardProps) {
  return (
    <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-primary font-semibold">Calculs auto</p>
          <p className="text-sm font-semibold">{title}</p>
        </div>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

interface CalcRowProps {
  label: string;
  computed: string;
  saved?: string;
  unit?: string;
  warn?: boolean;
}
function CalcRow({ label, computed, saved, unit, warn }: CalcRowProps) {
  const ecart = saved && saved !== computed;
  return (
    <div className="flex items-center justify-between text-xs gap-2 py-1 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-medium tabular-nums">{computed}{unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}</span>
        {saved && (
          <span className={cn("text-[10px] tabular-nums px-1.5 py-0.5 rounded", ecart ? (warn ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground") : "bg-emerald-100 text-emerald-800")}>
            saisi : {saved}{unit && unit}
          </span>
        )}
      </span>
    </div>
  );
}

interface ApplyButtonProps {
  onClick: () => void;
  label?: string;
}
function ApplyButton({ onClick, label = "Appliquer ces valeurs" }: ApplyButtonProps) {
  return (
    <Button size="sm" variant="outline" onClick={onClick} className="text-xs h-7">
      {label}
    </Button>
  );
}

// ─── Component ──────────────────────────────────────────────────

export default function AuditEnergetique({ onBack, onSaved, existingDoc }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [showBatimentPicker, setShowBatimentPicker] = useState(false);
  const [ficheCandidates, setFicheCandidates] = useState<FicheCandidate[]>([]);
  const [showFicheChoice, setShowFicheChoice] = useState(false);
  const [values, setValues] = useState<FormValues>(() => {
    if (existingDoc?.donnees) {
      try {
        const parsed = JSON.parse(existingDoc.donnees);
        delete parsed._sectionPhotos;
        delete parsed._preconisations;
        return parsed;
      } catch { return {}; }
    }
    return {};
  });
  const [preconisations, setPreconisations] = useState<PreconisationAction[]>(() => {
    if (existingDoc?.donnees) {
      try {
        const parsed = JSON.parse(existingDoc.donnees);
        if (Array.isArray(parsed._preconisations)) return parsed._preconisations as PreconisationAction[];
      } catch { /* ignore */ }
    }
    return [];
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
  const [generatingWord, setGeneratingWord] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateValue(id: string, value: string) { setValues((prev) => ({ ...prev, [id]: value })); setSaved(false); }

  // ─── Auto-compute: conso/m², CO₂/m², DPE letter, GES letter ──
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      const shab = parseFloat(prev.surface_habitable || "0");
      const consoTot = parseFloat(prev.conso_totale || "0");
      const co2Tot = parseFloat(prev.emissions_co2 || "0");

      // conso/m²
      if (shab > 0 && consoTot > 0) {
        const consoM2 = Math.round(consoTot / shab);
        if (prev.conso_par_m2 !== String(consoM2)) {
          next.conso_par_m2 = String(consoM2);
          changed = true;
        }
        // DPE letter (auto-set to match the official class)
        const letter = computeDpeLetter(consoM2);
        const match = [
          "A — ≤ 70 kWhEP/m²/an",
          "B — 71 à 110",
          "C — 111 à 180",
          "D — 181 à 250",
          "E — 251 à 330",
          "F — 331 à 420",
          "G — > 420",
        ].find((opt) => opt.startsWith(letter));
        if (match && prev.dpe_actuel !== match) {
          next.dpe_actuel = match;
          changed = true;
        }
      }

      // CO₂/m²
      if (shab > 0 && co2Tot > 0) {
        const co2M2 = Math.round(co2Tot / shab);
        if (prev.emissions_co2_m2 !== String(co2M2)) {
          next.emissions_co2_m2 = String(co2M2);
          changed = true;
        }
        const gesLetter = computeGesLetter(co2M2);
        const match = [
          "A — ≤ 6 kgCO₂/m²/an",
          "B — 7 à 11",
          "C — 12 à 30",
          "D — 31 à 50",
          "E — 51 à 70",
          "F — 71 à 100",
          "G — > 100",
        ].find((opt) => opt.startsWith(gesLetter));
        if (match && prev.ges_actuel !== match) {
          next.ges_actuel = match;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [values.surface_habitable, values.conso_totale, values.emissions_co2]);

  // ─── Live DPE / GES letters pour l'aperçu UI ─────────────────
  const dpeLive = useMemo(() => (values.dpe_actuel || "").charAt(0) || "—", [values.dpe_actuel]);
  const gesLive = useMemo(() => (values.ges_actuel || "").charAt(0) || "—", [values.ges_actuel]);

  // Moteur thermique — calculs auto à partir des saisies.
  const thermal = useThermalCalc(values);

  // Validations inline (Σ déperditions, écart facture/calc, U mur incohérent).
  const issueDeperditions = useMemo(() => checkSommeDeperditions(values), [values]);
  const issueUMurs = useMemo(() => checkCoherenceUMurs(num(values.murs_r) > 0 ? 1 / (num(values.murs_r) + 0.17) : uMurFromForm(values), values.murs_isolation || ""), [values]);
  const issueEcart = useMemo(() => {
    const facture = num(values.facture_annuelle);
    const calc = thermal.besoins?.consoFinale ?? 0;
    if (facture <= 0 || calc <= 0) return null;
    // Conversion simplifiée : 0.10 €/kWh moyen pour comparer ordres.
    const consoFromFacture = facture / 0.12;
    return checkEcartFactureCalc(consoFromFacture, calc);
  }, [values, thermal.besoins]);

  // ─── C1 — Bandeau global d'alertes (validations enrichies) ─────
  const fieldIssueCtx = useMemo(
    () => ({
      dpeCalcule: thermal.dpe?.classe_dpe,
      consoTotaleCalculee: thermal.dpe?.cep_kwh,
    }),
    [thermal.dpe],
  );
  const validationItems = useMemo<ValidationItem[]>(() => {
    const items: ValidationItem[] = [];
    if (issueDeperditions) {
      items.push({
        ...issueDeperditions,
        id: "deperditions-sum",
        titre: "Somme des déperditions",
        sectionIdx: 7,
      });
    }
    if (issueUMurs) {
      items.push({
        ...issueUMurs,
        id: "u-murs",
        titre: "Cohérence U / isolation murs",
        sectionIdx: 2,
      });
    }
    if (issueEcart) {
      items.push({
        ...issueEcart,
        id: "ecart-facture",
        titre: "Écart facture / calcul",
        sectionIdx: 5,
      });
    }
    const probes: Array<[string, string, number]> = [
      ["n50", "Étanchéité à l'air vs année de construction", 3],
      ["dpe_actuel", "DPE saisi vs DPE calculé", 5],
      ["surface_plancher", "Cohérence des surfaces", 1],
      ["toiture_r", "Cohérence U / isolation toiture", 2],
      ["conso_totale", "Σ usages vs conso totale", 5],
    ];
    for (const [fieldId, titre, sectionIdx] of probes) {
      const issue = getFieldIssue(fieldId, values, fieldIssueCtx);
      if (issue) {
        items.push({ ...issue, id: `field-${fieldId}`, titre, sectionIdx });
      }
    }
    return items;
  }, [issueDeperditions, issueUMurs, issueEcart, values, fieldIssueCtx]);

  // ─── C2 — Suggestions intelligentes ───────────────────────────
  const suggestions = useMemo<Suggestion[]>(
    () => computeSuggestions(values, thermal),
    [values, thermal],
  );

  function applySuggestion(s: Suggestion) {
    updateValue(s.fieldId, s.value);
  }

  // ─── C3 — Création note CEE depuis l'audit ────────────────────
  function handleCreateNoteFromAudit() {
    const candidates = detectFichesCandidates(values);
    if (candidates.length === 0) {
      // Note vierge : on redirige sans payload.
      router.push("/dashboard/documents");
      return;
    }
    if (candidates.length === 1) {
      const fiche = candidates[0].id;
      const prefill = mapAuditToNote(values, fiche);
      try {
        localStorage.setItem(
          "kilowater:audit-to-note-prefill",
          JSON.stringify({ fiche, values: prefill, ref: values.ref_audit || null }),
        );
      } catch { /* localStorage unavailable */ }
      router.push("/dashboard/documents?create=note&prefilled=1");
      return;
    }
    setFicheCandidates(candidates);
    setShowFicheChoice(true);
  }

  function pickFiche(fiche: FicheCandidate["id"]) {
    const prefill = mapAuditToNote(values, fiche);
    try {
      localStorage.setItem(
        "kilowater:audit-to-note-prefill",
        JSON.stringify({ fiche, values: prefill, ref: values.ref_audit || null }),
      );
    } catch { /* localStorage unavailable */ }
    setShowFicheChoice(false);
    router.push("/dashboard/documents?create=note&prefilled=1");
  }

  // ─── C4 — Chargement d'un bâtiment-type ───────────────────────
  function loadBatimentTemplate(tplValues: Record<string, string>) {
    setValues((prev) => ({ ...prev, ...tplValues }));
    setSaved(false);
    setActiveSection(0);
  }

  const hasExistingValues = useMemo(
    () => Object.values(values).some((v) => v && v.trim().length > 0),
    [values],
  );

  async function handleSave() {
    setSaving(true);
    try {
      const titre = values.ref_audit ? `Audit énergétique — ${values.client_nom || "Sans client"}` : "Audit énergétique (brouillon)";
      const reference = values.ref_audit || `AU-${Date.now().toString(36).toUpperCase()}`;
      const photosToSave: Record<number, Array<{ id: string; preview: string; legende: string; categorie: string }>> = {};
      for (const [key, photos] of Object.entries(sectionPhotos)) {
        if (photos.length > 0) {
          photosToSave[Number(key)] = photos.map((p) => ({ id: p.id, preview: p.preview, legende: p.legende, categorie: p.categorie }));
        }
      }
      const donnees = JSON.stringify({
        ...values,
        _sectionPhotos:   Object.keys(photosToSave).length > 0 ? photosToSave : undefined,
        _preconisations:  preconisations.length > 0 ? preconisations : undefined,
      });
      if (docId) {
        const res = await fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titre, reference, clientNom: values.client_nom || null, donnees, statut: "EN_COURS" }) });
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
    const sectionIdx = activeSection;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setSectionPhotos((prev) => ({
          ...prev,
          [sectionIdx]: [
            ...(prev[sectionIdx] || []),
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, file, preview: reader.result as string, legende: "", categorie: PHOTO_CATEGORIES[0] },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, [activeSection]);

  async function handleGeneratePDF() {
    setGenerating(true);
    try {
      await generatePDF(SECTIONS, values, sectionPhotos, preconisations, thermal);
      if (docId) { await fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: "TERMINE" }) }); onSaved?.(); }
      else { await handleSave(); }
    } finally { setGenerating(false); }
  }

  async function handleGenerateWord() {
    setGeneratingWord(true);
    try {
      const {
        renderDeperditionsChart,
        renderPostesChart,
        renderBesoinsMensuelsChart,
        renderComparatifScenarioChart,
      } = await import("@/lib/pdf-charts");

      const sectionCharts: Record<number, WordChart[]> = {};

      // Charts identiques à la sortie PDF (mêmes inputs)
      try {
        const chauffage = parseFloat(values.conso_chauffage || "0");
        const ecs = parseFloat(values.conso_ecs || "0");
        const refroidissement = parseFloat(values.conso_refroidissement || "0");
        const eclairage = parseFloat(values.conso_eclairage || "0");
        const auxiliaires = parseFloat(values.conso_auxiliaires || "0");
        if ([chauffage, ecs, refroidissement, eclairage, auxiliaires].some((v) => v > 0)) {
          const png = renderPostesChart({ chauffage, ecs, refroidissement, eclairage, auxiliaires });
          (sectionCharts[6] = sectionCharts[6] || []).push({ title: "Répartition des consommations", dataUrl: png });
        }
      } catch { /* skip */ }

      try {
        if (thermal?.besoins && values.zone_climatique) {
          const png = renderBesoinsMensuelsChart({
            zone: values.zone_climatique,
            coefG: thermal.besoins.coefG,
            volumeChauffe: parseFloat(values.surface_habitable || "0") * (parseFloat(values.hauteur_plafond || "0") || 2.5),
          });
          (sectionCharts[6] = sectionCharts[6] || []).push({ title: "Besoins de chauffage mensuels", dataUrl: png });
        }
      } catch { /* skip */ }

      try {
        const png = renderDeperditionsChart({
          murs:            parseFloat(values.deperd_murs          || "0"),
          toiture:         parseFloat(values.deperd_toiture       || "0"),
          plancher:        parseFloat(values.deperd_plancher      || "0"),
          menuiseries:     parseFloat(values.deperd_menuiseries   || "0"),
          pontsThermiques: parseFloat(values.deperd_ponts         || "0"),
          ventilation:     parseFloat(values.deperd_ventilation   || "0"),
          infiltrations:   parseFloat(values.deperd_infiltrations || "0"),
        });
        (sectionCharts[7] = sectionCharts[7] || []).push({ title: "Répartition des déperditions par paroi", dataUrl: png });
      } catch { /* skip */ }

      try {
        const consoActuelle = parseFloat(values.conso_par_m2 || "0");
        const gain1 = parseFloat(values.scenario_1_gain || "0");
        const gain2 = parseFloat(values.scenario_2_gain || "0");
        if (consoActuelle > 0 && (gain1 > 0 || gain2 > 0)) {
          const png = renderComparatifScenarioChart({
            consoActuelle,
            scenario1: { gain: gain1, nom: "Scénario 1" },
            scenario2: { gain: gain2, nom: "Scénario 2" },
          });
          (sectionCharts[11] = sectionCharts[11] || []).push({ title: "Comparatif des scénarios (kWh EP/m²·an)", dataUrl: png });
        }
      } catch { /* skip */ }

      const wordSections: WordSectionInput[] = SECTIONS.map((section, sIdx) => {
        const rows: { label: string; value: string }[] = [];
        const paragraphs: { label?: string; text: string }[] = [];
        for (const field of section.fields) {
          const val = values[field.id];
          if (!val || !val.trim()) continue;
          if (field.type === "textarea") {
            paragraphs.push({ label: field.label, text: val.trim() });
          } else {
            const label = field.unit ? `${field.label} (${field.unit})` : field.label;
            rows.push({ label, value: val });
          }
        }
        const photos = (sectionPhotos[sIdx] || []).map((p) => ({
          dataUrl: p.preview,
          categorie: p.categorie,
          legende: p.legende,
        }));
        const charts = sectionCharts[sIdx] || [];
        return { titre: section.titre, description: section.description, rows, paragraphs, photos, charts };
      }).filter((s) => (s.rows?.length ?? 0) + (s.paragraphs?.length ?? 0) + (s.photos?.length ?? 0) + (s.charts?.length ?? 0) > 0);

      // Préconisations en tableau dédié
      if (preconisations.length > 0) {
        wordSections.push({
          titre: "Préconisations",
          description: "Actions de rénovation priorisées",
          tables: [{
            headers: ["Code", "Action", "Famille", "Horizon", "Coût (€)", "Économies (€/an)"],
            rows: preconisations.map((a) => [
              a.code || "—",
              a.titre || "—",
              a.famille || "—",
              a.horizon || "—",
              a.coutTravaux ? Math.round(a.coutTravaux).toString() : "—",
              a.economiesEuro ? Math.round(a.economiesEuro).toString() : "—",
            ]),
          }],
        });
      }

      // ─── Préambule narratif (constats + leviers) — aligné sur le PDF ──
      const consoM2 = parseFloat(values.conso_par_m2 || "0");
      const co2M2 = parseFloat(values.emissions_co2_m2 || "0");
      const factureAn = parseFloat(values.facture_annuelle || "0");
      const shab = parseFloat(values.surface_habitable || "0");
      const euroM2 = shab > 0 && factureAn > 0 ? factureAn / shab : 0;

      const constats: string[] = [];
      if (consoM2 > 0) constats.push(`Consommation de ${consoM2} kWhEP/m².an — classe énergétique ${(values.dpe_actuel || "G").charAt(0)}.`);
      if (co2M2 > 0)   constats.push(`Émissions de ${co2M2} kgCO₂/m².an — classe environnementale ${(values.ges_actuel || "G").charAt(0)}.`);
      if (euroM2 > 0)  constats.push(`Facture énergétique de ${euroM2.toFixed(0)} €/m².an${factureAn > 0 ? `, soit ${Math.round(factureAn)} €/an` : ""}.`);
      if (values.annee_construction) constats.push(`Bâtiment construit en ${values.annee_construction}, structure ${values.type_structure || "non précisée"}.`);
      if (values.chauffage_type && values.chauffage_annee) constats.push(`Générateur de chauffage ${values.chauffage_type} installé en ${values.chauffage_annee}.`);
      if (values.ventilation_type && values.ventilation_type !== "Aucune") constats.push(`Ventilation ${values.ventilation_type}.`);
      if (values.murs_isolation === "Non isolé") constats.push("Murs non isolés : poste majeur de déperdition.");
      if (values.toiture_isolation === "Non isolé") constats.push("Toiture non isolée : priorité forte d'intervention.");

      const topActions = [...preconisations]
        .sort((a, b) => (b.opportunite || 0) - (a.opportunite || 0))
        .slice(0, 5);
      const leviers: string[] = topActions.length > 0
        ? topActions.map((a) => {
            const euro = a.economiesEuro ? ` — ${Math.round(a.economiesEuro)} €/an` : "";
            const tri  = a.tri ? `, TRI ${a.tri.toFixed(1)} ans` : "";
            return `${a.code} · ${a.titre}${euro}${tri}`;
          })
        : [];

      const lead = (constats.length > 0 || leviers.length > 0)
        ? {
            titre: "Synthèse et orientations",
            intro: [
              "Le présent audit énergétique a pour objet de dresser un diagnostic complet du bâtiment, d'identifier les postes de déperditions prioritaires et de proposer un bouquet de scénarios de rénovation cohérent avec les usages, les contraintes patrimoniales et le budget du bénéficiaire.",
              "La démarche s'appuie sur un relevé in situ, l'exploitation des factures énergétiques disponibles et un calcul thermique conforme aux référentiels DPE 2021 et RE2020. Les ordres de grandeur économiques (économies, retour sur investissement) sont indicatifs et devront être affinés en phase études d'exécution.",
            ],
            constats,
            leviers,
          }
        : undefined;

      await exportToWord({
        title: "Audit énergétique",
        subtitle: "Diagnostic complet et scénarios de rénovation",
        reference: values.ref_audit || "DRAFT",
        meta: [
          { label: "Référence", value: values.ref_audit || "—" },
          { label: "Bénéficiaire", value: values.client_nom || "—" },
          { label: "Adresse", value: values.adresse || "—" },
          { label: "Date visite", value: values.date_visite || "—" },
          { label: "Auditeur", value: values.redacteur || "—" },
          { label: "DPE actuel", value: values.dpe_actuel || "—" },
        ],
        lead,
        sections: wordSections,
        filename: `Audit_Energetique_${values.ref_audit || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.docx`,
      });
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
      setGeneratingWord(false);
    }
  }

  const PRECO_IDX = SECTIONS.length; // index virtuel pour la nav
  const isPrecoView = activeSection === PRECO_IDX;
  const currentSection = SECTIONS[activeSection];

  function addPreconisation() {
    const famille = PRECO_FAMILLES[0].key;
    const code = nextPrecoCode(preconisations, famille);
    setPreconisations((prev) => [
      ...prev,
      {
        code, famille, titre: "",
        opportunite: 3,
        horizon: PRECO_HORIZONS[0],
        faisabilite: PRECO_FAISABILITE[0],
        brief: "",
      },
    ]);
    setSaved(false);
  }
  function updatePreco(idx: number, patch: Partial<PreconisationAction>) {
    setPreconisations((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
    setSaved(false);
  }
  function removePreco(idx: number) {
    setPreconisations((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  }
  const totalPhotos = Object.values(sectionPhotos).reduce((sum, arr) => sum + arr.length, 0);
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
            <p className="text-sm text-muted-foreground">{completionPct}% complété — {filledRequired.length}/{allRequired.length} champs obligatoires{totalPhotos > 0 && ` — ${totalPhotos} photo${totalPhotos > 1 ? "s" : ""}`}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowBatimentPicker(true)}>
            <Building2 className="mr-2 h-4 w-4" />
            Charger un bâtiment type
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateNoteFromAudit} disabled={!hasExistingValues}>
            <Sparkles className="mr-2 h-4 w-4" />
            Créer la note CEE associée
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Sauvegarde..." : saved ? "Sauvegardé" : "Sauvegarder"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateWord} disabled={generatingWord || generating}>
            {generatingWord ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileType className="mr-2 h-4 w-4" />}
            {generatingWord ? "Word..." : "Word"}
          </Button>
          <Button size="sm" onClick={handleGeneratePDF} disabled={generating || generatingWord}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {generating ? "Génération..." : "Générer le PDF"}
          </Button>
        </div>
      </div>

      <BatimentTypePicker
        open={showBatimentPicker}
        onOpenChange={setShowBatimentPicker}
        hasExistingValues={hasExistingValues}
        onSelect={(tpl) => loadBatimentTemplate(tpl.values)}
      />

      <FicheChoiceDialog
        open={showFicheChoice}
        onOpenChange={setShowFicheChoice}
        candidates={ficheCandidates}
        onSelect={pickFiche}
        onCreateBlank={() => {
          setShowFicheChoice(false);
          router.push("/dashboard/documents");
        }}
      />

      {hasExistingValues && (
        <ValidationBanner issues={validationItems} onGoTo={setActiveSection} />
      )}

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-1">
          {SECTIONS.map((section, i) => {
            const sf = section.fields.filter((f) => f.required);
            const filled = sf.filter((f) => values[f.id]?.trim());
            const complete = sf.length > 0 && filled.length === sf.length;
            const sectionPhotoCount = (sectionPhotos[i] || []).length;
            return (
              <button key={i} onClick={() => setActiveSection(i)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  activeSection === i ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : filled.length > 0 ? <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" /> : <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">{i + 1}</span>}
                <span className="truncate">{section.titre}</span>
                {sectionPhotoCount > 0 && (
                  <Badge variant="outline" className="ml-auto text-[10px] gap-1">
                    <Camera className="h-3 w-3" />{sectionPhotoCount}
                  </Badge>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setActiveSection(PRECO_IDX)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              isPrecoView ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Target className="h-4 w-4 shrink-0" />
            <span className="truncate">{SECTIONS.length + 1}. Préconisations structurées</span>
            {preconisations.length > 0 && (
              <Badge variant="outline" className="ml-auto text-[10px]">{preconisations.length}</Badge>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isPrecoView ? (
            <motion.div key="preco" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Catalogue de préconisations
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Actions structurées par famille — alimentent la matrice et les fiches détaillées du rapport PDF.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" size="sm" onClick={addPreconisation}>
                    <Plus className="mr-1 h-4 w-4" /> Ajouter une action
                  </Button>

                  {preconisations.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune préconisation saisie. Cliquez sur « Ajouter une action » pour créer la première fiche.
                    </p>
                  )}

                  <div className="space-y-4">
                    {preconisations.map((a, idx) => (
                      <div key={idx} className="rounded-lg border bg-background p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[11px]">{a.code}</Badge>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => updatePreco(idx, { opportunite: n })}
                                className="p-0.5"
                                aria-label={`Opportunité ${n} étoile${n > 1 ? "s" : ""}`}
                              >
                                <Star
                                  className={cn(
                                    "h-4 w-4",
                                    n <= (a.opportunite || 0) ? "fill-primary text-primary" : "text-muted-foreground/40",
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={() => removePreco(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Famille</label>
                            <select
                              value={a.famille}
                              onChange={(e) => {
                                const newFam = e.target.value;
                                // régénère le code si préfixe différent
                                const oldPrefix = a.code.split("-")[0];
                                const newPrefix = PRECO_FAMILLES.find((f) => f.key === newFam)?.prefix ?? oldPrefix;
                                const patch: Partial<PreconisationAction> = { famille: newFam };
                                if (newPrefix !== oldPrefix) {
                                  patch.code = nextPrecoCode(preconisations.filter((_, i) => i !== idx), newFam);
                                }
                                updatePreco(idx, patch);
                              }}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            >
                              {PRECO_FAMILLES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Horizon</label>
                            <select
                              value={a.horizon}
                              onChange={(e) => updatePreco(idx, { horizon: e.target.value })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            >
                              {PRECO_HORIZONS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-medium">Titre de l&apos;action</label>
                            <input
                              type="text"
                              value={a.titre}
                              onChange={(e) => updatePreco(idx, { titre: e.target.value })}
                              placeholder="Ex : Isolation des combles perdus par soufflage ouate de cellulose R≥7"
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-medium">Brief technique / enjeu</label>
                            <textarea
                              value={a.brief || ""}
                              onChange={(e) => updatePreco(idx, { brief: e.target.value })}
                              rows={3}
                              placeholder="Contexte, matériel préconisé, méthodologie, points d'attention..."
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm resize-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Faisabilité</label>
                            <select
                              value={a.faisabilite || ""}
                              onChange={(e) => updatePreco(idx, { faisabilite: e.target.value })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            >
                              <option value="">—</option>
                              {PRECO_FAISABILITE.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Responsabilité</label>
                            <select
                              value={a.responsabilite || ""}
                              onChange={(e) => updatePreco(idx, { responsabilite: e.target.value })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            >
                              <option value="">—</option>
                              {PRECO_RESPONSABILITES.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">CEE cumac (MWh)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={a.ceeCumac ?? ""}
                              onChange={(e) => updatePreco(idx, { ceeCumac: e.target.value ? parseFloat(e.target.value) : undefined })}
                              placeholder="Si éligible CEE tertiaire"
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Économies (€/an)</label>
                            <input
                              type="number"
                              value={a.economiesEuro ?? ""}
                              onChange={(e) => updatePreco(idx, { economiesEuro: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Économies énergie (kWh/an)</label>
                            <input
                              type="number"
                              value={a.economiesKwh ?? ""}
                              onChange={(e) => updatePreco(idx, { economiesKwh: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">CO₂ évité (kg/an)</label>
                            <input
                              type="number"
                              value={a.co2Evite ?? ""}
                              onChange={(e) => updatePreco(idx, { co2Evite: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Coût travaux (€ TTC)</label>
                            <input
                              type="number"
                              value={a.coutTravaux ?? ""}
                              onChange={(e) => updatePreco(idx, { coutTravaux: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Aides mobilisables (€)</label>
                            <input
                              type="number"
                              value={a.aides ?? ""}
                              onChange={(e) => updatePreco(idx, { aides: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">TRI (années)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={a.tri ?? ""}
                              onChange={(e) => updatePreco(idx, { tri: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setActiveSection(SECTIONS.length - 1)}>&larr; Précédent</Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleGenerateWord} disabled={generatingWord || generating}>
                        {generatingWord ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileType className="mr-2 h-4 w-4" />}
                        {generatingWord ? "Word..." : "Word"}
                      </Button>
                      <Button size="sm" onClick={handleGeneratePDF} disabled={generating || generatingWord}>
                        {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        {generating ? "Génération..." : "Générer le PDF"}
                      </Button>
                    </div>
                  </div>
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
                  {/* Aperçu live DPE + GES au-dessus de la section Consommations */}
                  {activeSection === 5 && (dpeLive !== "—" || gesLive !== "—") && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <EnergyLabelUI
                          kind="DPE"
                          letter={dpeLive}
                          value={values.conso_par_m2 ? `${values.conso_par_m2} kWhEP/m²/an` : undefined}
                        />
                        <EnergyLabelUI
                          kind="GES"
                          letter={gesLive}
                          value={values.emissions_co2_m2 ? `${values.emissions_co2_m2} kgCO₂/m²/an` : undefined}
                        />
                      </div>
                      {(() => {
                        const dpe = parseDpeLetter(values.dpe_actuel);
                        const ges = parseDpeLetter(values.ges_actuel);
                        if (!dpe || !ges) return null;
                        return (
                          <DpeGesMatrix dpeActuel={dpe} gesActuel={ges} size="sm" />
                        );
                      })()}
                    </>
                  )}

                  {activeSection === 11 && (() => {
                    const dpe = parseDpeLetter(values.dpe_actuel);
                    const ges = parseDpeLetter(values.ges_actuel);
                    if (!dpe || !ges) return null;
                    const dpeP = parseDpeLetter(values.dpe_projete) ?? undefined;
                    // Pas de GES projeté saisi → on suppose conservation de la lettre GES
                    // si seul le DPE évolue (hypothèse prudente — peut être affiné plus tard).
                    const gesP: DpeGesLetter | undefined = dpeP ? ges : undefined;
                    return (
                      <DpeGesMatrix
                        dpeActuel={dpe}
                        gesActuel={ges}
                        dpeProjete={dpeP}
                        gesProjete={gesP}
                        size="sm"
                      />
                    );
                  })()}

                  <SuggestionsPanel
                    suggestions={suggestions.filter((s) =>
                      currentSection.fields.some((f) => f.id === s.fieldId),
                    )}
                    onApply={applySuggestion}
                    onApplyAll={() => {
                      const ids = new Set(currentSection.fields.map((f) => f.id));
                      setValues((prev) => {
                        const next = { ...prev };
                        for (const s of suggestions) {
                          if (ids.has(s.fieldId) && (!next[s.fieldId] || !next[s.fieldId].trim())) {
                            next[s.fieldId] = s.value;
                          }
                        }
                        return next;
                      });
                      setSaved(false);
                    }}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    {currentSection.fields.map((field) => {
                      const fieldIssue = getFieldIssue(field.id, values, fieldIssueCtx);
                      return (
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
                        {fieldIssue && (
                          <p className="text-[11px] text-amber-700 flex items-start gap-1 leading-snug">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{fieldIssue.message}</span>
                          </p>
                        )}
                        {field.help && <p className="text-[11px] text-muted-foreground leading-snug">{field.help}</p>}
                      </div>
                      );
                    })}
                  </div>

                  {/* Blocs de calcul thermique (sections 3, 4, 6, 7, 8). */}
                  {activeSection === 2 && thermal.deperditions && (
                    <CalcCard title="Enveloppe — coefficient Ubat moyen" subtitle="Estimé à partir des U et surfaces saisis">
                      <CalcRow label="Ubat moyen pondéré" computed={thermal.deperditions.ubatMoyen.toFixed(2)} unit=" W/m²·K" saved={values.ubat || undefined} />
                      <CalcRow label="Surface déperditive totale" computed={thermal.deperditions.surfaceDeperditiveTotale.toFixed(0)} unit=" m²" />
                      <CalcRow label="H ponts thermiques (forfait)" computed={thermal.deperditions.hPontsThermiques.toFixed(0)} unit=" W/K" />
                      {issueUMurs && (
                        <p className="text-[11px] text-amber-700 mt-1">{issueUMurs.message}</p>
                      )}
                      <div className="flex justify-end pt-1">
                        <ApplyButton
                          onClick={() => {
                            updateValue("ubat", thermal.deperditions!.ubatMoyen.toFixed(2));
                          }}
                          label="Appliquer Ubat"
                        />
                      </div>
                    </CalcCard>
                  )}

                  {activeSection === 3 && thermal.apports && (
                    <CalcCard title="Apports solaires gratuits (F·g·H_g)" subtitle="Méthode 3CL — surfaces vitrées par orientation">
                      <CalcRow label="Apport annuel total" computed={thermal.apports.apportAnnuel.toFixed(0)} unit=" kWh/an" />
                      <CalcRow label="Saison de chauffe (oct.→avr.)" computed={thermal.apports.apportSaisonChauffe.toFixed(0)} unit=" kWh" />
                      <CalcRow label="Saison chaude (mai→sep.)" computed={thermal.apports.apportSaisonChaude.toFixed(0)} unit=" kWh" warn={thermal.apports.risqueSurchauffe} />
                      {thermal.apports.risqueSurchauffe && (
                        <p className="text-[11px] text-amber-700 mt-1">Risque de surchauffe estivale — prévoir protections solaires.</p>
                      )}
                    </CalcCard>
                  )}

                  {activeSection === 5 && thermal.dpe && (
                    <CalcCard title="DPE 5 usages — méthode 3CL-DPE 2021" subtitle={`Étiquette finale : ${thermal.dpe.classe_finale} (max DPE/GES)`}>
                      <CalcRow label="Cep (énergie primaire)" computed={thermal.dpe.cep_kwh_m2.toFixed(0)} unit=" kWh EP/m²·an" saved={values.conso_par_m2 || undefined} />
                      <CalcRow label="Étiquette DPE" computed={thermal.dpe.classe_dpe} saved={(values.dpe_actuel || "").charAt(0) || undefined} />
                      <CalcRow label="GES" computed={thermal.dpe.ges_kg_m2.toFixed(1)} unit=" kg CO₂/m²·an" saved={values.emissions_co2_m2 || undefined} />
                      <CalcRow label="Étiquette GES" computed={thermal.dpe.classe_ges} saved={(values.ges_actuel || "").charAt(0) || undefined} />
                      {issueEcart && (
                        <p className="text-[11px] text-amber-700 mt-1">{issueEcart.message}</p>
                      )}
                      <div className="flex justify-end gap-2 pt-1">
                        <ApplyButton
                          onClick={() => {
                            updateValue("conso_par_m2", thermal.dpe!.cep_kwh_m2.toFixed(0));
                            updateValue("conso_totale", (thermal.dpe!.cep_kwh).toFixed(0));
                            updateValue("emissions_co2_m2", thermal.dpe!.ges_kg_m2.toFixed(1));
                            updateValue("emissions_co2", thermal.dpe!.ges_kg.toFixed(0));
                          }}
                        />
                      </div>
                    </CalcCard>
                  )}

                  {activeSection === 6 && thermal.besoins && (
                    <CalcCard title="Répartition par poste — chauffage calculé" subtitle="Conso chauffage = Besoin net / rendement générateur">
                      <CalcRow label="Coefficient G" computed={thermal.besoins.coefG.toFixed(2)} unit=" W/m³·K" />
                      <CalcRow label="Besoin brut" computed={thermal.besoins.besoinBrut.toFixed(0)} unit=" kWh/an" />
                      <CalcRow label="Apports utilisés" computed={thermal.besoins.apportsUtilisables.toFixed(0)} unit=" kWh/an" />
                      <CalcRow label="Besoin net" computed={thermal.besoins.besoinNet.toFixed(0)} unit=" kWh/an" />
                      <CalcRow label="Conso finale chauffage" computed={thermal.besoins.consoFinale.toFixed(0)} unit=" kWh/an" saved={values.poste_chauffage || undefined} />
                      <div className="flex justify-end pt-1">
                        <ApplyButton
                          onClick={() => updateValue("poste_chauffage", thermal.besoins!.consoFinale.toFixed(0))}
                          label="Appliquer chauffage"
                        />
                      </div>
                    </CalcCard>
                  )}

                  {activeSection === 7 && thermal.deperditions && (
                    <CalcCard title="Déperditions par paroi (Th-BCE)" subtitle="Calculées à partir de l'enveloppe">
                      <CalcRow label="Murs" computed={thermal.deperditions.pctMurs.toFixed(0)} unit=" %" saved={values.deperd_murs || undefined} />
                      <CalcRow label="Toiture" computed={thermal.deperditions.pctToiture.toFixed(0)} unit=" %" saved={values.deperd_toiture || undefined} />
                      <CalcRow label="Plancher bas" computed={thermal.deperditions.pctPlancher.toFixed(0)} unit=" %" saved={values.deperd_plancher || undefined} />
                      <CalcRow label="Menuiseries" computed={thermal.deperditions.pctVitree.toFixed(0)} unit=" %" saved={values.deperd_menuiseries || undefined} />
                      <CalcRow label="Ponts thermiques" computed={thermal.deperditions.pctPontsThermiques.toFixed(0)} unit=" %" saved={values.deperd_ponts || undefined} />
                      <CalcRow label="Ventilation (VMC)" computed={thermal.deperditions.pctVentilation.toFixed(0)} unit=" %" saved={values.deperd_ventilation || undefined} />
                      <CalcRow label="Infiltrations" computed={thermal.deperditions.pctInfiltrations.toFixed(0)} unit=" %" saved={values.deperd_infiltrations || undefined} />
                      <CalcRow label="H_total" computed={thermal.deperditions.hTotal.toFixed(0)} unit=" W/K" />
                      {issueDeperditions && (
                        <p className={cn("text-[11px] mt-1", issueDeperditions.niveau === "error" ? "text-red-700" : "text-amber-700")}>
                          {issueDeperditions.message}
                        </p>
                      )}
                      <div className="flex justify-end pt-1">
                        <ApplyButton
                          onClick={() => {
                            const d = thermal.deperditions!;
                            updateValue("deperd_murs", d.pctMurs.toFixed(0));
                            updateValue("deperd_toiture", d.pctToiture.toFixed(0));
                            updateValue("deperd_plancher", d.pctPlancher.toFixed(0));
                            updateValue("deperd_menuiseries", d.pctVitree.toFixed(0));
                            updateValue("deperd_ponts", d.pctPontsThermiques.toFixed(0));
                            updateValue("deperd_ventilation", d.pctVentilation.toFixed(0));
                            updateValue("deperd_infiltrations", d.pctInfiltrations.toFixed(0));
                          }}
                          label="Appliquer la répartition"
                        />
                      </div>
                    </CalcCard>
                  )}

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
                              <button onClick={() => setSectionPhotos((prev) => ({ ...prev, [activeSection]: (prev[activeSection] || []).filter((p) => p.id !== photo.id) }))} className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-white shadow-sm">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <span className="text-xs font-medium text-muted-foreground">Photo {i + 1}</span>
                              <select
                                value={photo.categorie}
                                onChange={(e) => setSectionPhotos((prev) => ({ ...prev, [activeSection]: (prev[activeSection] || []).map((p) => p.id === photo.id ? { ...p, categorie: e.target.value } : p) }))}
                                className="w-full rounded-md border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
                              >
                                {PHOTO_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                              <input
                                type="text"
                                value={photo.legende}
                                onChange={(e) => setSectionPhotos((prev) => ({ ...prev, [activeSection]: (prev[activeSection] || []).map((p) => p.id === photo.id ? { ...p, legende: e.target.value } : p) }))}
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
                    <Button variant="outline" size="sm" onClick={() => setActiveSection(Math.max(0, activeSection - 1))} disabled={activeSection === 0}>&larr; Précédent</Button>
                    <Button size="sm" onClick={() => setActiveSection(activeSection + 1)}>Suivant &rarr;</Button>
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
