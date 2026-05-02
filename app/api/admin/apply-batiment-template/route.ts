import { NextResponse } from "next/server";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";
import {
  applyBatimentTemplate,
  ApplyTemplateError,
} from "@/lib/api-helpers/template-apply";

/**
 * POST /api/admin/apply-batiment-template
 * Body : { templateId: string }
 * Crée matériaux + parois + bâtiment + zones + zone_parois nécessaires.
 * Réservé aux rôles MUTATION_ROLES (ADMIN, COLLABORATEUR).
 */
export async function POST(request: Request) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const templateId =
    body && typeof body === "object" && "templateId" in body
      ? String((body as { templateId: unknown }).templateId)
      : "";
  if (!templateId) {
    return NextResponse.json(
      { error: "ValidationError", message: "templateId requis" },
      { status: 422 },
    );
  }

  try {
    const result = await applyBatimentTemplate(templateId);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ApplyTemplateError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[apply-batiment-template] error:", err);
    return NextResponse.json({ error: "ServerError", message }, { status: 500 });
  }
}
