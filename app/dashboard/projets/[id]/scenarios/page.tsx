import Link from "next/link";
import ScenarioComparator, {
  Scenario,
} from "@/components/dashboard/ScenarioComparator";
import VarianteCreateDialog from "@/components/dashboard/VarianteCreateDialog";
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
  foyer: FoyerDemandeur,
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
    const newState = applyGestesToBaseline(baseline, gestes);
    const ind = computeIndicatorsFromState(
      newState,
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
      select: { nbPersonnesFoyer: true, rfrFoyer: true, zoneRevenuFoyer: true },
    }),
  ]);

  const foyerComplet =
    projetFoyer?.nbPersonnesFoyer != null &&
    projetFoyer?.rfrFoyer != null &&
    projetFoyer?.zoneRevenuFoyer != null;
  const foyer: FoyerDemandeur = foyerComplet
    ? {
        nbPersonnes: projetFoyer!.nbPersonnesFoyer!,
        rfr: Number(projetFoyer!.rfrFoyer!),
        zone: projetFoyer!.zoneRevenuFoyer!,
      }
    : FOYER_FALLBACK;

  const baseline = baselineRes?.baseline ?? null;
  const hasEnvelope = baselineRes?.hasEnvelope ?? false;
  const hasSystems = baselineRes?.hasSystems ?? false;
  const baselineIndicators = baseline && hasEnvelope && hasSystems
    ? computeIndicatorsFromState(baseline)
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
          · Foyer {foyer.nbPersonnes} pers., RFR {foyer.rfr.toLocaleString("fr-FR")} € ({foyer.zone === "IDF" ? "Île-de-France" : "Autres régions"})
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
      {!foyerComplet && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-[12px] text-amber-700 dark:text-amber-400">
          <strong>Foyer demandeur non renseigné</strong> — les montants MaPrimeRénov&apos; affichés
          utilisent un foyer démo ({FOYER_FALLBACK.nbPersonnes} personnes, RFR {FOYER_FALLBACK.rfr.toLocaleString("fr-FR")} €,
          hors IDF). Ouvre <em>Précision</em> dans l&apos;onglet Calcul pour saisir les vraies ressources.
        </div>
      )}
      <ScenarioComparator
        scenarios={SCENARIOS}
        surface={surface}
        actionSlot={<VarianteCreateDialog projetId={projetId} />}
      />
    </div>
  );
}
