import Link from "next/link";
import ScenarioComparator, {
  Scenario,
} from "@/components/dashboard/ScenarioComparator";
import VarianteCreateDialog from "@/components/dashboard/VarianteCreateDialog";
import VarianteManageList from "@/components/dashboard/VarianteManageList";
import MethodeInfo from "@/components/dashboard/MethodeInfo";
import { calculerAides, BAREMES_VERSION } from "@/lib/aides";
import type { Geste, FoyerDemandeur, GesteCode } from "@/lib/aides";
import { prisma } from "@/lib/db";
import { buildProjetBaseline } from "@/lib/calcul-projet";
import {
  applyGestesToBaseline,
  computeIndicatorsFromState,
  TARIFS_ENERGIE_2025,
  type BaselineState,
  type VarianteIndicators,
} from "@/lib/calcul-variante";
import {
  loadProjetZoneInputs,
  simulerZonesAgg,
  applyGestesToZoneInputs,
  type ZoneInputMeta,
} from "@/lib/calcul-projet-horaire";

/* Foyer fallback — utilisé tant que les ressources foyer ne sont pas
 * saisies sur le projet (Précision → onglet Foyer demandeur). Catégorie
 * JAUNE (modeste) en province : valeurs neutres, mais explicitement
 * signalées dans l'UI comme "à renseigner". */
const FOYER_FALLBACK: FoyerDemandeur = {
  zone: "AUTRES",
  nbPersonnes: 4,
  rfr: 28000,
};


function aidesLibelle(code: string): string {
  const map: Record<string, string> = {
    ISOLATION_MURS_ITE: "ITE murs extérieurs",
    ISOLATION_MURS_ITI: "ITI murs intérieurs",
    ISOLATION_COMBLES: "Isolation combles",
    ISOLATION_PLANCHER_BAS: "Isolation plancher bas",
    ISOLATION_TOITURE_TERRASSE: "Isolation toiture-terrasse",
    MENUISERIES: "Menuiseries",
    VMC_DOUBLE_FLUX: "VMC double flux",
    VMC_SIMPLE_FLUX: "VMC simple flux",
    PAC_AIR_EAU: "PAC air/eau",
    PAC_GEOTHERMIQUE: "PAC géothermique",
    PAC_AIR_AIR: "PAC air/air",
    CHAUDIERE_BIOMASSE: "Chaudière biomasse",
    POELE_GRANULES: "Poêle à granulés",
    POELE_BUCHES: "Poêle à bûches",
    CHAUFFE_EAU_THERMODYNAMIQUE: "Chauffe-eau thermodynamique",
    CHAUFFE_EAU_SOLAIRE: "Chauffe-eau solaire",
    DEPOSE_CUVE_FIOUL: "Dépose cuve fioul",
    AUDIT_ENERGETIQUE: "Audit énergétique",
  };
  return map[code] ?? code;
}

