import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ leads: [], clients: [], evenements: [] });
    }

    const search = `%${q}%`;

    const [leads, clients, evenements] = await Promise.all([
      prisma.lead.findMany({
        where: {
          OR: [
            { nom: { contains: q, mode: "insensitive" } },
            { prenom: { contains: q, mode: "insensitive" } },
            { raisonSociale: { contains: q, mode: "insensitive" } },
            { telephone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { dateMiseAJour: "desc" },
        select: {
          id: true,
          nom: true,
          prenom: true,
          raisonSociale: true,
          telephone: true,
          email: true,
          type: true,
          statut: true,
        },
      }),
      prisma.client.findMany({
        where: {
          OR: [
            { nom: { contains: q, mode: "insensitive" } },
            { prenom: { contains: q, mode: "insensitive" } },
            { raisonSociale: { contains: q, mode: "insensitive" } },
            { telephone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          nom: true,
          prenom: true,
          raisonSociale: true,
          telephone: true,
          email: true,
          type: true,
        },
      }),
      prisma.evenement.findMany({
        where: {
          OR: [
            { titre: { contains: q, mode: "insensitive" } },
            { lieu: { contains: q, mode: "insensitive" } },
            { commentaire: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { date: "desc" },
        include: {
          client: { select: { id: true, nom: true, prenom: true } },
          lead: { select: { id: true, nom: true, prenom: true } },
        },
      }),
    ]);

    return NextResponse.json({ leads, clients, evenements });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
