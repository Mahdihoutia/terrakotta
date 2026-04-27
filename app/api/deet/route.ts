import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/deet — Liste les audits soumis au Décret Tertiaire (DEET).
 *
 * Filtre les Documents de type AUDIT, soft-delete exclus, dont le champ
 * `donnees.deet_applicable === "Oui — surface > 1000 m²"`.
 *
 * Pour chaque audit, calcule la trajectoire DEET :
 * - baseline (année + valeur kWh/m²·an)
 * - objectifs 2030/2040/2050 en valeur absolue
 * - statut (alignée / en écart / en avance) sur la trajectoire linéaire
 * - prochaine échéance OPERAT (1ᵉʳ septembre de l'année courante ou suivante)
 */

export interface DeetSummary {
  id: string;
  titre: string;
  reference: string;
  clientNom: string | null;
  surfaceHabitable: number | null;
  zone: string | null;
  baseline: { annee: number; kwh_m2: number } | null;
  objectifs: { 2030: number; 2040: number; 2050: number } | null;
  projection: number | null;
  consoActuelle: number | null;
  statut: "EN_ECART" | "ALIGNE" | "EN_AVANCE" | "INDETERMINE";
  nextDeclaration: string;
  updatedAt: string;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Calcule la valeur attendue à l'année courante sur une trajectoire linéaire
 * baseline → 2030, et compare à la conso actuelle.
 */
function deetStatut(
  consoActuelle: number,
  baselineKwh: number,
  baselineAnnee: number,
  target2030: number,
): "EN_ECART" | "ALIGNE" | "EN_AVANCE" {
  const anneeCourante = new Date().getFullYear();
  const denom = 2030 - baselineAnnee;
  if (denom <= 0) {
    // Si l'année courante dépasse déjà 2030, on compare à l'objectif final.
    if (consoActuelle <= target2030 * 0.95) return "EN_AVANCE";
    if (consoActuelle >= target2030 * 1.05) return "EN_ECART";
    return "ALIGNE";
  }
  const progression = Math.max(0, Math.min(1, (anneeCourante - baselineAnnee) / denom));
  const valeurAttendue = baselineKwh - (baselineKwh - target2030) * progression;
  if (valeurAttendue <= 0) return "ALIGNE";
  const ecart = (consoActuelle - valeurAttendue) / valeurAttendue;
  if (ecart < -0.05) return "EN_AVANCE";
  if (ecart > 0.05) return "EN_ECART";
  return "ALIGNE";
}

function nextOperatDeclaration(): string {
  const today = new Date();
  const year = today.getFullYear();
  const sept = new Date(year, 8, 30); // 30 septembre
  if (today <= sept) return `30 septembre ${year}`;
  return `30 septembre ${year + 1}`;
}

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      where: { deletedAt: null, type: "AUDIT" },
      orderBy: { updatedAt: "desc" },
    });

    const summaries: DeetSummary[] = [];
    for (const doc of documents) {
      if (!doc.donnees) continue;
      let parsed: Record<string, unknown>;
      try {
        const raw = JSON.parse(doc.donnees) as unknown;
        if (raw === null || typeof raw !== "object") continue;
        parsed = raw as Record<string, unknown>;
      } catch {
        continue;
      }

      const applicable = typeof parsed.deet_applicable === "string" ? parsed.deet_applicable : "";
      if (!applicable.toLowerCase().startsWith("oui")) continue;

      const baselineKwh = num(parsed.deet_baseline_kwh);
      const baselineAnnee = num(parsed.deet_baseline_annee) ?? 2019;
      const target2030Pct = num(parsed.deet_target_2030);
      const target2040Pct = num(parsed.deet_target_2040);
      const target2050Pct = num(parsed.deet_target_2050);
      const projection = num(parsed.deet_projection);
      const consoActuelle = num(parsed.conso_par_m2);
      const surface = num(parsed.surface_habitable);
      const zone = typeof parsed.zone_climatique === "string" ? parsed.zone_climatique : null;

      let baseline: DeetSummary["baseline"] = null;
      let objectifs: DeetSummary["objectifs"] = null;
      let statut: DeetSummary["statut"] = "INDETERMINE";

      if (baselineKwh !== null && baselineKwh > 0) {
        baseline = { annee: baselineAnnee, kwh_m2: baselineKwh };
        const t2030 = target2030Pct !== null ? baselineKwh * (1 - target2030Pct / 100) : baselineKwh * 0.6;
        const t2040 = target2040Pct !== null ? baselineKwh * (1 - target2040Pct / 100) : baselineKwh * 0.5;
        const t2050 = target2050Pct !== null ? baselineKwh * (1 - target2050Pct / 100) : baselineKwh * 0.4;
        objectifs = { 2030: t2030, 2040: t2040, 2050: t2050 };
        if (consoActuelle !== null && consoActuelle > 0) {
          statut = deetStatut(consoActuelle, baselineKwh, baselineAnnee, t2030);
        }
      }

      summaries.push({
        id: doc.id,
        titre: doc.titre,
        reference: doc.reference,
        clientNom: doc.clientNom,
        surfaceHabitable: surface,
        zone,
        baseline,
        objectifs,
        projection,
        consoActuelle,
        statut,
        nextDeclaration: nextOperatDeclaration(),
        updatedAt: doc.updatedAt.toISOString(),
      });
    }

    return NextResponse.json(summaries);
  } catch (err) {
    console.error("[GET /api/deet]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
