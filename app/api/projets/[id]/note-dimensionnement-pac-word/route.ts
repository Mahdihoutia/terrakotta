import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import { generateNoteDimensionnementPacDocx } from "@/lib/word-note-dimensionnement-pac";
import { buildNotePacData } from "@/lib/note-pac-data";

const scenarioSchema = z.object({
  nom: z.string().min(1),
  regime: z.enum(["BT", "MT", "HT"]),
  unites: z.array(z.number().positive()).min(1).max(5),
  typeAppoint: z.enum(["GAZ", "ELEC", "AUCUN"]),
  tBivalenceForcee: z.number().nullable().default(null),
  rendementGaz: z.number().positive().max(1.2).default(0.925),
});

const bodySchema = z.object({
  calibrationId: z.string().nullable().optional(),
  categorie: z.enum(["TERTIAIRE", "RESIDENTIEL_COLLECTIF"]).default("TERTIAIRE"),
  scenarioRetenu: scenarioSchema,
  autresScenarios: z.array(scenarioSchema).default([]),
  marges: z
    .object({
      relance: z.number().min(0).max(0.5),
      distribution: z.number().min(0).max(0.3),
    })
    .optional(),
  site: z
    .object({
      generateurExistantMarque: z.string(),
      generateurExistantModele: z.string(),
      generateurExistantNb: z.number().int().min(1).max(10),
      generateurExistantPuissanceKw: z.number().positive(),
      generateurExistantVecteur: z.enum([
        "GAZ_NATUREL",
        "FIOUL",
        "PROPANE",
        "ELEC",
        "BOIS",
        "RESEAU_CHALEUR",
      ]),
      surfaceChauffee: z.number().positive(),
      zoneClimatique: z.string(),
      usage: z.string(),
      fournisseurEnergie: z.string().default("—"),
      compteurRef: z.string().default("—"),
    })
    .optional(),
  cee: z
    .object({
      forfaitKwhcParM2: z.number().nonnegative(),
      facteurCorrectifSecteur: z.number().min(0).max(2).default(0.8),
      facteurR: z.number().min(0).max(1).default(1),
      bonificationCoupDePouce: z.number().default(1),
      primeEurMWhc: z.number().nonnegative().default(6.9),
      dateLimiteEngagement: z.string().default("31 décembre 2030"),
      dureeVieAnnees: z.number().int().default(22),
    })
    .nullable()
    .optional(),
  auteur: z.string().default("Bureau d'étude Kilowater"),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, ctx: Ctx) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const p = parsed.data;

  try {
    const result = await buildNotePacData({
      projetId: id,
      calibrationId: p.calibrationId,
      categorie: p.categorie,
      scenarioRetenu: p.scenarioRetenu,
      autresScenarios: p.autresScenarios,
      marges: p.marges,
      site: p.site,
      cee: p.cee,
      auteur: p.auteur,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const docxBytes = await generateNoteDimensionnementPacDocx(result.data);
    const filename = `note-dimensionnement-pac-${result.data.reference}.docx`;
    return new Response(docxBytes as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur génération Word";
    console.error("[/api/projets/:id/note-dimensionnement-pac-word POST] error:", err);
    return NextResponse.json({ error: "WordError", message }, { status: 500 });
  }
}
