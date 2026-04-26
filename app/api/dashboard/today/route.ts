import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/dashboard/today
 * Agrège les 4 listes du widget "À faire aujourd'hui" :
 *  - jalons en retard ou imminents
 *  - devis envoyés à relancer (> 7 jours sans update)
 *  - événements du jour
 *  - leads NOUVEAU créés < 14 jours
 */
export async function GET() {
  const now = new Date();

  // Bornes du jour courant
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // J+1 fin de journée
  const endOfTomorrow = new Date(startOfToday);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
  endOfTomorrow.setHours(23, 59, 59, 999);

  // Seuils
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  try {
    // ── 1. Jalons en retard ou imminents ─────────────────────────
    const jalonsRaw = await prisma.jalon.findMany({
      where: {
        fait: false,
        echeance: { lte: endOfTomorrow },
        projet: { deletedAt: null },
      },
      include: {
        projet: {
          select: { id: true, titre: true },
        },
      },
      orderBy: { echeance: "asc" },
      take: 5,
    });

    const jalons = jalonsRaw.map((j) => ({
      id: j.id,
      titre: j.titre,
      echeance: j.echeance.toISOString(),
      projet: { id: j.projet.id, titre: j.projet.titre },
    }));

    // ── 2. Devis à relancer ──────────────────────────────────────
    const devisRaw = await prisma.devis.findMany({
      where: {
        deletedAt: null,
        statut: "ENVOYE",
        updatedAt: { lt: sevenDaysAgo },
      },
      include: {
        client: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
      orderBy: { updatedAt: "asc" },
      take: 5,
    });

    const devis = devisRaw.map((d) => {
      const montantHT = Number(d.montantHT);
      const tauxTVA = Number(d.tauxTVA);
      const montantTTC = Math.round(montantHT * (1 + tauxTVA / 100) * 100) / 100;
      return {
        id: d.id,
        numero: d.numero,
        objet: d.objet,
        montantTTC,
        updatedAt: d.updatedAt.toISOString(),
        client: d.client,
      };
    });

    // ── 3. RDV du jour ───────────────────────────────────────────
    const evenementsRaw = await prisma.evenement.findMany({
      where: {
        deletedAt: null,
        date: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true } },
        lead: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { heureDebut: "asc" },
      take: 5,
    });

    const evenements = evenementsRaw.map((e) => ({
      id: e.id,
      titre: e.titre,
      date: e.date.toISOString(),
      heureDebut: e.heureDebut,
      heureFin: e.heureFin,
      type: e.type,
      lieu: e.lieu,
      client: e.client,
      lead: e.lead,
    }));

    // ── 4. Leads à rappeler ──────────────────────────────────────
    const leadsRaw = await prisma.lead.findMany({
      where: {
        deletedAt: null,
        statut: "NOUVEAU",
        dateCreation: { gt: fourteenDaysAgo },
      },
      orderBy: [{ score: "desc" }, { dateCreation: "asc" }],
      take: 5,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        score: true,
        dateCreation: true,
      },
    });

    const leads = leadsRaw.map((l) => ({
      id: l.id,
      nom: l.nom,
      prenom: l.prenom,
      email: l.email,
      score: l.score ?? 0,
      dateCreation: l.dateCreation.toISOString(),
    }));

    return NextResponse.json({ jalons, devis, evenements, leads });
  } catch {
    return NextResponse.json({
      jalons: [],
      devis: [],
      evenements: [],
      leads: [],
    });
  }
}
