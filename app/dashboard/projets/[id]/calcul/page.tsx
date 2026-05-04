import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calculator,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  calculerDeperditions,
  calculerBesoinsChauffage,
  getZoneData,
} from "@/lib/thermal";
import Metric from "@/components/dashboard/Metric";

type ParoiType = "MUR_EXT" | "MUR_INT" | "TOITURE" | "PLANCHER_BAS" | "PLANCHER_INTER" | "VITRAGE" | "PORTE";

interface Props {
  params: Promise<{ id: string }>;
}

interface AggregatedParois {
  surfaceMurs: number;
  surfaceToiture: number;
  surfacePlancher: number;
  surfaceVitree: number;
  uMurs: number;
  uToiture: number;
  uPlancher: number;
  uVitree: number;
  nbParois: number;
  parois: Array<{ nom: string; type: ParoiType; surface: number; u: number }>;
}

/** Agrège des zone_parois en surfaces + U moyens pondérés par catégorie. */
function aggregateParois(
  zoneParois: Array<{ surface: number | string | { toString(): string }; paroi: { nom: string; type: string; uCache: number | string | { toString(): string } | null } }>,
): AggregatedParois {
  const buckets = {
    murs:    { s: 0, ua: 0 },
    toiture: { s: 0, ua: 0 },
    plancher: { s: 0, ua: 0 },
    vitree:  { s: 0, ua: 0 },
  };
  const parois: AggregatedParois["parois"] = [];

  for (const zp of zoneParois) {
    const s = Number(zp.surface);
    const u = zp.paroi.uCache != null ? Number(zp.paroi.uCache) : 0;
    if (s <= 0 || u <= 0) continue;
    const t = zp.paroi.type as ParoiType;
    parois.push({ nom: zp.paroi.nom, type: t, surface: s, u });

    if (t === "MUR_EXT" || t === "PORTE") {
      buckets.murs.s += s;
      buckets.murs.ua += u * s;
    } else if (t === "TOITURE") {
      buckets.toiture.s += s;
      buckets.toiture.ua += u * s;
    } else if (t === "PLANCHER_BAS") {
      buckets.plancher.s += s;
      buckets.plancher.ua += u * s;
    } else if (t === "VITRAGE") {
      buckets.vitree.s += s;
      buckets.vitree.ua += u * s;
    }
    // MUR_INT, PLANCHER_INTER : non déperditifs vers extérieur, ignorés
  }

  const wU = (b: { s: number; ua: number }) => (b.s > 0 ? b.ua / b.s : 0);

  return {
    surfaceMurs: buckets.murs.s,
    surfaceToiture: buckets.toiture.s,
    surfacePlancher: buckets.plancher.s,
    surfaceVitree: buckets.vitree.s,
    uMurs: wU(buckets.murs),
    uToiture: wU(buckets.toiture),
    uPlancher: wU(buckets.plancher),
    uVitree: wU(buckets.vitree),
    nbParois: parois.length,
    parois,
  };
}

const TYPE_LABEL: Record<ParoiType, string> = {
  MUR_EXT: "Murs ext.",
  MUR_INT: "Murs int.",
  TOITURE: "Toiture",
  PLANCHER_BAS: "Plancher bas",
  PLANCHER_INTER: "Plancher inter.",
  VITRAGE: "Vitrage",
  PORTE: "Porte",
};

