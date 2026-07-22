/**
 * Mapper Projet → Audit énergétique.
 *
 * Produit le payload de pré-remplissage de l'éditeur Audit (module Documents)
 * à partir de TOUTES les couches déjà présentes dans le projet :
 *   • Identité client
 *   • Enveloppe (Bâti) : surfaces, U moyens
 *   • Systèmes : générateur, ECS
 *   • Analyse thermique : DPE, GES, répartition des déperditions
 *   • Calibration ERA5 : consommations relevées
 *   • Profil DEET : assujettissement, baseline, projection
 *
 * Principe : l'audit ne re-saisit rien. Il LIT le projet (source unique)
 * via ce mapper, qui traduit vers les clés du formulaire audit (les mêmes
 * que celles lues par mapAuditToNote).
 *
 * Canal de transport : localStorage["kilowater:projet-to-audit-prefill"]
 *   = { values, ref, projetId }
 */

import { prisma } from "./db";
import { buildProjetBaseline } from "./calcul-projet";
import { computeIndicatorsFromState } from "./calcul-variante";
import type { Vecteur } from "./thermal/dpe";

export interface ProjetAuditPrefill {
  values: Record<string, string>;
  projetId: string;
  ref: string | null;
}

export type BuildAuditPrefillResult =
  | { ok: true; payload: ProjetAuditPrefill }
  | { ok: false; status: number; error: string };

const VECTEUR_GENERATEUR_LABEL: Record<Vecteur, string> = {
  elec: "Électrique (effet Joule / PAC)",
  gaz_naturel: "Chaudière gaz naturel",
  fioul: "Chaudière fioul",
  bois: "Chaudière bois / granulés",
  propane: "Chaudière propane / GPL",
  reseau_chaleur: "Réseau de chaleur",
};

const VECTEUR_ECS_LABEL: Record<Vecteur, string> = {
  elec: "Ballon électrique / thermodynamique",
  gaz_naturel: "Production gaz",
  fioul: "Production fioul",
  bois: "Production bois",
  propane: "Production propane",
  reseau_chaleur: "Réseau de chaleur",
};

const CATEGORIE_TYPE_BAT: Record<string, string> = {
  TERTIAIRE: "Bâtiment tertiaire",
  RESIDENTIEL_COLLECTIF: "Immeuble collectif",
  INDUSTRIE: "Bâtiment tertiaire",
  AGRICULTURE: "Bâtiment tertiaire",
  PARTICULIER: "Maison individuelle",
};

/**
 * Construit le payload de pré-remplissage de l'audit depuis un projet.
 */
export async function buildProjetAuditPrefill(
  projetId: string,
): Promise<BuildAuditPrefillResult> {
  const projet = await prisma.projet.findFirst({
    where: { id: projetId, deletedAt: null },
    include: { client: true },
  });
  if (!projet) return { ok: false, status: 404, error: "Projet introuvable" };

  const values: Record<string, string> = {};

  // ─── Identité ────────────────────────────────────────────────
  const clientLabel =
    [projet.client?.nom, projet.client?.prenom].filter(Boolean).join(" ") ||
    projet.client?.raisonSociale ||
    "";
  if (clientLabel) values.client_nom = clientLabel;
  if (projet.client?.email) values.client_email = projet.client.email;
  if (projet.client?.telephone) values.client_telephone = projet.client.telephone;
  const adresse =
    projet.adresseChantier ||
    [projet.client?.adresse, projet.client?.codePostal, projet.client?.ville]
      .filter(Boolean)
      .join(", ");
  if (adresse) values.adresse = adresse;
  if (projet.categorieCible && CATEGORIE_TYPE_BAT[projet.categorieCible]) {
    values.type_batiment = CATEGORIE_TYPE_BAT[projet.categorieCible];
  }
  values.date_visite = new Date().toISOString().slice(0, 10);

  // ─── Enveloppe + analyse thermique (baseline + indicateurs) ──
  const baselineRes = await buildProjetBaseline(projetId);
  const baseline = baselineRes?.baseline;
  if (baseline) {
    if (baseline.zoneClimatique) values.zone_climatique = baseline.zoneClimatique;
    if (baseline.surfaceHabitable > 0)
      values.surface_habitable = String(Math.round(baseline.surfaceHabitable));

    // Systèmes
    values.chauffage_type =
      VECTEUR_GENERATEUR_LABEL[baseline.chauffageVecteur] ?? baseline.chauffageVecteur;
    values.ecs_type = VECTEUR_ECS_LABEL[baseline.ecsVecteur] ?? baseline.ecsVecteur;
    if (baseline.hasClim) values.climatisation = "Oui";

    // Indicateurs (DPE, GES, conso)
    const ind = computeIndicatorsFromState(baseline);
    values.dpe_actuel = ind.dpe;
    values.ges_actuel = ind.ges_class;
    values.conso_totale = String(Math.round(ind.cep));

    // Répartition des déperditions dérivée des U×S par poste
    const hMurs = baseline.uMurs * baseline.surfaceMurs;
    const hToiture = baseline.uToiture * baseline.surfaceToiture;
    const hPlancher = baseline.uPlancher * baseline.surfacePlancher;
    const hVitree = baseline.uVitree * baseline.surfaceVitree;
    const hVent = 0.34 * baseline.renouvellementAir * baseline.volumeChauffe;
    const hTotal = hMurs + hToiture + hPlancher + hVitree + hVent;
    if (hTotal > 0) {
      const p = (h: number) => String(Math.round((h / hTotal) * 100));
      values.deperd_murs = p(hMurs);
      values.deperd_toiture = p(hToiture);
      values.deperd_plancher = p(hPlancher);
      values.deperd_menuiseries = p(hVitree);
      values.deperd_ventilation = p(hVent);
    }
  }

  // ─── Calibration ERA5 → consommations relevées ──────────────
  const calibration = await prisma.calibration.findFirst({
    where: { projetId },
    orderBy: { createdAt: "desc" },
  });
  if (calibration) {
    values.chauffage_puissance = String(Math.round(Number(calibration.pCaleeDh)));
    values.chauffage_rendement = Number(calibration.rendement).toFixed(2);
    const energie = Math.round(Number(calibration.energieRelevee));
    // Renseigne la conso du vecteur relevé (gaz par défaut)
    values.facture_gaz_conso = String(energie);
    values.facture_analyse = `Énergie relevée sur la période de calibration : ${energie.toLocaleString(
      "fr-FR",
    )} kWh (compteur réel).`;
  }

  // ─── Profil DEET ─────────────────────────────────────────────
  const deet = await prisma.deetProfil.findUnique({ where: { projetId } });
  if (deet) {
    values.deet_applicable = deet.assujetti
      ? "Oui — surface > 1000 m²"
      : "Non assujetti";
    values.deet_baseline_annee = String(deet.anneeReference);
    values.deet_baseline_kwh = String(
      Math.round(Number(deet.consoReferenceKwhEfM2)),
    );
    if (deet.consoActuelleKwhEfM2 != null) {
      values.deet_projection = String(
        Math.round(Number(deet.consoActuelleKwhEfM2)),
      );
    }
  }

  return {
    ok: true,
    payload: {
      values,
      projetId: projet.id,
      ref: `KW-AUDIT-${projet.id.slice(-8).toUpperCase()}`,
    },
  };
}
