/**
 * Constructeur de données pour l'audit énergétique réglementaire.
 *
 * Base réglementaire (tertiaire) : arrêté du 30 avril 2022 relatif au
 * contenu de l'audit énergétique. Trois scénarios de travaux obligatoires :
 *   • Scénario 1 : gains 25-40 %
 *   • Scénario 2 : gains 40-60 %
 *   • Scénario 3 : rénovation performante > 60 % (BBC rénovation)
 *
 * Base résidentiel collectif : cahier des charges ADEME (arrêté 4 mai 2018)
 * pour audit énergétique bâtiment collectif d'habitation.
 *
 * Ce module assemble depuis un projet :
 *   • État actuel (baseline)
 *   • Variantes du projet OU 3 scénarios auto-générés
 *   • Indicateurs par scénario (Cep/Cef/GES/DPE, gain %, coût, aides, ROI)
 */

import { prisma } from "./db";
import { buildProjetBaseline } from "./calcul-projet";
import {
  applyGestesToBaseline,
  computeIndicatorsFromState,
  TARIFS_ENERGIE_2025,
  type BaselineState,
  type VarianteIndicators,
} from "./calcul-variante";
import { calculerAides, type Geste, type FoyerDemandeur } from "./aides";

export type CategorieAudit = "TERTIAIRE" | "RESIDENTIEL_COLLECTIF";

export interface ScenarioAudit {
  code: 1 | 2 | 3;
  titre: string;
  description: string;
  cible: string; // "25-40 %", "40-60 %", "> 60 %"
  gestes: Array<{ code: string; nom: string; quantite: number; coutHT: number }>;
  indicateurs: VarianteIndicators;
  gainCepPct: number;
  gainCefPct: number;
  gainGesPct: number;
  economieAnnuelleEuros: number;
  coutTotalHT: number;
  primeCeeEstimee: number;
  primeMprEstimee: number;
  autresAides: number;
  aideTotale: number;
  resteACharge: number;
  tempsRetourAns: number | null;
}

export interface AuditReglementaireData {
  reference: string;
  categorie: CategorieAudit;
  auteur: string;
  dateEmission: string; // ISO
  // Site
  siteNom: string;
  clientTitulaire: string;
  adresse: string;
  ville: string;
  codePostal: string;
  surfaceChauffee: number;
  zoneClimatique: string;
  anneeConstruction: number | null;
  // État actuel
  baseline: BaselineState;
  indicateursBaseline: VarianteIndicators;
  // 3 scénarios
  scenarios: ScenarioAudit[];
  // Métadonnées calcul
  cepBaselineKwhEpM2: number;
  gesBaselineKgCo2M2: number;
  dpeBaseline: string;
  gesClasseBaseline: string;
}

export type BuildAuditResult =
  | { ok: true; data: AuditReglementaireData }
  | { ok: false; status: number; error: string };

/** 3 scénarios par défaut si le projet n'a pas ≥ 3 variantes définies. */
const SCENARIOS_DEFAUT: Array<{
  titre: string;
  description: string;
  cible: string;
  gestes: Array<{ code: string; nom: string; quantite: number; coutHT: number }>;
}> = [
  {
    titre: "Scénario 1 — Gains 25 à 40 %",
    description: "Bouquet léger axé sur l'enveloppe et la régulation. Investissement modéré, ROI court.",
    cible: "25-40 %",
    gestes: [
      { code: "ISOLATION_COMBLES", nom: "Isolation combles perdus", quantite: 100, coutHT: 3500 },
      { code: "MENUISERIES", nom: "Remplacement menuiseries", quantite: 20, coutHT: 12000 },
    ],
  },
  {
    titre: "Scénario 2 — Gains 40 à 60 %",
    description: "Bouquet mixte enveloppe + production. Compromis performance / investissement.",
    cible: "40-60 %",
    gestes: [
      { code: "ISOLATION_MURS_ITE", nom: "Isolation thermique par l'extérieur", quantite: 180, coutHT: 32000 },
      { code: "ISOLATION_COMBLES", nom: "Isolation combles perdus", quantite: 100, coutHT: 3500 },
      { code: "PAC_AIR_EAU", nom: "PAC air/eau", quantite: 1, coutHT: 18000 },
    ],
  },
  {
    titre: "Scénario 3 — Rénovation performante (> 60 %)",
    description: "Bouquet BBC rénovation. Enveloppe complète + PAC + ventilation double flux.",
    cible: "> 60 %",
    gestes: [
      { code: "ISOLATION_MURS_ITE", nom: "Isolation thermique par l'extérieur", quantite: 180, coutHT: 32000 },
      { code: "ISOLATION_COMBLES", nom: "Isolation combles perdus", quantite: 100, coutHT: 3500 },
      { code: "ISOLATION_PLANCHER_BAS", nom: "Isolation plancher bas", quantite: 100, coutHT: 5500 },
      { code: "MENUISERIES", nom: "Remplacement menuiseries triple vitrage", quantite: 20, coutHT: 18000 },
      { code: "VMC_DOUBLE_FLUX", nom: "VMC double flux haut rendement", quantite: 1, coutHT: 8000 },
      { code: "PAC_GEOTHERMIQUE", nom: "PAC géothermique", quantite: 1, coutHT: 28000 },
    ],
  },
];

