/**
 * POST /api/projets/[id]/duplicate
 *
 * Duplique un projet et l'intégralité de sa saisie technique :
 *   - Projet (statut réinitialisé EN_ATTENTE, titre suffixé "(copie)")
 *   - Bâtiments + zones + parois affectées (ZoneParoi) + ponts thermiques
 *   - Systèmes énergétiques
 *   - Variantes (gestes + scénarios sauvegardés)
 *
 * NE duplique pas :
 *   - Devis / factures / aides allouées (objets commerciaux liés à un dossier réel)
 *   - Calculs (snapshots historiques)
 *   - Jalons (planning spécifique)
 *   - Documents (fichiers — refs externes)
 *   - Événements / audit trail
 *
 * Cas d'usage : reprendre un projet type ("maison T4 années 70 fioul")
 * comme point de départ d'un nouveau dossier.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ensureRole, MUTATION_ROLES } from "@/lib/auth-helpers";

const bodySchema = z
  .object({
    titre: z.string().min(1).max(200).optional(),
    clientId: z.string().min(1).optional(),
  })
  .default({});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, ctx: RouteContext) {
  const guard = await ensureRole(MUTATION_ROLES);
  if (guard) return guard;

  const { id } = await ctx.params;

  let body: unknown = {};
  try {
    if (req.headers.get("content-length")) body = await req.json();
  } catch {
    /* corps optionnel */
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const source = await prisma.projet.findFirst({
    where: { id, deletedAt: null },
    include: {
      batiments: {
        where: { deletedAt: null },
        include: {
          zones: {
            where: { deletedAt: null },
            include: {
              parois: { select: { paroiId: true, surface: true, orientation: true, inclinaison: true, cotePaire: true } },
            },
          },
          pontsThermiques: {
            where: { deletedAt: null },
            select: { typo: true, isolation: true, longueur: true, psiOverride: true, notes: true },
          },
        },
      },
      systemes: {
        where: { deletedAt: null },
        select: {
          type: true, vecteur: true, nom: true, rendement: true,
          partCouverture: true, cop: true, puissanceKwc: true,
          tauxAutoconso: true, notes: true,
        },
      },
      variantes: {
        where: { deletedAt: null },
        select: { type: true, nom: true, description: true, inputsJson: true },
      },
    },
  });

  if (!source) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  // Vérifie le client cible si fourni — sinon on garde celui du projet source.
  const targetClientId = parsed.data.clientId ?? source.clientId;
  if (parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: parsed.data.clientId, deletedAt: null },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json({ error: "Client cible introuvable" }, { status: 400 });
    }
  }

  const newTitre = parsed.data.titre?.trim() || `${source.titre} (copie)`;

  try {
    const created = await prisma.projet.create({
      data: {
        titre: newTitre,
        description: source.description,
        statut: "EN_ATTENTE",
        typeClient: source.typeClient,
        typeTravaux: source.typeTravaux,
        adresseChantier: source.adresseChantier,
        budgetPrevu: source.budgetPrevu,
        // budgetDepense, dateDebut, dateFin volontairement reset
        clientId: targetClientId,
        // Précision thermique — copiée intégralement (paramétrage du bâti).
        nbOccupants: source.nbOccupants,
        inertie: source.inertie,
        intermittenceChauffage: source.intermittenceChauffage,
        permeabiliteAir: source.permeabiliteAir,
        // Calibration facture — NON copiée (spécifique au dossier réel).
        // Foyer demandeur — NON copié (spécifique au demandeur réel).
        batiments: {
          create: source.batiments.map((b) => ({
            nom: b.nom,
            description: b.description,
            zoneClimatique: b.zoneClimatique,
            altitude: b.altitude,
            orientation: b.orientation,
            zones: {
              create: b.zones.map((z) => ({
                nom: z.nom,
                usage: z.usage,
                surface: z.surface,
                hauteurSousPlafond: z.hauteurSousPlafond,
                consigneChauffageOcc: z.consigneChauffageOcc,
                consigneChauffageRed: z.consigneChauffageRed,
                consigneClimOcc: z.consigneClimOcc,
                consigneClimRed: z.consigneClimRed,
                densiteOccupation: z.densiteOccupation,
                apportsParPersonne: z.apportsParPersonne,
                apportsEquipements: z.apportsEquipements,
                apportsEclairage: z.apportsEclairage,
                qVmcM3hM2: z.qVmcM3hM2,
                efficaciteDoubleFlux: z.efficaciteDoubleFlux,
                scenarioId: z.scenarioId,
                parois: {
                  create: z.parois.map((zp) => ({
                    paroiId: zp.paroiId,
                    surface: zp.surface,
                    orientation: zp.orientation,
                    inclinaison: zp.inclinaison,
                    cotePaire: zp.cotePaire,
                  })),
                },
              })),
            },
            pontsThermiques: {
              create: b.pontsThermiques.map((pt) => ({
                typo: pt.typo,
                isolation: pt.isolation,
                longueur: pt.longueur,
                psiOverride: pt.psiOverride,
                notes: pt.notes,
              })),
            },
          })),
        },
        systemes: {
          create: source.systemes.map((s) => ({
            type: s.type,
            vecteur: s.vecteur,
            nom: s.nom,
            rendement: s.rendement,
            partCouverture: s.partCouverture,
            cop: s.cop,
            puissanceKwc: s.puissanceKwc,
            tauxAutoconso: s.tauxAutoconso,
            notes: s.notes,
          })),
        },
        variantes: {
          // parentId NON repris : la nouvelle variante perd son lien fork
          // car le parent du projet source n'existe pas dans le nouveau projet.
          create: source.variantes.map((v) => ({
            type: v.type,
            nom: v.nom,
            description: v.description,
            inputsJson: v.inputsJson,
          })),
        },
      },
      select: { id: true, titre: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[/api/projets/:id/duplicate POST]", err);
    return NextResponse.json(
      { error: "ServerError", message: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}
