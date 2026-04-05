import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createAideSchema = z.object({
  projetId: z.string().min(1, "Le projet est requis"),
  type: z.enum(["MAPRIMERENOVATION", "CEE", "ECO_PTZ", "AIDE_LOCALE", "COUP_DE_POUCE", "AUTRE"]),
  nom: z.string().min(1, "Le nom de l'aide est requis"),
  montant: z.number().nullable().optional(),
  numeroDossier: z.string().nullable().optional(),
  statut: z.enum(["EN_ATTENTE", "DEPOSE", "EN_INSTRUCTION", "ACCORDE", "REFUSE", "VERSE"]).optional(),
  dateDepot: z.string().nullable().optional(),
  dateAccord: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function serializeAide(a: {
  id: string;
  projetId: string;
  type: string;
  nom: string;
  montant: unknown;
  numeroDossier: string | null;
  statut: string;
  dateDepot: Date | null;
  dateAccord: Date | null;
  notes: string | null;
  createdAt: Date;
  projet: {
    id: string;
    titre: string;
    client: { id: string; nom: string; prenom: string | null };
  };
}) {
  return {
    id: a.id,
    projetId: a.projetId,
    type: a.type,
    nom: a.nom,
    montant: a.montant ? Number(a.montant) : null,
    numeroDossier: a.numeroDossier,
    statut: a.statut,
    dateDepot: a.dateDepot?.toISOString() ?? null,
    dateAccord: a.dateAccord?.toISOString() ?? null,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    projet: {
      id: a.projet.id,
      titre: a.projet.titre,
      client: a.projet.client,
    },
  };
}

// ─── GET /api/aides ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projetId = searchParams.get("projetId");
    const statut = searchParams.get("statut");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (projetId) where.projetId = projetId;
    if (statut) where.statut = statut;
    if (type) where.type = type;

    const aides = await prisma.aide.findMany({
      where,
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
            client: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(aides.map(serializeAide));
  } catch (err) {
    console.error("[GET /api/aides]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/aides ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createAideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    // Verify projet exists
    const projet = await prisma.projet.findUnique({ where: { id: data.projetId } });
    if (!projet) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const aide = await prisma.aide.create({
      data: {
        projetId: data.projetId,
        type: data.type,
        nom: data.nom,
        montant: data.montant ?? null,
        numeroDossier: data.numeroDossier ?? null,
        statut: data.statut ?? "EN_ATTENTE",
        dateDepot: data.dateDepot ? new Date(data.dateDepot) : null,
        dateAccord: data.dateAccord ? new Date(data.dateAccord) : null,
        notes: data.notes ?? null,
      },
      include: {
        projet: {
          select: {
            id: true,
            titre: true,
            client: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
    });

    return NextResponse.json(serializeAide(aide), { status: 201 });
  } catch (err) {
    console.error("[POST /api/aides]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
