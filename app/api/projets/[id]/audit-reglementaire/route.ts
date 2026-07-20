import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import { buildAuditReglementaireData } from "@/lib/audit-reglementaire-data";
import { generateAuditReglementairePdf } from "@/lib/pdf-audit-reglementaire";
import { generateAuditReglementaireDocx } from "@/lib/word-audit-reglementaire";

const bodySchema = z.object({
  categorie: z.enum(["TERTIAIRE", "RESIDENTIEL_COLLECTIF"]).default("TERTIAIRE"),
  format: z.enum(["pdf", "word"]).default("pdf"),
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
    const result = await buildAuditReglementaireData(id, p.categorie, p.auteur);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (p.format === "pdf") {
      const bytes = generateAuditReglementairePdf(result.data);
      return new Response(bytes as unknown as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="audit-reglementaire-${result.data.reference}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }
    const bytes = await generateAuditReglementaireDocx(result.data);
    return new Response(bytes as unknown as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="audit-reglementaire-${result.data.reference}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur génération audit";
    console.error("[/api/projets/:id/audit-reglementaire POST] error:", err);
    return NextResponse.json({ error: "AuditError", message }, { status: 500 });
  }
}