interface VarianteDb {
  id: string;
  nom: string;
  description: string | null;
  inputs: { gestes?: { code: string; quantite: number; coutHT: number }[] } | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Simule une variante DB en appliquant ses gestes sur la baseline du projet. */
function buildDbScenario(
  v: VarianteDb,
  baseline: BaselineState | null,
  baselineIndicators: VarianteIndicators | null,
  foyer: FoyerDemandeur | undefined,
  zoneInputs: ZoneInputMeta[],
): Scenario {
  const gestes: Geste[] = (v.inputs?.gestes ?? []).map((g) => ({
    code: g.code as GesteCode,
    quantite: g.quantite,
    coutHT: g.coutHT,
  }));

  const aides = calculerAides(gestes, foyer);

  // Si la baseline n'est pas calculable (saisie incomplète), retombe sur indicateurs neutres
  let indicateurs: Scenario["indicateurs"];
  let economieAnnuelle = 0;

  if (baseline && baselineIndicators) {
    // Gestes systèmes → état agrégé ; gestes d'enveloppe → simulation horaire par zone.
    const newState = applyGestesToBaseline(baseline, gestes);
    let overrideState = newState;
    if (zoneInputs.length > 0) {
      const simV = simulerZonesAgg(applyGestesToZoneInputs(zoneInputs, gestes));
      if (simV.surfaceTotale > 0) {
        overrideState = {
          ...newState,
          besoinChauffageOverrideKwh: simV.besoinChauffageKWh,
          besoinClimOverrideKwh: newState.hasClim ? simV.besoinClimKWh : 0,
        };
      }
    }
    const ind = computeIndicatorsFromState(
      overrideState,
      { tarifChauffage: TARIFS_ENERGIE_2025[baseline.chauffageVecteur], tarifECS: TARIFS_ENERGIE_2025[baseline.ecsVecteur] },
      baselineIndicators.consoFinaleM2,
    );
    indicateurs = {
      cep: Math.round(ind.cep),
      cef: Math.round(ind.cef),
      ges: Number(ind.ges.toFixed(1)),
      dpe: ind.dpe,
      ges_class: ind.ges_class,
      besoinChauffage: Math.round(ind.besoinChauffage),
      besoinECS: Math.round(ind.besoinECS),
      besoinClim: Math.round(ind.besoinClim),
    };
    economieAnnuelle = Math.round(ind.economieAnnuelle);
  } else {
    indicateurs = {
      cep: 0, cef: 0, ges: 0, dpe: "C", ges_class: "C",
      besoinChauffage: 0, besoinECS: 0, besoinClim: 0,
    };
  }

  const tri = economieAnnuelle > 0 ? Math.round(aides.resteACharge / economieAnnuelle) : 0;

  return {
    id: v.id,
    nom: v.nom,
    type: "VARIANTE",
    description: v.description ?? undefined,
    indicateurs,
    travaux: gestes.map((g) => ({
      poste: aidesLibelle(g.code),
      description: "",
      coutHT: g.coutHT,
    })),
    finances: {
      coutTravauxHT: aides.coutTravauxHT,
      aides: aides.lignes
        .filter((l) => l.montant > 0)
        .map((l) => ({ nom: l.libelle, montant: l.montant })),
      resteACharge: aides.resteACharge,
      economieAnnuelle,
      tri,
    },
  };
}

export default async function ScenariosTabPage({ params }: PageProps) {
  const { id: projetId } = await params;

  const [baselineRes, dbVariantes, projetFoyer] = await Promise.all([
    buildProjetBaseline(projetId),
    prisma.variante.findMany({
      where: { projetId, deletedAt: null, type: "VARIANTE" },
      orderBy: { createdAt: "asc" },
      select: { id: true, nom: true, description: true, inputsJson: true },
    }),
    prisma.projet.findFirst({
      where: { id: projetId, deletedAt: null },
      select: {
        categorieCible: true,
        nbPersonnesFoyer: true,
        rfrFoyer: true,
        zoneRevenuFoyer: true,
      },
    }),
  ]);

  const isParticulier = projetFoyer?.categorieCible === "PARTICULIER";
  const foyerComplet =
    isParticulier &&
    projetFoyer?.nbPersonnesFoyer != null &&
    projetFoyer?.rfrFoyer != null &&
    projetFoyer?.zoneRevenuFoyer != null;
  // Pour les cibles non-particulier, MPR n'est pas applicable : on passe foyer = undefined.
  const foyer: FoyerDemandeur | undefined = !isParticulier
    ? undefined
    : foyerComplet
      ? {
          nbPersonnes: projetFoyer!.nbPersonnesFoyer!,
          rfr: Number(projetFoyer!.rfrFoyer!),
          zone: projetFoyer!.zoneRevenuFoyer!,
        }
      : FOYER_FALLBACK;

  const baseline = baselineRes?.baseline ?? null;
  const hasEnvelope = baselineRes?.hasEnvelope ?? false;
  const hasSystems = baselineRes?.hasSystems ?? false;

  // Moteur horaire 8760 h : zones chargées une fois, baseline simulée, besoin
  // injecté dans computeIndicatorsFromState (même modèle de conso que Calcul).
  const zoneInputs =
    baseline && hasEnvelope && hasSystems
      ? await loadProjetZoneInputs(projetId)
      : [];
  const baselineSim = zoneInputs.length > 0 ? simulerZonesAgg(zoneInputs) : null;

  const baselineState: BaselineState | null =
    baseline && baselineSim && baselineSim.surfaceTotale > 0
      ? {
          ...baseline,
          besoinChauffageOverrideKwh: baselineSim.besoinChauffageKWh,
          besoinClimOverrideKwh: baseline.hasClim ? baselineSim.besoinClimKWh : 0,
        }
      : baseline;

  const baselineIndicators = baselineState && hasEnvelope && hasSystems
    ? computeIndicatorsFromState(baselineState)
    : null;

  // Si la saisie projet est incomplète, on n'invente pas de chiffres :
  // on affiche un empty state actionnable plutôt qu'un mock trompeur.
  if (!baseline || !baselineIndicators) {
    const missing: string[] = [];
    if (!hasEnvelope) missing.push("bâtiments + parois affectées aux zones");
    if (!hasSystems) missing.push("systèmes (chauffage, ECS)");
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="section-title-dense">Scénarios de rénovation</h1>
            <p className="text-[13px] text-tk-text-muted">
              L&apos;état existant est calculé depuis la saisie réelle du projet.
            </p>
          </div>
          <VarianteCreateDialog projetId={projetId} />
        </div>
        <div className="rounded-xl border border-dashed border-tk-border bg-tk-surface/40 p-10 text-center">
          <p className="text-[13px] font-medium text-tk-text">Saisie projet incomplète</p>
          <p className="mx-auto mt-1.5 max-w-md text-[12px] text-tk-text-muted leading-relaxed">
            Pour comparer des scénarios de rénovation, il faut d&apos;abord renseigner :{" "}
            <span className="text-tk-text">{missing.join(" et ")}</span>.
            Les indicateurs Cep / DPE / GES sont alors calculés depuis ta saisie réelle.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {!hasEnvelope && (
              <Link
                href={`/dashboard/projets/${projetId}/bati`}
                className="inline-flex items-center gap-1.5 rounded-md bg-tk-primary px-3 py-1.5 text-[12px] font-medium text-white hover:bg-tk-primary-hover"
              >
                Compléter Bâti →
              </Link>
            )}
            {!hasSystems && (
              <Link
                href={`/dashboard/projets/${projetId}/systemes`}
                className="inline-flex items-center gap-1.5 rounded-md border border-tk-border bg-tk-surface px-3 py-1.5 text-[12px] font-medium text-tk-text-secondary hover:border-tk-border-hover hover:text-tk-text"
              >
                Saisir Systèmes →
              </Link>
            )}
          </div>
          {dbVariantes.length > 0 && (
            <p className="mt-6 text-[11px] text-tk-text-faint">
              {dbVariantes.length} variante{dbVariantes.length > 1 ? "s" : ""} enregistrée{dbVariantes.length > 1 ? "s" : ""} en attente — elles seront chiffrées dès que la saisie est complète.
            </p>
          )}
        </div>
      </div>
    );
  }

