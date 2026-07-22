/**
 * Mapper Projet → Note de dimensionnement.
 *
 * Produit le payload de pré-remplissage de la Note de dimensionnement
 * (module Documents) à partir des données déjà saisies / calculées dans
 * le projet : identité client, enveloppe (Bâti), systèmes existants et
 * dernière calibration ERA5.
 *
 * Principe architectural : la Note ne re-saisit rien. Elle LIT le projet
 * (source unique de vérité) via ce mapper, qui traduit les données projet
 * vers les clés du formulaire plat `values` de NoteDimensionnement.
 *
 * Le canal de transport est le même que le pont Audit→Note :
 * localStorage["kilowater:audit-to-note-prefill"] = { fiche, values, ref, projetId }
 */

import { prisma } from "./db";
import { buildProjetBaseline } from "./calcul-projet";
import type { Vecteur } from "./thermal/dpe";

/** Fiches CEE supportées par NoteDimensionnement (sous-ensemble utile ici). */
export type FicheId =
  | "BAT-TH-163"
  | "BAR-TH-171"
  | "BAT-TH-134"
  | "BAT-TH-142"
  | "BAT-TH-139"
  | "BAR-TH-159"
  | "BAR-EN-101"
  | "BAR-EN-102"
  | "BAR-EN-103"
  | "BAT-TH-116";

export interface ProjetNotePrefill {
  fiche: FicheId;
  values: Record<string, string>;
  projetId: string;
  ref: string | null;
}

export type BuildPrefillResult =
  | { ok: true; payload: ProjetNotePrefill }
  | { ok: false; status: number; error: string };

const VECTEUR_GENERATEUR_LABEL: Record<Vecteur, string> = {
  elec: "Générateur électrique",
  gaz_naturel: "Chaudière gaz naturel",
  fioul: "Chaudière fioul",
  bois: "Chaudière bois / granulés",
  propane: "Chaudière propane / GPL",
  reseau_chaleur: "Sous-station réseau de chaleur",
};

/** Qualifie l'isolation d'une paroi depuis son U (W/m²·K). */
function isolationDepuisU(u: number, seuilBon: number, seuilMoyen: number): string {
  if (u <= 0) return "Inconnue";
  if (u <= seuilBon) return "Isolée";
  if (u <= seuilMoyen) return "Partiellement isolée";
  return "Non isolée";
}

/** Choisit la fiche CEE par défaut selon la catégorie du projet. */
function ficheParCategorie(categorie: string | null): FicheId {
  // PAC air/eau : BAT-TH-163 tertiaire, BAR-TH-171 résidentiel collectif
  if (categorie === "RESIDENTIEL_COLLECTIF") return "BAR-TH-171";
  return "BAT-TH-163";
}

/** Fiches proposées au choix depuis un projet, avec libellé équipement. */
export const FICHES_DISPONIBLES: Array<{ id: FicheId; label: string; groupe: string }> = [
  { id: "BAT-TH-163", label: "PAC air/eau (tertiaire)", groupe: "Production de chaleur" },
  { id: "BAR-TH-171", label: "PAC air/eau (résidentiel collectif)", groupe: "Production de chaleur" },
  { id: "BAR-TH-159", label: "PAC hybride (résidentiel)", groupe: "Production de chaleur" },
  { id: "BAT-TH-142", label: "Déstratification de l'air", groupe: "Chauffage / régulation" },
  { id: "BAT-TH-116", label: "GTB — gestion technique du bâtiment", groupe: "Chauffage / régulation" },
  { id: "BAT-TH-134", label: "Régulation HP flottante (groupe froid)", groupe: "Froid" },
  { id: "BAT-TH-139", label: "Récupération de chaleur sur groupe froid", groupe: "Froid" },
  { id: "BAR-EN-101", label: "Isolation combles / toiture", groupe: "Enveloppe" },
  { id: "BAR-EN-102", label: "Isolation des murs", groupe: "Enveloppe" },
  { id: "BAR-EN-103", label: "Isolation d'un plancher", groupe: "Enveloppe" },
];

/**
 * Construit le payload de pré-remplissage de la Note depuis un projet.
 *
 * @param projetId       Projet source
 * @param ficheOverride  Équipement/fiche cible choisi par l'utilisateur.
 *                       Si absent, la fiche par défaut est déduite de la
 *                       catégorie (PAC air/eau) — mais l'utilisateur peut
 *                       toujours changer de fiche dans l'éditeur.
 */
