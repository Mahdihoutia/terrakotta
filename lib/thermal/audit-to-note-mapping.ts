/**
 * Détection des fiches CEE pertinentes depuis un audit énergétique
 * et mapping des valeurs communes audit → questionnaire de note
 * de dimensionnement.
 */

export type FicheId =
  | "BAT-TH-134"
  | "BAT-TH-163"
  | "BAT-TH-142"
  | "BAT-TH-139"
  | "BAR-TH-171"
  | "BAR-TH-159"
  | "BAR-EN-101"
  | "BAR-EN-102"
  | "BAR-EN-103"
  | "BAT-TH-116";

export interface FicheCandidate {
  id: FicheId;
  raison: string;
  priorite: number; // 1 = très pertinent, 5 = peu pertinent
}

interface AuditValues {
  [key: string]: string;
}

function num(v: string | undefined): number {
  const n = parseFloat((v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function isResidentiel(typeBatiment: string): boolean {
  const s = (typeBatiment || "").toLowerCase();
  return s.includes("maison") || s.includes("appartement") || s.includes("immeuble collectif");
}

/**
 * Détecte les fiches CEE candidates depuis les saisies de l'audit.
 * Trie par pertinence décroissante.
 */
export function detectFichesCandidates(values: AuditValues): FicheCandidate[] {
  const candidates: FicheCandidate[] = [];
  const residentiel = isResidentiel(values.type_batiment || "");

  // Chauffage vétuste → PAC air/eau
  const chauffType = (values.chauffage_type || "").toLowerCase();
  const chauffAnnee = num(values.chauffage_annee);
  const chauffageVetuste =
    (chauffType.includes("gaz") || chauffType.includes("fioul")) &&
    chauffAnnee > 0 && chauffAnnee < 2000;
  if (chauffageVetuste) {
    candidates.push({
      id: residentiel ? "BAR-TH-171" : "BAT-TH-163",
      raison: `Chauffage ${values.chauffage_type} de ${chauffAnnee} — remplacement par PAC air/eau`,
      priorite: 1,
    });
  }

  // Toiture non isolée → BAR-EN-101
  const toiture = (values.toiture_isolation || "").toLowerCase();
  if (toiture.includes("non isol") || toiture.includes("insuff")) {
    candidates.push({
      id: "BAR-EN-101",
      raison: "Toiture / combles peu ou pas isolés — opportunité d'isolation",
      priorite: 2,
    });
  }

  // Murs non isolés → BAR-EN-102
  const murs = (values.murs_isolation || "").toLowerCase();
  if (murs.includes("non isol")) {
    candidates.push({
      id: "BAR-EN-102",
      raison: "Murs non isolés — opportunité d'isolation par l'extérieur ou l'intérieur",
      priorite: 2,
    });
  }

  // Plancher non isolé → BAR-EN-103
  const plancher = (values.plancher_isolation || "").toLowerCase();
  if (plancher.includes("non isol")) {
    candidates.push({
      id: "BAR-EN-103",
      raison: "Plancher bas non isolé — opportunité d'isolation",
      priorite: 3,
    });
  }

  // Groupe froid à condensation à air ancien → BAT-TH-134
  const gfPresence = (values.presence_groupe_froid || "").toLowerCase();
  const gfAnnee = num(values.gf_annee);
  if (gfPresence.includes("condensation") && (gfAnnee === 0 || gfAnnee < 2010)) {
    candidates.push({
      id: "BAT-TH-134",
      raison: "Groupe froid à condensation à air — haute pression flottante éligible",
      priorite: 2,
    });
  }

  return candidates.sort((a, b) => a.priorite - b.priorite);
}

/**
 * Pré-remplit les champs communs entre l'audit et le questionnaire
 * de la fiche choisie.
 */
export function mapAuditToNote(values: AuditValues, fiche: FicheId): Record<string, string> {
  const out: Record<string, string> = {};

  // Champs communs « identification »
  if (values.client_nom) out.maitre_ouvrage = values.client_nom;
  if (values.adresse) out.adresse_chantier = values.adresse;
  if (values.zone_climatique) out.zone_climatique = values.zone_climatique;

  // Surfaces
  if (values.surface_habitable) {
    out.surface_chauffee = values.surface_habitable;
    out.surface_habitable = values.surface_habitable;
  }
  if (values.surface_plancher) out.surface_plancher = values.surface_plancher;
  if (values.annee_construction) out.annee_construction = values.annee_construction;

  // Type bâtiment — mapping libellés
  const tb = (values.type_batiment || "").toLowerCase();
  if (tb.includes("maison")) out.type_batiment = "Maison individuelle";
  else if (tb.includes("appartement")) out.type_batiment = "Appartement";
  else if (tb.includes("immeuble")) out.type_batiment = "Immeuble collectif";
  else if (tb.includes("tertiaire")) out.type_batiment = "Tertiaire";
  else if (tb.includes("public")) out.type_batiment = "Bâtiment public";

  // Système existant (pour fiches PAC / déstratification)
  if (values.chauffage_type) out.type_generateur_existant = values.chauffage_type;
  if (values.chauffage_puissance) out.puissance_existant = values.chauffage_puissance;
  if (values.chauffage_rendement) {
    const r = num(values.chauffage_rendement);
    out.rendement_existant = r > 30 ? (r / 100).toFixed(2) : r.toFixed(2);
  }
  if (values.chauffage_annee) out.annee_generateur_existant = values.chauffage_annee;

  // Surfaces enveloppe (BAR-EN-101/102/103)
  if (fiche === "BAR-EN-101" && values.surface_toiture) {
    out.surface_isolant = values.surface_toiture;
  }
  if (fiche === "BAR-EN-102" && values.surface_murs_deperditifs) {
    out.surface_isolant = values.surface_murs_deperditifs;
  }
  if (fiche === "BAR-EN-103" && values.surface_plancher_bas) {
    out.surface_isolant = values.surface_plancher_bas;
  }

  // Isolation existante (libellé) — utile pour PAC/CEE
  if (values.murs_isolation) out.isolation_murs = values.murs_isolation;
  if (values.toiture_isolation) out.isolation_toiture = values.toiture_isolation;
  if (values.plancher_isolation) out.isolation_plancher = values.plancher_isolation;

  // Données groupe froid (BAT-TH-134, BAT-TH-139)
  if (fiche === "BAT-TH-134" || fiche === "BAT-TH-139") {
    if (values.gf_puissance) out.puissance_gf = values.gf_puissance;
    if (values.gf_annee) out.annee_gf = values.gf_annee;
  }

  // Hauteur sous plafond (BAT-TH-142 déstratification)
  if (fiche === "BAT-TH-142" && values.hauteur_plafond) {
    out.hauteur_sous_plafond = values.hauteur_plafond;
  }

  return out;
}