  // À partir d'ici : baseline calculable, indicateurs réels.
  const scenarioInitial: Scenario = {
    id: "initial",
    nom: "État existant",
    type: "INITIAL",
    description: `Calculé depuis la saisie projet · ${Math.round(baseline.surfaceHabitable)} m² · zone ${baseline.zoneClimatique} · chauffage ${baseline.chauffageVecteur.replace(/_/g, " ")}`,
    indicateurs: {
      cep: Math.round(baselineIndicators.cep),
      cef: Math.round(baselineIndicators.cef),
      ges: Number(baselineIndicators.ges.toFixed(1)),
      dpe: baselineIndicators.dpe,
      ges_class: baselineIndicators.ges_class,
      besoinChauffage: Math.round(baselineIndicators.besoinChauffage),
      besoinECS: Math.round(baselineIndicators.besoinECS),
      besoinClim: Math.round(baselineIndicators.besoinClim),
    },
  };

  const dbScenarios: Scenario[] = dbVariantes.map((v) => {
    let inputs: VarianteDb["inputs"] = null;
    try { inputs = JSON.parse(v.inputsJson); } catch {}
    return buildDbScenario(
      { id: v.id, nom: v.nom, description: v.description, inputs },
      baseline,
      baselineIndicators,
      foyer,
      zoneInputs,
    );
  });

