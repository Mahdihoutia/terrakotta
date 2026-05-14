/**
 * Builder unifié des données du rapport projet (PDF + Word).
 *
 * Source de vérité : utilise `buildProjetBaseline` + `applyGestesToBaseline`
 * + `computeIndicatorsFromState` — exactement la même chaîne que les onglets
 * `/calcul` et `/scenarios` du dashboard. Garantit que le livrable client
 * affiche les MÊMES indicateurs que le tableau de bord (B1).
 *
 * Si `varianteId` est fourni, applique les gestes de la variante avant
 * calcul et peuple le plan de financement (B2).
 */

import { prisma } from "./db";
import { buildProjetBaseline } from "./calcul-projet";
import {
  applyGestesToBaseline,
  computeIndicatorsFromState,
  TARIFS_ENERGIE_2025,
  type BaselineState,
} from "./calcul-variante";
import {
  calculerDeperditions,
  calculerDpe,
  calculerApportsSolaires,
  estimerPontsForfaitaire,
  parseZone,
  type Orientation,
} from "./thermal";
import {
  calculerAides,
  type FoyerDemandeur,
  type Geste,
  type GesteCode,
} from "./aides";
import type { RapportProjetData } from "./pdf-rapport-projet";

/**
 * Foyer fallback pour le calcul MaPrimeRénov' quand aucune variante ne
 * fournit de ressources foyer. À remplacer dès que les ressources foyer
 * sont persistées sur le Projet (cf. audit B3).
 */
const FOYER_FALLBACK: FoyerDemandeur = {
  zone: "AUTRES",
  nbPersonnes: 4,
  rfr: 28000,
};

export interface RapportContext {
  data: RapportProjetData;
  varianteNom: string | null;
  reference: string;
}

function normalizeOrient(raw: string | null | undefined): Orientation | null {
  if (!raw) return null;
  const o = raw.toUpperCase().replace(/[ÉÈ]/g, "E").trim();
  const map: Record<string, Orientation> = {
    S: "S", SUD: "S",
    SE: "SE", "SUD-EST": "SE", "SUD EST": "SE",
    SO: "SO", SW: "SO", "SUD-OUEST": "SO", "SUD OUEST": "SO",
    E: "E", EST: "E",
    O: "O", W: "O", OUEST: "O",
    NE: "NE", "NORD-EST": "NE", "NORD EST": "NE",
    NO: "NO", NW: "NO", "NORD-OUEST": "NO", "NORD OUEST": "NO",
    N: "N", NORD: "N",
  };
  return map[o] ?? null;
}

