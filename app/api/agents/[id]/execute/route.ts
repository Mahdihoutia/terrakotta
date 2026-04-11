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
  const sources = (config.sources as string[]) || [];
  const keywords = (config.keywords as string[]) || [];
  const regions = (config.regions as string[]) || [];
  const maxLeads = (config.maxLeadsParJour as number) || 20;

  // Log le début de la recherche
  const searchLog = await prisma.agentLog.create({
    data: {
      agentId,
      action: "search_started",
      details: { sources, keywords, regions, maxLeads },
      succes: true,
    },
  });

  // Simulation de résultats de prospection
  // En production, ceci appellerait des APIs de scraping, Google, LinkedIn, etc.
  const mockResults = generateMockProspects(keywords, regions, Math.min(maxLeads, 5));

  const createdLeads = [];
  for (const prospect of mockResults) {
    try {
      const lead = await prisma.lead.create({
        data: {
          nom: prospect.nom,
          prenom: prospect.prenom,
          email: prospect.email,
          telephone: prospect.telephone,
          raisonSociale: prospect.raisonSociale,
          type: prospect.type as "PARTICULIER" | "PROFESSIONNEL" | "COLLECTIVITE",
          source: "DEMARCHAGE",
          statut: "NOUVEAU",
          notes: `[Agent Prospection] Source: ${prospect.source} | ${prospect.notes}`,
        },
      });
      createdLeads.push(lead);

      await prisma.agentLog.create({
        data: {
          agentId,
          action: "lead_created",
          details: { leadId: lead.id, nom: lead.nom, source: prospect.source },
          succes: true,
        },
      });
    } catch (error) {
      await prisma.agentLog.create({
        data: {
          agentId,
          action: "lead_creation_failed",
          details: { prospect: prospect.nom, error: error instanceof Error ? error.message : "Unknown" },
          succes: false,
        },
      });
    }
  }

  // Log de fin
  await prisma.agentLog.update({
    where: { id: searchLog.id },
    data: {
      details: {
        sources,
        keywords,
        regions,
        resultsFound: mockResults.length,
        leadsCreated: createdLeads.length,
      },
    },
  });

  return NextResponse.json({
    success: true,
    message: `Prospection terminée : ${createdLeads.length} leads créés`,
    leadsCreated: createdLeads.length,
    searchSources: sources,
  });
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

// ─── Mock data pour la prospection (remplacer par de vrais appels API) ───

function generateMockProspects(
  keywords: string[],
  regions: string[],
  count: number,
) {
  const sources = ["annuaire-entreprises.fr", "LinkedIn", "permis-construire.gouv", "Google Maps", "Pages Jaunes"];
  const types = ["PARTICULIER", "PROFESSIONNEL", "COLLECTIVITE"];
  const noms = ["Dupont", "Martin", "Bernard", "Petit", "Robert", "Richard", "Durand", "Moreau", "Laurent", "Simon"];
  const prenoms = ["Jean", "Marie", "Pierre", "Sophie", "Thomas", "Julie", "Nicolas", "Emma", "Lucas", "Léa"];
  const region = regions[0] || "Île-de-France";

  return Array.from({ length: count }, (_, i) => ({
    nom: noms[i % noms.length],
    prenom: prenoms[i % prenoms.length],
    email: `${prenoms[i % prenoms.length].toLowerCase()}.${noms[i % noms.length].toLowerCase()}@email.fr`,
    telephone: `06 ${String(Math.floor(Math.random() * 100)).padStart(2, "0")} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")} ${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`,
    raisonSociale: i % 3 === 1 ? `Entreprise ${noms[i % noms.length]}` : undefined,
    type: types[i % types.length],
    source: sources[i % sources.length],
    notes: `Trouvé via ${sources[i % sources.length]} · Mots-clés: ${keywords.slice(0, 2).join(", ")} · Région: ${region}`,
  }));
}
