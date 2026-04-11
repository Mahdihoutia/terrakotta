import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST /api/agents/:id/execute — Exécuter une action manuelle de l'agent */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const agent = await prisma.aIAgent.findUnique({ where: { id } });

    if (!agent) {
      return NextResponse.json({ error: "Agent non trouvé" }, { status: 404 });
    }

    if (agent.statut !== "ACTIF") {
      return NextResponse.json(
        { error: "L'agent doit être actif pour être exécuté" },
        { status: 400 },
      );
    }

    const config = agent.configuration as Record<string, unknown>;

    if (agent.type === "PROSPECTION") {
      return await executeProspection(id, config);
    }

    if (agent.type === "COMMUNICATION") {
      return await executeCommunication(id, config);
    }

    return NextResponse.json({ error: "Type d'agent inconnu" }, { status: 400 });
  } catch (error) {
    console.error("[API /api/agents/:id/execute POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function executeProspection(agentId: string, config: Record<string, unknown>) {
  const sources = (config.sources as string[]) || ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING", "SIRENE", "BODACC", "DPE_ADEME", "BOAMP", "PERMIS_CONSTRUIRE"];
  const maxLeads = (config.maxLeadsParJour as number) || 20;
  const regions = (config.regions as string[]) || [];

  // Log le début de la recherche
  const searchLog = await prisma.agentLog.create({
    data: {
      agentId,
      action: "search_started",
      details: { sources, regions, maxLeads },
      succes: true,
    },
  });

  // Call the real prospection API internally
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/prospection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sources: sources.filter((s: string) =>
          ["PAGES_JAUNES", "SOCIETE_COM", "WEB_SCRAPING", "SIRENE", "BODACC", "DPE_ADEME", "BOAMP", "PERMIS_CONSTRUIRE"].includes(s),
        ),
        departements: regions.length > 0 ? regions : undefined,
        maxResults: maxLeads,
        surfaceMin: (config.surfaceMin as number) || 1000,
      }),
    });

    const data = await res.json();

    // Log each created lead
    if (data.leads) {
      for (const lead of data.leads as Array<{ id: string; nom: string; source: string }>) {
        await prisma.agentLog.create({
          data: {
            agentId,
            action: "lead_created",
            details: { leadId: lead.id, nom: lead.nom, source: lead.source },
            succes: true,
          },
        });
      }
    }

    // Update the search log with results
    await prisma.agentLog.update({
      where: { id: searchLog.id },
      data: {
        details: {
          sources,
          regions,
          resultsFound: data.found ?? 0,
          leadsCreated: data.saved ?? 0,
          duplicates: data.duplicates ?? 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Prospection terminée : ${data.saved ?? 0} leads créés (${data.duplicates ?? 0} doublons)`,
      leadsCreated: data.saved ?? 0,
      searchSources: sources,
    });
  } catch (error) {
    await prisma.agentLog.update({
      where: { id: searchLog.id },
      data: {
        succes: false,
        details: {
          sources,
          error: error instanceof Error ? error.message : "Unknown",
        },
      },
    });

    return NextResponse.json({
      success: false,
      message: "Erreur lors de la prospection",
      error: error instanceof Error ? error.message : "Unknown",
    }, { status: 500 });
  }
}

async function executeCommunication(agentId: string, config: Record<string, unknown>) {
  const emailFrom = (config.emailFrom as string) || "agent@kilowater.fr";
  const maxEmails = (config.maxEmailsParJour as number) || 50;
  const relanceJours = (config.relanceApresJours as number) || 3;

  // Trouver les leads à contacter
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - relanceJours);

  const leadsToContact = await prisma.lead.findMany({
    where: {
      statut: { in: ["NOUVEAU", "CONTACTE"] },
      dateMiseAJour: { lte: cutoffDate },
    },
    take: maxEmails,
    orderBy: { dateCreation: "asc" },
  });

  const results = {
    emailsSent: 0,
    emailsFailed: 0,
    leadsContacted: [] as string[],
  };

  for (const lead of leadsToContact) {
    try {
      // Simulation d'envoi email
      // En production: appeler Resend/SendGrid avec le template approprié
      const emailResult = {
        to: lead.email,
        from: emailFrom,
        subject: `Kilowater — Votre projet de rénovation énergétique`,
        status: "sent" as const,
      };

      // Mettre à jour le statut du lead
      if (lead.statut === "NOUVEAU") {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { statut: "CONTACTE" },
        });
      }

      await prisma.agentLog.create({
        data: {
          agentId,
          action: "email_sent",
          details: {
            leadId: lead.id,
            leadNom: lead.nom,
            to: emailResult.to,
            subject: emailResult.subject,
          },
          succes: true,
        },
      });

      results.emailsSent++;
      results.leadsContacted.push(lead.id);
    } catch (error) {
      await prisma.agentLog.create({
        data: {
          agentId,
          action: "email_failed",
          details: {
            leadId: lead.id,
            error: error instanceof Error ? error.message : "Unknown",
          },
          succes: false,
        },
      });
      results.emailsFailed++;
    }
  }

  // Log rapport global
  await prisma.agentLog.create({
    data: {
      agentId,
      action: "communication_report",
      details: {
        totalLeadsProcessed: leadsToContact.length,
        emailsSent: results.emailsSent,
        emailsFailed: results.emailsFailed,
        emailFrom,
      },
      succes: results.emailsFailed === 0,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Communication terminée : ${results.emailsSent} emails envoyés`,
    ...results,
  });
}