export async function buildRapportProjetContext(
  projetId: string,
  varianteId: string | null,
): Promise<RapportContext | null> {
  const projet = await prisma.projet.findFirst({
    where: { id: projetId, deletedAt: null },
    select: {
      id: true,
      titre: true,
      description: true,
      typeTravaux: true,
      adresseChantier: true,
      categorieCible: true,
      consoFactureChauffage: true,
      nbPersonnesFoyer: true,
      rfrFoyer: true,
      zoneRevenuFoyer: true,
      client: { select: { nom: true, prenom: true } },
    },
  });
  if (!projet) return null;

  const isParticulier = projet.categorieCible === "PARTICULIER";
  // Foyer demandeur — uniquement pour cible particulier ; sinon MPR non applicable.
  const foyerProjet: FoyerDemandeur | null =
    isParticulier &&
    projet.nbPersonnesFoyer != null &&
    projet.rfrFoyer != null &&
    projet.zoneRevenuFoyer != null
      ? {
          nbPersonnes: projet.nbPersonnesFoyer,
          rfr: Number(projet.rfrFoyer),
          zone: projet.zoneRevenuFoyer,
        }
      : null;

  const baselineRes = await buildProjetBaseline(projetId);
  if (!baselineRes) return null;
  const { baseline, hasEnvelope, hasSystems } = baselineRes;

  // Variante (optionnelle) — applique les gestes à la baseline.
  let varianteNom: string | null = null;
  let gestes: Geste[] = [];
  // Priorité : foyer du projet (saisi en BDD) > foyer dans inputs variante (PARTICULIER seulement) > fallback démo si PARTICULIER, sinon undefined.
  let foyer: FoyerDemandeur | undefined = foyerProjet ?? (isParticulier ? FOYER_FALLBACK : undefined);
  if (varianteId) {
    const variante = await prisma.variante.findFirst({
      where: { id: varianteId, projetId, deletedAt: null },
      select: { nom: true, inputsJson: true },
    });
    if (variante) {
      varianteNom = variante.nom;
      try {
        const inputs = JSON.parse(variante.inputsJson) as {
          gestes?: { code: GesteCode; quantite: number; coutHT: number }[];
          foyer?: FoyerDemandeur;
        };
        gestes = (inputs.gestes ?? []).map((g) => ({
          code: g.code,
          quantite: g.quantite,
          coutHT: g.coutHT,
        }));
        // Le foyer du projet (BDD) prime ; on n'écrase qu'en l'absence
        // de saisie projet pour préserver une éventuelle saisie historique.
        if (!foyerProjet && isParticulier && inputs.foyer) foyer = inputs.foyer;
      } catch {
        /* JSON corrompu — ignore, traite comme variante vide */
      }
    }
  }

  const state: BaselineState = gestes.length > 0
    ? applyGestesToBaseline(baseline, gestes)
    : baseline;

  // Indicateurs canoniques — strictement alignés sur l'onglet /calcul.
  const indicators = hasEnvelope && hasSystems
    ? computeIndicatorsFromState(state, {
        tarifChauffage: TARIFS_ENERGIE_2025[state.chauffageVecteur],
        tarifECS: TARIFS_ENERGIE_2025[state.ecsVecteur],
      })
    : null;

  const surfaceTotale = state.surfaceHabitable;
  const volumeTotale = state.volumeChauffe;
  const besoinChauffageAnnuel = indicators
    ? indicators.besoinChauffage * surfaceTotale
    : 0;

  // Déperditions — pour le breakdown % par poste (mêmes inputs que computeIndicators).
  const hPTForfait = 0.05 * (state.surfaceMurs + state.surfaceToiture + state.surfacePlancher);
  const hPT = state.hPontsThermiquesSaisis ?? hPTForfait;
  const dep = calculerDeperditions({
    surfaceMurs: state.surfaceMurs,
    surfaceToiture: state.surfaceToiture,
    surfacePlancher: state.surfacePlancher,
    surfaceVitree: state.surfaceVitree,
    uMurs: state.uMurs,
    uToiture: state.uToiture,
    uPlancher: state.uPlancher,
    uVitree: state.uVitree,
    hPontsThermiques: hPT,
    volumeChauffe: state.volumeChauffe,
    renouvellementAir: state.renouvellementAir,
    efficaciteDoubleFlux: state.efficaciteDoubleFlux,
    deltaT: state.consigneInt - state.tBase,
  });

  // DPE détaillé par usage — reconstruit à partir des indicateurs canoniques.
  const chauffage_kwh = state.chauffageEff > 0 ? besoinChauffageAnnuel / state.chauffageEff : 0;
  const besoinECSAnnuel = indicators ? indicators.besoinECS * surfaceTotale : 0;
  const ecs_kwh = state.ecsEff > 0 ? besoinECSAnnuel / state.ecsEff : 0;
  const aux_kwh = surfaceTotale * 5;
  const ecl_kwh = surfaceTotale * 1.4;
  const refr_kwh = state.hasClim ? surfaceTotale * 12 : 0;
  const dpeRes = surfaceTotale > 0 && hasSystems
    ? calculerDpe(
        {
          chauffage_kwh,
          chauffage_vecteur: state.chauffageVecteur,
          ecs_kwh,
          ecs_vecteur: state.ecsVecteur,
          refroidissement_kwh: refr_kwh,
          eclairage_kwh: ecl_kwh,
          auxiliaires_kwh: aux_kwh,
        },
        surfaceTotale,
      )
    : null;

  // Re-fetch parois (orientations vitrages) + systèmes pour les sections PDF/Word.
  const [batiments, systemes] = await Promise.all([
    prisma.batiment.findMany({
      where: { projetId, deletedAt: null },
      select: {
        nom: true,
        zoneClimatique: true,
        zones: {
          select: {
            surface: true,
            parois: {
              select: {
                surface: true,
                orientation: true,
                paroi: { select: { type: true } },
              },
            },
          },
        },
      },
    }),
    prisma.systeme.findMany({
      where: { projetId, deletedAt: null },
      select: {
        type: true, vecteur: true, nom: true,
        rendement: true, partCouverture: true, cop: true,
      },
    }),
  ]);

  const vitresParOrient: Record<Orientation, number> = {
    S: 0, SE: 0, SO: 0, E: 0, O: 0, NE: 0, NO: 0, N: 0,
  };
  let zoneClim = "H1a — Nord";
  for (const b of batiments) {
    if (b.zoneClimatique) zoneClim = b.zoneClimatique;
    for (const z of b.zones) {
      for (const zp of z.parois) {
        if (zp.paroi.type === "VITRAGE") {
          const o = normalizeOrient(zp.orientation);
          if (o) vitresParOrient[o] += Number(zp.surface);
        }
      }
    }
  }
  const apportsRes = state.surfaceVitree > 0
    ? calculerApportsSolaires({
        surfacesParOrientation: vitresParOrient,
        facteurSolaireG: 0.5,
        facteurOmbre: 0.85,
        zone: parseZone(zoneClim),
      })
    : null;

  const isolation = state.uMurs > 0 && state.uMurs < 0.4
    ? "ITE"
    : state.uMurs < 0.8
      ? "ITI"
      : "Aucune";
  const hParoisOpaques =
    state.surfaceMurs * state.uMurs +
    state.surfaceToiture * state.uToiture +
    state.surfacePlancher * state.uPlancher;
  const hPontsForfait = estimerPontsForfaitaire(hParoisOpaques, isolation);

  const dateIso = new Date().toISOString().slice(0, 10);
  const varianteSlug = varianteNom
    ? `-${varianteNom.slice(0, 16).replace(/[^A-Za-z0-9]+/g, "_")}`
    : "";
  const reference = `KW-${projet.id.slice(-6).toUpperCase()}-${dateIso}${varianteSlug}`;

  // Plan de financement — uniquement si la variante porte des gestes chiffrés.
  let aides: RapportProjetData["aides"];
  if (gestes.length > 0) {
    const a = calculerAides(gestes, foyer);
    aides = {
      coutTravauxTTC: a.coutTravauxTTC,
      totalAides: a.totalAides,
      resteACharge: a.resteACharge,
      ecoPtzMax: a.ecoPtzMax,
      lignes: a.lignes
        .filter((l) => l.montant > 0)
        .map((l) => ({ libelle: l.libelle, montant: l.montant, base: l.base })),
    };
  }

  const data: RapportProjetData = {
    projet: {
      id: projet.id,
      titre: varianteNom ? `${projet.titre} — ${varianteNom}` : projet.titre,
      reference,
      description: projet.description,
      typeTravaux: projet.typeTravaux,
      adresseChantier: projet.adresseChantier,
      dateAudit: new Date().toISOString(),
      client: { nom: projet.client.nom, prenom: projet.client.prenom },
      categorieCible: projet.categorieCible,
    },
    surface: surfaceTotale,
    volume: volumeTotale,
    dpe: dpeRes
      ? {
          cep: dpeRes.cep_kwh_m2,
          ges: dpeRes.ges_kg_m2,
          classe_dpe: dpeRes.classe_dpe,
          classe_ges: dpeRes.classe_ges,
          classe_finale: dpeRes.classe_finale,
          detail: dpeRes.detail.map((d) => ({
            usage: d.usage,
            vecteur: d.vecteur,
            ef_kwh: d.ef_kwh,
            ep_kwh: d.ep_kwh,
            co2_kg: d.co2_kg,
          })),
        }
      : undefined,
    bilan: {
      gv: dep.hTotal,
      ubat: dep.ubatMoyen,
      pertesTBase: dep.pertesT_base,
      besoinChauffage: besoinChauffageAnnuel,
      pctMurs: dep.pctMurs,
      pctToiture: dep.pctToiture,
      pctPlancher: dep.pctPlancher,
      pctVitree: dep.pctVitree,
      pctPontsThermiques: dep.pctPontsThermiques,
      pctVentilation: dep.pctVentilation,
      pctInfiltrations: dep.pctInfiltrations,
      surfaceMurs: state.surfaceMurs,
      surfaceToiture: state.surfaceToiture,
      surfacePlancher: state.surfacePlancher,
      surfaceVitree: state.surfaceVitree,
      uMurs: state.uMurs,
      uToiture: state.uToiture,
      uPlancher: state.uPlancher,
      uVitree: state.uVitree,
    },
    batiments: batiments.map((b) => ({
      nom: b.nom,
      zoneClimatique: b.zoneClimatique,
      surface: b.zones.reduce((s, z) => s + Number(z.surface), 0),
      nbZones: b.zones.length,
      nbParois: b.zones.reduce((s, z) => s + z.parois.length, 0),
    })),
    systemes: systemes.map((s) => ({
      type: s.type,
      vecteur: s.vecteur,
      nom: s.nom,
      rendement: s.cop != null ? Number(s.cop) : Number(s.rendement),
      partCouverture: Number(s.partCouverture),
    })),
    apportsSolaires: apportsRes
      ? {
          apportAnnuel: apportsRes.apportAnnuel,
          apportSaisonChauffe: apportsRes.apportSaisonChauffe,
          apportSaisonChaude: apportsRes.apportSaisonChaude,
          detailParOrientation: Object.entries(apportsRes.detailParOrientation)
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([orientation, apport]) => ({ orientation, apport })),
          risqueSurchauffe: apportsRes.risqueSurchauffe,
          surfaceVitreeTotale: state.surfaceVitree,
        }
      : undefined,
    pontsThermiques: {
      isolation,
      hTotal: state.hPontsThermiquesSaisis ?? hPontsForfait,
      methode: state.hPontsThermiquesSaisis != null ? "DETAIL" : "FORFAIT",
    },
    calibration:
      projet.consoFactureChauffage != null && chauffage_kwh > 0
        ? (() => {
            const consoFacture = Number(projet.consoFactureChauffage);
            if (consoFacture <= 0) return undefined;
            const factor = consoFacture / chauffage_kwh;
            if (factor < 0.5 || factor > 2.0) return undefined;
            return { factor, consoFacture, consoCalculee: chauffage_kwh };
          })()
        : undefined,
    aides,
  };

  return { data, varianteNom, reference };
}
