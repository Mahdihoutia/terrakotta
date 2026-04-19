"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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

async function generatePDF(sections: QuestionSection[], values: FormValues, sectionPhotos: Record<number, PhotoItem[]>) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const {
    drawCoverPage,
    drawSommaire,
    drawSectionHeader,
    drawFooter,
    drawPhotoEntry,
    drawDPEGESDual,
    drawConsoBreakdown,
    drawDeperditionsChart,
    drawBeforeAfterComparison,
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

  // ─── Page 1 : Cover ──────────────────────────────────────
  drawCoverPage(
    doc,
    "Audit energetique",
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

  // ─── Page 2 : Sommaire (filled after content) ────────────
  doc.addPage();
  const tocPageNum = doc.getNumberOfPages();

  // ─── Page 3+ : Content ───────────────────────────────────
  doc.addPage();
  let y: number = PDF_LAYOUT.topMargin;
  const tocEntries: { title: string; page: number }[] = [];

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
  drawSommaire(doc, tocEntries, "Audit energetique", reference);

  // ─── Footers (skip page 1 = dark cover) ──────────────────
  const totalPages = doc.getNumberOfPages();
  const contentPages = totalPages - 1;
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Audit energetique", reference, i - 1, contentPages);
  }
  doc.save(`Audit_Energetique_${values.ref_audit || "DRAFT"}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Component ──────────────────────────────────────────────────

export default function AuditEnergetique({ onBack, onSaved, existingDoc }: Props) {
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
      const donnees = JSON.stringify({ ...values, _sectionPhotos: Object.keys(photosToSave).length > 0 ? photosToSave : undefined });
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
      await generatePDF(SECTIONS, values, sectionPhotos);
      if (docId) { await fetch(`/api/documents/${docId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: "TERMINE" }) }); onSaved?.(); }
      else { await handleSave(); }
    } finally { setGenerating(false); }
  }

  const currentSection = SECTIONS[activeSection];
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
        </div>

        <AnimatePresence mode="wait">
          {currentSection ? (
            <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{currentSection.titre}</CardTitle>
                  {currentSection.description && <p className="text-sm text-muted-foreground">{currentSection.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Aperçu live DPE + GES au-dessus de la section Consommations */}
                  {activeSection === 5 && (dpeLive !== "—" || gesLive !== "—") && (
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
                  )}

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