const FOYER_DEFAUT: FoyerDemandeur = {
  zone: "AUTRES",
  nbPersonnes: 4,
  rfr: 28000,
};

function pct(a: number, b: number): number {
  if (b === 0) return 0;
  return ((b - a) / b) * 100;
}

export async function buildAuditReglementaireData(
  projetId: string,
  categorie: CategorieAudit,
  auteur: string,
): Promise<BuildAuditResult> {
  const projet = await prisma.projet.findFirst({
    where: { id: projetId, deletedAt: null },
    include: { client: true },
  });
  if (!projet) return { ok: false, status: 404, error: "Projet introuvable" };

  const baselineRes = await buildProjetBaseline(projetId);
  if (!baselineRes?.baseline) {
    return {
      ok: false,
      status: 422,
      error:
        "Saisie projet incomplète : compléter Bâti (parois affectées aux zones) et Systèmes avant de générer l'audit",
    };
  }
  const baseline = baselineRes.baseline;
  const indicateursBaseline = computeIndicatorsFromState(baseline);

  // Lire les variantes existantes (si ≥ 3, on les utilise ; sinon fallback)
  const variantes = await prisma.variante.findMany({
    where: { projetId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  const scenariosSource: typeof SCENARIOS_DEFAUT =
    variantes.length >= 3
      ? variantes.slice(0, 3).map((v, idx) => {
          const inputs = (v.inputsJson ? JSON.parse(v.inputsJson) : {}) as {
            gestes?: Array<{ code: string; quantite: number; coutHT: number }>;
          };
          const gestes = (inputs.gestes ?? []).map((g) => ({
            code: g.code,
            nom: g.code,
            quantite: g.quantite,
            coutHT: g.coutHT,
          }));
          return {
            titre: v.nom || `Scénario ${idx + 1}`,
            description: v.description ?? "",
            cible: idx === 0 ? "25-40 %" : idx === 1 ? "40-60 %" : "> 60 %",
            gestes,
          };
        })
      : SCENARIOS_DEFAUT;

  const scenarios: ScenarioAudit[] = scenariosSource.map((sc, idx) => {
    const gestesForCalc: Geste[] = sc.gestes.map((g) => ({
      code: g.code as Geste["code"],
      quantite: g.quantite,
      coutHT: g.coutHT,
    }));

    const state = applyGestesToBaseline(baseline, gestesForCalc);
    const indicateurs = computeIndicatorsFromState(
      state,
      {
        tarifChauffage: TARIFS_ENERGIE_2025[baseline.chauffageVecteur],
        tarifECS: TARIFS_ENERGIE_2025[baseline.ecsVecteur],
      },
      indicateursBaseline.consoFinaleM2,
    );

    const aides = calculerAides(gestesForCalc, FOYER_DEFAUT);
    const coutTotalHT = sc.gestes.reduce((sum, g) => sum + g.coutHT, 0);
    const primeCee = Math.abs(
      aides.lignes
        .filter((l) => /CEE/i.test(l.libelle))
        .reduce((s, l) => s + l.montant, 0),
    );
    const primeMpr = Math.abs(
      aides.lignes
        .filter((l) => /MaPrimeR|MPR/i.test(l.libelle))
        .reduce((s, l) => s + l.montant, 0),
    );
    const autres = Math.abs(aides.totalAides) - primeCee - primeMpr;
    const aideTotale = Math.abs(aides.totalAides);
    const resteACharge = aides.resteACharge;
    const tempsRetour =
      indicateurs.economieAnnuelle > 0
        ? Math.round((resteACharge / indicateurs.economieAnnuelle) * 10) / 10
        : null;

    return {
      code: (idx + 1) as 1 | 2 | 3,
      titre: sc.titre,
      description: sc.description,
      cible: sc.cible,
      gestes: sc.gestes,
      indicateurs,
      gainCepPct: pct(indicateurs.cep, indicateursBaseline.cep),
      gainCefPct: pct(indicateurs.cef, indicateursBaseline.cef),
      gainGesPct: pct(indicateurs.ges, indicateursBaseline.ges),
      economieAnnuelleEuros: Math.round(indicateurs.economieAnnuelle),
      coutTotalHT,
      primeCeeEstimee: primeCee,
      primeMprEstimee: primeMpr,
      autresAides: autres,
      aideTotale,
      resteACharge,
      tempsRetourAns: tempsRetour,
    };
  });

  const data: AuditReglementaireData = {
    reference: `KW-AUDIT-${projet.id.slice(-8).toUpperCase()}`,
    categorie,
    auteur,
    dateEmission: new Date().toISOString(),
    siteNom: projet.titre,
    clientTitulaire:
      [projet.client?.nom, projet.client?.prenom].filter(Boolean).join(" ") || "—",
    adresse: projet.adresseChantier ?? "—",
    ville: projet.client?.ville ?? "—",
    codePostal: projet.client?.codePostal ?? "—",
    surfaceChauffee: baseline.surfaceHabitable,
    zoneClimatique: baseline.zoneClimatique ?? "—",
    anneeConstruction: null,
    baseline,
    indicateursBaseline,
    scenarios,
    cepBaselineKwhEpM2: indicateursBaseline.cep,
    gesBaselineKgCo2M2: indicateursBaseline.ges,
    dpeBaseline: indicateursBaseline.dpe,
    gesClasseBaseline: indicateursBaseline.ges_class,
  };

  return { ok: true, data };
}
