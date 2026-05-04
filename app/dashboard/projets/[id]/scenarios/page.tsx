import ScenarioComparator, {
  Scenario,
} from "@/components/dashboard/ScenarioComparator";
import VarianteCreateDialog from "@/components/dashboard/VarianteCreateDialog";
import { calculerAides, BAREMES_VERSION } from "@/lib/aides";
import type { Geste, FoyerDemandeur, GesteCode } from "@/lib/aides";
import { prisma } from "@/lib/db";

/* Foyer démo — catégorie JAUNE (modeste) en province. */
const FOYER_DEMO: FoyerDemandeur = {
  zone: "AUTRES",
  nbPersonnes: 4,
  rfr: 28000,
};

const SURFACE = 142;

interface VarianteDemo {
  id: string;
  nom: string;
  description: string;
  indicateurs: Scenario["indicateurs"];
  gestes: Geste[];
  economieAnnuelle: number;
}

const VARIANTES: VarianteDemo[] = [
  {
    id: "var-1",
    nom: "Bouquet 1 — Enveloppe",
    description: "ITE laine de bois 16 cm, isolation combles 30 cm, menuiseries triple vitrage.",
    indicateurs: {
      cep: 178, cef: 124, ges: 38, dpe: "C", ges_class: "C",
      besoinChauffage: 82, besoinECS: 38, besoinClim: 0,
    },
    gestes: [
      { code: "ISOLATION_MURS_ITE", quantite: 145, coutHT: 28500 },
      { code: "ISOLATION_COMBLES", quantite: 90, coutHT: 4200 },
      { code: "MENUISERIES", quantite: 12, coutHT: 14800 },
    ],
    economieAnnuelle: 2840,
  },
  {
    id: "var-2",
    nom: "Bouquet 2 — Global",
    description: "Variante 1 + PAC air/eau + VMC double flux + dépose cuve fioul.",
    indicateurs: {
      cep: 68, cef: 52, ges: 9, dpe: "A", ges_class: "A",
      besoinChauffage: 78, besoinECS: 32, besoinClim: 0,
    },
    gestes: [
      { code: "ISOLATION_MURS_ITE", quantite: 145, coutHT: 28500 },
      { code: "ISOLATION_COMBLES", quantite: 90, coutHT: 4200 },
      { code: "MENUISERIES", quantite: 12, coutHT: 14800 },
      { code: "PAC_AIR_EAU", quantite: 1, coutHT: 14200 },
      { code: "VMC_DOUBLE_FLUX", quantite: 1, coutHT: 5800 },
      { code: "DEPOSE_CUVE_FIOUL", quantite: 1, coutHT: 1500 },
    ],
    economieAnnuelle: 4280,
  },
];

function buildScenario(v: VarianteDemo): Scenario {
  const aides = calculerAides(v.gestes, FOYER_DEMO);
  return {
    id: v.id,
    nom: v.nom,
    type: "VARIANTE",
    description: v.description,
    indicateurs: v.indicateurs,
    travaux: v.gestes.map((g) => ({
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
      economieAnnuelle: v.economieAnnuelle,
      tri: v.economieAnnuelle > 0 ? Math.round(aides.resteACharge / v.economieAnnuelle) : 0,
    },
  };
}

function aidesLibelle(code: string): string {
  const map: Record<string, string> = {
    ISOLATION_MURS_ITE: "ITE murs extérieurs",
    ISOLATION_COMBLES: "Isolation combles",
    MENUISERIES: "Menuiseries triple vitrage",
    PAC_AIR_EAU: "PAC air/eau",
    VMC_DOUBLE_FLUX: "VMC double flux",
    DEPOSE_CUVE_FIOUL: "Dépose cuve fioul",
  };
  return map[code] ?? code;
}

const SCENARIO_INITIAL: Scenario = {
  id: "initial",
  nom: "Avant travaux",
  type: "INITIAL",
  description: "Maison individuelle 1978, isolation murs 5 cm, simple vitrage, chaudière fioul.",
  indicateurs: {
    cep: 412, cef: 287, ges: 88, dpe: "F", ges_class: "F",
    besoinChauffage: 220, besoinECS: 38, besoinClim: 0,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface VarianteDb {
  id: string;
  nom: string;
  description: string | null;
  inputs: { gestes?: { code: string; quantite: number; coutHT: number }[] } | null;
}

function buildDbScenario(v: VarianteDb): Scenario {
  const gestes: Geste[] = (v.inputs?.gestes ?? []).map((g) => ({
    code: g.code as GesteCode,
    quantite: g.quantite,
    coutHT: g.coutHT,
  }));
  const aides = calculerAides(gestes, FOYER_DEMO);
  return {
    id: v.id,
    nom: v.nom,
    type: "VARIANTE",
    description: v.description ?? undefined,
    // Indicateurs énergétiques non encore calculés depuis les vraies inputs : valeurs neutres
    indicateurs: {
      cep: 0, cef: 0, ges: 0, dpe: "C", ges_class: "C",
      besoinChauffage: 0, besoinECS: 0, besoinClim: 0,
    },
    travaux: gestes.map((g) => ({ poste: g.code, description: "", coutHT: g.coutHT })),
    finances: {
      coutTravauxHT: aides.coutTravauxHT,
      aides: aides.lignes
        .filter((l) => l.montant > 0)
        .map((l) => ({ nom: l.libelle, montant: l.montant })),
      resteACharge: aides.resteACharge,
      economieAnnuelle: 0,
      tri: 0,
    },
  };
}

export default async function ScenariosTabPage({ params }: PageProps) {
  const { id: projetId } = await params;

  const dbVariantes = await prisma.variante.findMany({
    where: { projetId, deletedAt: null, type: "VARIANTE" },
    orderBy: { createdAt: "asc" },
    select: { id: true, nom: true, description: true, inputsJson: true },
  });

  const dbScenarios: Scenario[] = dbVariantes.map((v) => {
    let inputs: VarianteDb["inputs"] = null;
    try { inputs = JSON.parse(v.inputsJson); } catch {}
    return buildDbScenario({ id: v.id, nom: v.nom, description: v.description, inputs });
  });

  const SCENARIOS: Scenario[] = [
    SCENARIO_INITIAL,
    ...VARIANTES.map(buildScenario),
    ...dbScenarios,
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="section-title-dense">Scénarios de rénovation</h1>
        <p className="text-[13px] text-tk-text-muted">
          Comparaison de l&apos;état initial avec les variantes chiffrées · Aides calculées sur barèmes {BAREMES_VERSION}
          · Foyer {FOYER_DEMO.nbPersonnes} pers., RFR {FOYER_DEMO.rfr.toLocaleString("fr-FR")} €
          {dbVariantes.length > 0 && <> · <span className="text-tk-primary">{dbVariantes.length} variante{dbVariantes.length > 1 ? "s" : ""} enregistrée{dbVariantes.length > 1 ? "s" : ""}</span></>}
        </p>
      </div>
      <ScenarioComparator
        scenarios={SCENARIOS}
        surface={SURFACE}
        actionSlot={<VarianteCreateDialog projetId={projetId} />}
      />
    </div>
  );
}