export default async function CalculTabPage({ params }: Props) {
  const { id } = await params;
  const projet = await prisma.projet.findUnique({
    where: { id },
    select: { id: true, titre: true },
  });
  if (!projet) notFound();

  const batiments = await prisma.batiment.findMany({
    where: { projetId: id, deletedAt: null },
    select: {
      id: true,
      nom: true,
      zoneClimatique: true,
      zones: {
        select: {
          id: true,
          nom: true,
          surface: true,
          hauteurSousPlafond: true,
          consigneChauffageOcc: true,
          qVmcM3hM2: true,
          efficaciteDoubleFlux: true,
          parois: {
            select: {
              surface: true,
              orientation: true,
              paroi: { select: { nom: true, type: true, uCache: true } },
            },
          },
        },
      },
    },
  });

  // Empty state
  if (batiments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="section-title-dense">Calcul thermique</h1>
          <p className="text-[13px] text-tk-text-muted">
            Aucun bâtiment encore créé pour ce projet — le calcul a besoin d&apos;une géométrie.
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-tk-border bg-tk-surface/40 p-10 text-center">
          <Calculator className="mx-auto h-7 w-7 text-tk-text-faint/60" />
          <p className="mt-3 text-[13px] font-medium text-tk-text">Pas de données à calculer</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-tk-text-muted">
            Crée d&apos;abord un bâtiment et ses zones depuis l&apos;onglet Bâti, puis affecte des
            parois aux zones via le module Bâtiments.
          </p>
          <Link
            href={`/dashboard/projets/${id}/bati`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-tk-primary px-3 py-1.5 text-[12px] font-medium text-white hover:bg-tk-primary-hover"
          >
            Aller à Bâti
          </Link>
        </div>
      </div>
    );
  }

  // Compute per building
  const calculs = batiments.map((b) => {
    // Aggregate all zone_parois across zones
    const allZP = b.zones.flatMap((z) => z.parois);
    const agg = aggregateParois(allZP);

    const surfaceHabitable = b.zones.reduce((s, z) => s + Number(z.surface), 0);
    const volumeChauffe = b.zones.reduce(
      (s, z) => s + Number(z.surface) * Number(z.hauteurSousPlafond),
      0,
    );

    // Q_v VMC moyenne pondérée par surface
    const qVmcM3h = b.zones.reduce(
      (s, z) => s + Number(z.qVmcM3hM2) * Number(z.surface),
      0,
    );
    const renouvellementAir =
      volumeChauffe > 0 ? qVmcM3h / volumeChauffe : 0.5; // vol/h fallback 0.5

    const efficaciteDF = b.zones.length > 0
      ? b.zones.reduce((s, z) => s + Number(z.efficaciteDoubleFlux), 0) / b.zones.length
      : 0;

    const consigneInt = b.zones.length > 0
      ? b.zones.reduce((s, z) => s + Number(z.consigneChauffageOcc), 0) / b.zones.length
      : 19;

    const zoneData = getZoneData(b.zoneClimatique);
    const tBase = zoneData?.tBase ?? -7;
    const dju = zoneData?.dju ?? 2500;
    const deltaT = consigneInt - tBase;

    const hasCalcData =
      agg.nbParois > 0 &&
      (agg.surfaceMurs + agg.surfaceToiture + agg.surfacePlancher + agg.surfaceVitree) > 0 &&
      surfaceHabitable > 0;

    if (!hasCalcData) {
      return {
        batiment: b,
        agg,
        surfaceHabitable,
        volumeChauffe,
        zoneData,
        complete: false,
      };
    }

    const dep = calculerDeperditions({
      surfaceMurs: agg.surfaceMurs,
      surfaceToiture: agg.surfaceToiture,
      surfacePlancher: agg.surfacePlancher,
      surfaceVitree: agg.surfaceVitree,
      uMurs: agg.uMurs,
      uToiture: agg.uToiture,
      uPlancher: agg.uPlancher,
      uVitree: agg.uVitree,
      hPontsThermiques: dep_ptForfait(agg.surfaceMurs + agg.surfaceToiture + agg.surfacePlancher),
      volumeChauffe,
      renouvellementAir,
      efficaciteDoubleFlux: efficaciteDF,
      deltaT,
    });

    const besoins = calculerBesoinsChauffage({
      zone: b.zoneClimatique,
      surfaceHabitable,
      volumeChauffe,
      ubat: dep.ubatMoyen,
      surfaceDeperditiveTotale: dep.surfaceDeperditiveTotale,
      renouvellementAir,
      apportsSolairesGratuits: 0, // sans saisie spécifique
      apportsInternes: 5 * surfaceHabitable, // ~5 kWh/m²·an forfait
      rendementInstallation: 0.85,
    });

    return {
      batiment: b,
      agg,
      surfaceHabitable,
      volumeChauffe,
      zoneData,
      tBase,
      dju,
      deltaT,
      consigneInt,
      renouvellementAir,
      efficaciteDF,
      dep,
      besoins,
      complete: true,
    };
  });

  // Totaux projet
  const totalCompletes = calculs.filter((c) => c.complete);
  const totalSurface = calculs.reduce((s, c) => s + c.surfaceHabitable, 0);
  const totalH = totalCompletes.reduce((s, c) => s + (c.dep?.hTotal ?? 0), 0);
  const totalBesoinBrut = totalCompletes.reduce((s, c) => s + (c.besoins?.besoinBrut ?? 0), 0);
  const totalConsoFinale = totalCompletes.reduce((s, c) => s + (c.besoins?.consoFinale ?? 0), 0);
  const totalPertesTBase = totalCompletes.reduce((s, c) => s + (c.dep?.pertesT_base ?? 0), 0);
  const consoFinaleM2 = totalSurface > 0 ? totalConsoFinale / totalSurface : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="section-title-dense">Calcul thermique</h1>
          <p className="text-[13px] text-tk-text-muted">
            Méthode 3CL-DPE simplifiée · {batiments.length} bâtiment{batiments.length > 1 ? "s" : ""}
            {totalCompletes.length < batiments.length && (
              <> · <span className="text-amber-500">{batiments.length - totalCompletes.length} incomplet{batiments.length - totalCompletes.length > 1 ? "s" : ""}</span></>
            )}
          </p>
        </div>
      </div>

      {/* KPIs projet */}
      {totalCompletes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            label="GV total"
            value={totalH}
            unit="W/K"
            decimals={0}
            hint="Coefficient de déperdition"
          />
          <KpiCard
            label="Pertes T_base"
            value={totalPertesTBase / 1000}
            unit="kW"
            decimals={1}
            hint="Puissance déperdition à T° base"
          />
          <KpiCard
            label="Besoin brut"
            value={totalBesoinBrut}
            unit="kWh/an"
            decimals={0}
            hint="Avant rendement installation"
          />
          <KpiCard
            label="Conso finale"
            value={consoFinaleM2}
            unit="kWh/m²·an"
            decimals={0}
            hint={`Total ${(totalConsoFinale).toFixed(0)} kWh/an · η 0.85`}
            tone={consoFinaleM2 < 100 ? "pos" : consoFinaleM2 < 200 ? "default" : "neg"}
          />
        </div>
      )}

      {/* Détail par bâtiment */}
      {calculs.map((c) => (
        <section key={c.batiment.id} className="overflow-hidden rounded-lg border border-tk-border bg-tk-surface">
          <header className="flex items-center justify-between gap-3 border-b border-tk-border bg-tk-bg/40 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-tk-text-faint" />
                <h2 className="truncate text-[14px] font-semibold text-tk-text">{c.batiment.nom}</h2>
                <span className="rounded border border-tk-border bg-tk-bg/40 px-1.5 py-0.5 text-[10px] font-mono text-tk-text-muted">
                  {c.batiment.zoneClimatique}
                </span>
                {c.zoneData && (
                  <span className="text-[11px] text-tk-text-faint">
                    DJU {c.zoneData.dju} · T_base {c.zoneData.tBase}°C
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-tk-text-faint">
                <span className="font-mono tabular-nums">{c.surfaceHabitable.toFixed(0)} m²</span>
                <span className="text-tk-border">·</span>
                <span className="font-mono tabular-nums">{c.volumeChauffe.toFixed(0)} m³</span>
                <span className="text-tk-border">·</span>
                <span>{c.batiment.zones.length} zone{c.batiment.zones.length > 1 ? "s" : ""}</span>
                <span className="text-tk-border">·</span>
                <span>{c.agg.nbParois} parois</span>
              </div>
            </div>
            <Link
              href={`/dashboard/batiments/${c.batiment.id}`}
              aria-label="Ouvrir le bâtiment"
              className="inline-flex h-7 w-7 items-center justify-center rounded text-tk-text-faint hover:bg-tk-hover hover:text-tk-text"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </header>

          {!c.complete ? (
            <div className="px-4 py-6 text-center">
              <AlertTriangle className="mx-auto h-5 w-5 text-amber-500" />
              <p className="mt-2 text-[12px] font-medium text-tk-text">Calcul indisponible</p>
              <p className="mx-auto mt-1 max-w-md text-[11px] text-tk-text-muted">
                Pour calculer, ce bâtiment a besoin d&apos;au moins une paroi avec U calculé,
                affectée à une zone via le module Bâtiments.
              </p>
              <Link
                href={`/dashboard/batiments/${c.batiment.id}`}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-tk-primary hover:underline"
              >
                Compléter la saisie →
              </Link>
            </div>
          ) : (
            <>
              {/* Métriques bâtiment */}
              <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4">
                <Field label="U_bat moyen">
                  <Metric value={c.dep!.ubatMoyen} unit="W/m²·K" size="sm" decimals={2} />
                </Field>
                <Field label="GV bâtiment">
                  <Metric value={c.dep!.hTotal} unit="W/K" size="sm" decimals={0} />
                </Field>
                <Field label="Pertes T_base">
                  <Metric value={c.dep!.pertesT_base / 1000} unit="kW" size="sm" decimals={1} />
                </Field>
                <Field label="Besoin chauffage">
                  <Metric value={c.besoins!.besoinNet / c.surfaceHabitable} unit="kWh/m²·an" size="sm" decimals={0} />
                </Field>
              </div>

              {/* Répartition des déperditions */}
              <div className="border-t border-tk-border px-4 py-4">
                <p className="field-label-tiny mb-3">Répartition des déperditions</p>
                <div className="space-y-1.5">
                  <DepBar label="Murs ext." pct={c.dep!.pctMurs} h={c.dep!.hMurs} />
                  <DepBar label="Toiture" pct={c.dep!.pctToiture} h={c.dep!.hToiture} />
                  <DepBar label="Plancher bas" pct={c.dep!.pctPlancher} h={c.dep!.hPlancher} />
                  <DepBar label="Vitrages" pct={c.dep!.pctVitree} h={c.dep!.hVitree} />
                  <DepBar label="Ponts thermiques" pct={c.dep!.pctPontsThermiques} h={c.dep!.hPontsThermiques} />
                  <DepBar label="Ventilation (VMC)" pct={c.dep!.pctVentilation} h={c.dep!.hVentilation} />
                  <DepBar label="Infiltrations" pct={c.dep!.pctInfiltrations} h={c.dep!.hInfiltrations} />
                </div>
              </div>

              {/* Tableau parois agrégées */}
              <div className="border-t border-tk-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Catégorie</th>
                      <th className="num">Surface</th>
                      <th className="num">U moyen pondéré</th>
                      <th className="num">H = U·A</th>
                      <th className="num">% total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <Row cat="Murs extérieurs" s={c.agg.surfaceMurs} u={c.agg.uMurs} h={c.dep!.hMurs} pct={c.dep!.pctMurs} />
                    <Row cat="Toiture" s={c.agg.surfaceToiture} u={c.agg.uToiture} h={c.dep!.hToiture} pct={c.dep!.pctToiture} />
                    <Row cat="Plancher bas" s={c.agg.surfacePlancher} u={c.agg.uPlancher} h={c.dep!.hPlancher} pct={c.dep!.pctPlancher} />
                    <Row cat="Vitrages" s={c.agg.surfaceVitree} u={c.agg.uVitree} h={c.dep!.hVitree} pct={c.dep!.pctVitree} />
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      ))}

      <div className="rounded-md border border-tk-border bg-tk-bg/40 px-4 py-3 text-[11px] leading-relaxed text-tk-text-muted">
        <CheckCircle2 className="mr-1.5 inline-block h-3 w-3 text-emerald-500" />
        Méthode 3CL-DPE simplifiée — déperditions Th-BCE, besoin chauffage DJU, η 0,85 par défaut.
        Pour un calcul Cep complet, il faut compléter la saisie systèmes (chauffage, ECS, ventilation,
        éclairage) — non encore branchée.
      </div>
    </div>
  );
}

/** Forfait ponts thermiques RT-existant : ψ=0.5 W/K/m × Σ périmètres ≈ 0.05 × A_paroi opaque */
function dep_ptForfait(surfaceOpaqueTotale: number): number {
  return 0.05 * surfaceOpaqueTotale;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="field-label-tiny">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  decimals,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  unit: string;
  decimals?: number;
  hint?: string;
  tone?: "default" | "pos" | "neg";
}) {
  return (
    <div className="rounded-lg border border-tk-border bg-tk-surface p-3">
      <p className="field-label-tiny">{label}</p>
      <div className="mt-1.5">
        <Metric value={value} unit={unit} size="md" decimals={decimals} tone={tone} />
      </div>
      {hint && <p className="mt-1.5 text-[10.5px] text-tk-text-faint">{hint}</p>}
    </div>
  );
}

function DepBar({ label, pct, h }: { label: string; pct: number; h: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-0.5">
        <span className="text-tk-text-muted">{label}</span>
        <span className="font-mono tabular-nums text-tk-text">
          {h.toFixed(0)} <span className="text-tk-text-faint">W/K · {pct.toFixed(0)}%</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-tk-hover">
        <div
          className={cn("h-full rounded-full", pct > 30 ? "bg-red-500/70" : pct > 15 ? "bg-amber-500/70" : "bg-tk-primary")}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function Row({ cat, s, u, h, pct }: { cat: string; s: number; u: number; h: number; pct: number }) {
  if (s <= 0) return null;
  return (
    <tr>
      <td className="text-tk-text">{cat}</td>
      <td className="num font-mono">{s.toFixed(1)} m²</td>
      <td className="num font-mono">{u.toFixed(2)}</td>
      <td className="num font-mono">{h.toFixed(0)} W/K</td>
      <td className="num font-mono text-tk-text-muted">{pct.toFixed(0)} %</td>
    </tr>
  );
}
