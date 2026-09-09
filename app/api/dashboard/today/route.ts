import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/dashboard/today
 *
 * Agrège les 4 listes du widget "À faire aujourd'hui" :
 *  - jalons en retard / imminents (fallback : prochains jalons ouverts)
 *  - devis envoyés à relancer (> 7 jours sans update)
 *  - événements du jour (fallback : prochains événements à venir)
 *  - leads NOUVEAU créés < 14 jours (fallback : derniers NOUVEAU)
 *
 * Chaque liste expose `mode` :
 *   - "imminent" : le filtre strict (fenêtre courte) a retourné au moins 1 item
 *   - "upcoming" : la fenêtre stricte était vide, on retourne les prochains
 *                  éléments à venir / les plus récents pour rester utile.
 */
type ListMode = "imminent" | "upcoming";

export async function GET() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const endOfTomorrow = new Date(startOfToday);
  endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
  endOfTomorrow.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const TAKE = 5;

  try {
    // ── 1. Jalons : imminents (≤ J+1) puis fallback "prochains ouverts" ──
    let jalonsMode: ListMode = "imminent";
    let jalonsRaw = await prisma.jalon.findMany({
      where: {
        fait: false,
        echeance: { lte: endOfTomorrow },
        projet: { deletedAt: null },
      },
      include: { projet: { select: { id: true, titre: true } } },
      orderBy: { echeance: "asc" },
      take: TAKE,
    });
    if (jalonsRaw.length === 0) {
      jalonsMode = "upcoming";
      jalonsRaw = await prisma.jalon.findMany({
        where: {
          fait: false,
          echeance: { gt: endOfTomorrow },
          projet: { deletedAt: null },
        },
        include: { projet: { select: { id: true, titre: true } } },
        orderBy: { echeance: "asc" },
        take: TAKE,
      });
    }
    const jalons = jalonsRaw.map((j) => ({
      id: j.id,
      titre: j.titre,
      echeance: j.echeance.toISOString(),
      projet: { id: j.projet.id, titre: j.projet.titre },
    }));

    // ── 2. Devis à relancer (pas de fallback : > 7 j est déjà large) ──
    const devisRaw = await prisma.devis.findMany({
      where: {
        deletedAt: null,
        statut: "ENVOYE",
        updatedAt: { lt: sevenDaysAgo },
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true, email: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: TAKE,
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

    // ── 3. RDV : aujourd'hui, puis fallback "prochains à venir" ──
    let evenementsMode: ListMode = "imminent";
    let evenementsRaw = await prisma.evenement.findMany({
      where: {
        deletedAt: null,
        date: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        client: { select: { id: true, nom: true, prenom: true } },
        lead: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { heureDebut: "asc" },
      take: TAKE,
    });
    if (evenementsRaw.length === 0) {
      evenementsMode = "upcoming";
      evenementsRaw = await prisma.evenement.findMany({
        where: {
          deletedAt: null,
          date: { gt: endOfToday },
        },
        include: {
          client: { select: { id: true, nom: true, prenom: true } },
          lead: { select: { id: true, nom: true, prenom: true } },
        },
        orderBy: [{ date: "asc" }, { heureDebut: "asc" }],
        take: TAKE,
      });
    }

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

    // ── 4. Leads NOUVEAU < 14j, puis fallback "derniers NOUVEAU" ──
    let leadsMode: ListMode = "imminent";
    let leadsRaw = await prisma.lead.findMany({
      where: {
        deletedAt: null,
        statut: "NOUVEAU",
        dateCreation: { gt: fourteenDaysAgo },
      },
      orderBy: [{ score: "desc" }, { dateCreation: "asc" }],
      take: TAKE,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        score: true,
        dateCreation: true,
      },
    });
    if (leadsRaw.length === 0) {
      leadsMode = "upcoming";
      leadsRaw = await prisma.lead.findMany({
        where: {
          deletedAt: null,
          statut: "NOUVEAU",
        },
        orderBy: [{ dateCreation: "desc" }, { score: "desc" }],
        take: TAKE,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          score: true,
          dateCreation: true,
        },
      });
    }

    const leads = leadsRaw.map((l) => ({
      id: l.id,
      nom: l.nom,
      prenom: l.prenom,
      email: l.email,
      score: l.score ?? 0,
      dateCreation: l.dateCreation.toISOString(),
    }));

    return NextResponse.json({
      jalons,
      jalonsMode,
      devis,
      evenements,
      evenementsMode,
      leads,
      leadsMode,
    });
  } catch {
    return NextResponse.json({
      jalons: [],
      jalonsMode: "imminent" as ListMode,
      devis: [],
      evenements: [],
      evenementsMode: "imminent" as ListMode,
      leads: [],
      leadsMode: "imminent" as ListMode,
    });
  }
}
