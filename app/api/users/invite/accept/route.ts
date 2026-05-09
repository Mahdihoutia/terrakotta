import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { acceptInvitationSchema } from "@/lib/validations/invitation";

/**
 * POST /api/users/invite/accept
 * Body: { token, password }
 *
 * Vérifie l'invitation, crée le compte (ou réactive un soft-deleted), marque
 * le token comme consommé. Public (pas de session requise — c'est l'inscription).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = acceptInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const { token, password } = parsed.data;

  try {
    const invitation = await prisma.userInvitation.findUnique({ where: { token } });
    if (!invitation) {
      return NextResponse.json(
        { error: "InvitationInvalide", message: "Lien invalide ou révoqué." },
        { status: 404 },
      );
    }
    if (invitation.usedAt) {
      return NextResponse.json(
        { error: "InvitationConsommee", message: "Ce lien a déjà été utilisé." },
        { status: 410 },
      );
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "InvitationExpiree", message: "Ce lien a expiré. Demandez une nouvelle invitation." },
        { status: 410 },
      );
    }

    const hash = await bcrypt.hash(password, 12);

    // Réutilise un compte soft-deleted s'il existe pour ce mail.
    const existing = await prisma.user.findFirst({
      where: { email: invitation.email },
    });

    let userId: string;
    if (existing) {
      if (!existing.deletedAt) {
        // Cas anormal — un compte actif existe, l'invitation aurait dû échouer
        // au moment de POST /invite. On consomme le token et on refuse poliment.
        await prisma.userInvitation.update({
          where: { id: invitation.id },
          data: { usedAt: new Date() },
        });
        return NextResponse.json(
          { error: "EmailDejaUtilise", message: "Un compte existe déjà avec cet email." },
          { status: 409 },
        );
      }
      const restored = await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hash,
          name: invitation.name ?? existing.name,
          role: invitation.role,
          deletedAt: null,
        },
      });
      userId = restored.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email: invitation.email,
          password: hash,
          name: invitation.name,
          role: invitation.role,
        },
      });
      userId = created.id;
    }

    await prisma.userInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ ok: true, userId, email: invitation.email });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json(
        {
          error: "MigrationPending",
          message:
            "Migration user_invitations requise. Exécute prisma/migrations/_manual/2026_05_09_add_organisation_and_invitations.sql.",
        },
        { status: 503 },
      );
    }
    console.error("POST /api/users/invite/accept", err);
    return NextResponse.json(
      { error: "ServerError", message: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/users/invite/accept?token=...
 * Validation rapide pour préremplir l'écran (email/role) sans consommer le token.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "TokenManquant" }, { status: 400 });
  }
  try {
    const invitation = await prisma.userInvitation.findUnique({ where: { token } });
    if (!invitation) {
      return NextResponse.json(
        { error: "InvitationInvalide", message: "Lien invalide ou révoqué." },
        { status: 404 },
      );
    }
    if (invitation.usedAt) {
      return NextResponse.json(
        { error: "InvitationConsommee", message: "Ce lien a déjà été utilisé." },
        { status: 410 },
      );
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "InvitationExpiree", message: "Ce lien a expiré." },
        { status: 410 },
      );
    }
    return NextResponse.json({
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json({ error: "MigrationPending" }, { status: 503 });
    }
    console.error("GET /api/users/invite/accept", err);
    return NextResponse.json({ error: "ServerError" }, { status: 500 });
  }
}
