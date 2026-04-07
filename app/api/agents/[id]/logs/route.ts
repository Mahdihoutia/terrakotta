import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/agents/:id/logs — Historique des actions */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const [logs, total] = await Promise.all([
      prisma.agentLog.findMany({
        where: { agentId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.agentLog.count({ where: { agentId: id } }),
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error("[API /api/agents/:id/logs GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
