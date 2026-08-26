import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/password-reset";

/**
 * GET /api/auth/reset-password?token=...
 * Validation rapide du jeton pour afficher l'écran sans le consommer.
 * Ne renvoie que l'email masqué — pas d'info sensible.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "TokenManquant" }, { status: 400 });
  }
  try {
    const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!reset) {
      return NextResponse.json(
        { error: "TokenInvalide", message: "Lien invalide ou révoqué." },
        { status: 404 },
      );
    }
    if (reset.usedAt) {
      return NextResponse.json(
        { error: "TokenConsomme", message: "Ce lien a déjà été utilisé." },
        { status: 410 },
      );
    }
    if (reset.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "TokenExpire", message: "Ce lien a expiré. Refaites une demande." },
        { status: 410 },
      );
    }
    return NextResponse.json({ emailMasked: maskEmail(reset.email) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json({ error: "MigrationPending" }, { status: 503 });
    }
    console.error("GET /api/auth/reset-password", err);
    return NextResponse.json({ error: "ServerError" }, { status: 500 });
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 *
 * Vérifie le jeton, met à jour le mot de passe (bcrypt) et consomme le jeton.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const { token, password } = parsed.data;

  try {
    const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!reset) {
      return NextResponse.json(
        { error: "TokenInvalide", message: "Lien invalide ou révoqué." },
        { status: 404 },
      );
    }
    if (reset.usedAt) {
      return NextResponse.json(
        { error: "TokenConsomme", message: "Ce lien a déjà été utilisé." },
        { status: 410 },
      );
    }
    if (reset.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "TokenExpire", message: "Ce lien a expiré. Refaites une demande." },
        { status: 410 },
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: reset.userId, deletedAt: null },
    });
    if (!user) {
      // Compte supprimé entre-temps — on consomme le jeton et on refuse.
      await prisma.passwordResetToken.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json(
        { error: "CompteIntrouvable", message: "Ce compte n'existe plus." },
        { status: 410 },
      );
    }

    const hash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hash } }),
      prisma.passwordResetToken.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Invalide tout autre jeton de reset pendant pour ce compte.
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json(
        {
          error: "MigrationPending",
          message:
            "Migration password_reset_tokens requise. Exécute prisma/migrations/_manual/2026_08_26_add_password_reset_tokens.sql.",
        },
        { status: 503 },
      );
    }
    console.error("POST /api/auth/reset-password", err);
    return NextResponse.json(
      { error: "ServerError", message: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

/** Masque un email pour l'affichage : jean.dupont@mail.com → j••••••t@mail.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  if (local.length <= 2) return `${local[0] ?? "•"}•••@${domain}`;
  return `${local[0]}${"•".repeat(Math.max(local.length - 2, 3))}${local[local.length - 1]}@${domain}`;
}