export async function buildProjetNotePrefill(
  projetId: string,
  ficheOverride?: FicheId,
): Promise<BuildPrefillResult> {
  const projet = await prisma.projet.findFirst({
    where: { id: projetId, deletedAt: null },
    include: { client: true },
  });
  if (!projet) return { ok: false, status: 404, error: "Projet introuvable" };

  // Fiche cible : choix explicite de l'utilisateur, sinon défaut par catégorie.
  const fiche: FicheId = ficheOverride ?? ficheParCategorie(projet.categorieCible);

  const values: Record<string, string> = {};

  // ─── Identité ────────────────────────────────────────────────
  const clientLabel =
    [projet.client?.nom, projet.client?.prenom].filter(Boolean).join(" ") ||
    projet.client?.raisonSociale ||
    "";
  if (clientLabel) {
    values.client_nom = clientLabel;
    values.maitre_ouvrage = clientLabel;
  }
  const adresse =
    projet.adresseChantier ||
    [projet.client?.adresse, projet.client?.codePostal, projet.client?.ville]
      .filter(Boolean)
      .join(", ");
  if (adresse) values.adresse_chantier = adresse;

  // Type de bâtiment depuis la catégorie cible
  const catLabel: Record<string, string> = {
    TERTIAIRE: "Tertiaire",
    RESIDENTIEL_COLLECTIF: "Immeuble collectif",
    INDUSTRIE: "Bâtiment industriel",
    AGRICULTURE: "Bâtiment agricole",
    PARTICULIER: "Maison individuelle",
  };
  if (projet.categorieCible && catLabel[projet.categorieCible]) {
    values.type_batiment = catLabel[projet.categorieCible];
  }

  // ─── Enveloppe (Bâti) via baseline ───────────────────────────
  const baselineRes = await buildProjetBaseline(projetId);
  const baseline = baselineRes?.baseline;
  if (baseline) {
    if (baseline.zoneClimatique) values.zone_climatique = baseline.zoneClimatique;
    if (baseline.surfaceHabitable > 0) {
      values.surface_chauffee = String(Math.round(baseline.surfaceHabitable));
      values.surface_habitable = String(Math.round(baseline.surfaceHabitable));
      values.surface_plancher = String(Math.round(baseline.surfaceHabitable));
    }
    // Isolation qualitative depuis les U moyens
    if (baseline.uMurs > 0)
      values.isolation_murs = isolationDepuisU(baseline.uMurs, 0.4, 1.0);
    if (baseline.uToiture > 0)
      values.isolation_toiture = isolationDepuisU(baseline.uToiture, 0.25, 0.6);
    if (baseline.uPlancher > 0)
      values.isolation_plancher = isolationDepuisU(baseline.uPlancher, 0.35, 0.8);

    // Système existant
    values.type_generateur_existant =
      VECTEUR_GENERATEUR_LABEL[baseline.chauffageVecteur] ??
      baseline.chauffageVecteur;
    // Rendement effectif (SCOP si PAC, rendement sinon) — format 0-1
    if (baseline.chauffageEff > 0) {
      values.rendement_existant = baseline.chauffageEff.toFixed(2);
    }

    // Champs spécifiques selon l'équipement dimensionné
    if (fiche === "BAR-EN-101" && baseline.surfaceToiture > 0)
      values.surface_isolant = String(Math.round(baseline.surfaceToiture));
    if (fiche === "BAR-EN-102" && baseline.surfaceMurs > 0)
      values.surface_isolant = String(Math.round(baseline.surfaceMurs));
    if (fiche === "BAR-EN-103" && baseline.surfacePlancher > 0)
      values.surface_isolant = String(Math.round(baseline.surfacePlancher));
    // Déstratification (BAT-TH-142) : hauteur sous plafond ≈ volume / surface
    if (fiche === "BAT-TH-142" && baseline.surfaceHabitable > 0) {
      const h = baseline.volumeChauffe / baseline.surfaceHabitable;
      if (h > 0) values.hauteur_sous_plafond = h.toFixed(1);
    }
  }

  // ─── Dernière calibration ERA5 (si présente) ─────────────────
  const calibration = await prisma.calibration.findFirst({
    where: { projetId },
    orderBy: { createdAt: "desc" },
  });
  if (calibration) {
    // Puissance calée du besoin → seed pour la puissance générateur existant
    values.puissance_existant = String(Math.round(Number(calibration.pCaleeDh)));
    // Rendement retenu à la calibration (PCS) prime sur l'effectif baseline
    values.rendement_existant = Number(calibration.rendement).toFixed(3);
    // Champs calibration exploitables par la note (si le formulaire les gère)
    values.puissance_calee = String(Math.round(Number(calibration.pCaleeDh)));
    values.somme_dh = String(Math.round(Number(calibration.sommeDh)));
    values.conforme_ashrae = calibration.conformeAshrae ? "Oui" : "Non";
    values.zone_climatique = values.zone_climatique || "";
  }

  return {
    ok: true,
    payload: {
      fiche,
      values,
      projetId: projet.id,
      ref: `KW-${projet.id.slice(-8).toUpperCase()}`,
    },
  };
}
