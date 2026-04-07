import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/agents/:id — Détail d'un agent avec logs récents */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const agent = await prisma.aIAgent.findUnique({
      where: { id },
      include: {
        _count: { select: { logs: true } },
        logs: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent non trouvé" }, { status: 404 });
    }

    const successCount = await prisma.agentLog.count({
      where: { agentId: id, succes: true },
    });

    return NextResponse.json({
      ...agent,
      tauxReussite: agent._count.logs > 0
        ? Math.round((successCount / agent._count.logs) * 100)
        : 0,
    });
  } catch (error) {
    console.error("[API /api/agents/:id GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const updateSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().optional(),
  statut: z.enum(["ACTIF", "EN_PAUSE", "ERREUR", "INACTIF"]).optional(),
  email: z.string().email().optional().nullable(),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

/** PATCH /api/agents/:id — Mettre à jour un agent */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const updateData: Prisma.AIAgentUpdateInput = {
      ...data,
      configuration: data.configuration
        ? (data.configuration as Prisma.InputJsonValue)
        : undefined,
    };

    const agent = await prisma.aIAgent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(agent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation", details: error.issues }, { status: 400 });
    }
    console.error("[API /api/agents/:id PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** DELETE /api/agents/:id */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await prisma.aIAgent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /api/agents/:id DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
