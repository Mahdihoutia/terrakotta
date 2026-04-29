import { NextResponse } from "next/server";
import { calculerBilanBatiment, isMigrationPendingError } from "@/lib/api-helpers/batiment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const bilan = await calculerBilanBatiment(id);
    if (!bilan) {
      return NextResponse.json({ error: "Bâtiment introuvable" }, { status: 404 });
    }
    return NextResponse.json(bilan);
  } catch (err) {
    if (isMigrationPendingError(err)) {
      return NextResponse.json(
        { error: "MigrationPending", message: "Migration zoning manquante." },
        { status: 503 },
      );
    }
    const message = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: "ServerError", message }, { status: 500 });
  }
}