  const SCENARIOS: Scenario[] = [scenarioInitial, ...dbScenarios];
  const surface = Math.round(baseline.surfaceHabitable);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="section-title-dense">Scénarios de rénovation</h1>
        <p className="text-[13px] text-tk-text-muted">
          État existant calculé depuis la saisie projet · Aides calculées sur barèmes {BAREMES_VERSION}
          {foyer
            ? <> · Foyer {foyer.nbPersonnes} pers., RFR {foyer.rfr.toLocaleString("fr-FR")} € ({foyer.zone === "IDF" ? "Île-de-France" : "Autres régions"})</>
            : <> · Cible non-particulier — MaPrimeRénov&apos; non applicable</>}
          {dbVariantes.length > 0 && (
            <>
              {" "}· <span className="text-tk-primary">
                {dbVariantes.length} variante{dbVariantes.length > 1 ? "s" : ""} enregistrée{dbVariantes.length > 1 ? "s" : ""}
              </span>
            </>
          )}
          {dbVariantes.length === 0 && (
            <>
              {" "}· <span className="text-tk-text-faint">aucune variante — utilise « Ajouter une variante »</span>
            </>
          )}
        </p>
      </div>
      {isParticulier && !foyerComplet && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-[12px] text-amber-700 dark:text-amber-400">
          <strong>Foyer demandeur non renseigné</strong> — les montants MaPrimeRénov&apos; affichés
          utilisent un foyer démo ({FOYER_FALLBACK.nbPersonnes} personnes, RFR {FOYER_FALLBACK.rfr.toLocaleString("fr-FR")} €,
          hors IDF). Ouvre <em>Précision</em> dans l&apos;onglet Calcul pour saisir les vraies ressources.
        </div>
      )}
      <MethodeInfo
        precision="±10 % + barèmes officiels"
        methode="Chaque variante applique ses gestes de travaux à l'état existant, puis recalcule les indicateurs (Cep, Cef, GES, DPE) avec le même moteur 3CL-DPE que l'onglet Calcul. Les aides sont chiffrées sur les barèmes officiels en vigueur."
        points={[
          "Gain énergétique = écart entre indicateurs après travaux et état existant",
          "Isolation → U cible réglementaire ; PAC → SCOP saisonnier substitué au générateur",
          `Aides : CEE (forfait cumac × surface) + MaPrimeRénov' selon foyer — barèmes ${BAREMES_VERSION}`,
          "Économie annuelle = Δ conso × tarif énergie ; temps de retour = reste à charge ÷ économie",
        ]}
        calibrationHref={`/dashboard/projets/${projetId}/calibration`}
      />
      <VarianteManageList
        projetId={projetId}
        variantes={dbVariantes.map((v) => {
          let gestes: { code: string; quantite: string; coutHT: string }[] = [];
          try {
            const parsed = JSON.parse(v.inputsJson) as {
              gestes?: { code: string; quantite: number; coutHT: number }[];
            };
            gestes = (parsed.gestes ?? []).map((g) => ({
              code: g.code,
              quantite: String(g.quantite),
              coutHT: String(g.coutHT),
            }));
          } catch {}
          return { id: v.id, nom: v.nom, description: v.description, gestes };
        })}
      />
      <ScenarioComparator
        scenarios={SCENARIOS}
        surface={surface}
        actionSlot={<VarianteCreateDialog projetId={projetId} />}
      />
    </div>
  );
}
