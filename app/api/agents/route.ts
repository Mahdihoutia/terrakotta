import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

/** GET /api/agents — Liste tous les agents */
export async function GET() {
  try {
    const agents = await prisma.aIAgent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { logs: true } },
        logs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const serialized = await Promise.all(
      agents.map(async (agent) => {
        const [totalLogs, successLogs, todayLogs] = await Promise.all([
          prisma.agentLog.count({ where: { agentId: agent.id } }),
          prisma.agentLog.count({ where: { agentId: agent.id, succes: true } }),
          prisma.agentLog.count({ where: { agentId: agent.id, createdAt: { gte: today } } }),
        ]);

        return {
          ...agent,
          logs: undefined,
          derniereExecution: agent.logs[0]?.createdAt?.toISOString() ?? null,
          tauxReussite: totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0,
          actionsAujourdhui: todayLogs,
        };
      }),
    );

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("[API /api/agents GET]", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

const createAgentSchema = z.object({
  nom: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["PROSPECTION", "COMMUNICATION"]),
  email: z.string().email().optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

/** POST /api/agents — Créer un agent */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createAgentSchema.parse(body);

    const agent = await prisma.aIAgent.create({
      data: {
        nom: data.nom,
        description: data.description,
        type: data.type,
        email: data.email,
        configuration: (data.configuration ?? getDefaultConfig(data.type)) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation", details: error.issues }, { status: 400 });
    }
    console.error("[API /api/agents POST]", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    );
  }
}

function getDefaultConfig(type: "PROSPECTION" | "COMMUNICATION") {
  if (type === "PROSPECTION") {
    return {
      sources: ["web", "annuaires", "reseaux_sociaux"],
      keywords: ["rénovation énergétique", "audit énergétique", "isolation", "pompe à chaleur"],
      regions: ["Île-de-France"],
      autoCreateLead: true,
      maxLeadsParJour: 20,
    };
  }
  return {
    emailFrom: "agent@kilowater.fr",
    templates: [],
    relanceApresJours: 3,
    maxEmailsParJour: 50,
  };
}
