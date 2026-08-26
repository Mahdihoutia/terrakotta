import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { EMAIL_FROM, getResend } from "@/lib/email/resend";
import { forgotPasswordSchema } from "@/lib/validations/password-reset";

const TOKEN_BYTES = 32;
const TTL_MINUTES = 60;

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Génère un jeton de réinitialisation et envoie un lien par email.
 * Anti-énumération : répond toujours 200, que le compte existe ou non.
 * En dev (RESEND_API_KEY absente), le lien est renvoyé dans la réponse
 * pour transmission manuelle.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const emailLower = parsed.data.email.toLowerCase();

  // Réponse générique renvoyée dans tous les cas (anti-énumération).
  const genericOk = { ok: true } as { ok: true; link?: string; emailError?: string };

  try {
    const user = await prisma.user.findFirst({
      where: { email: emailLower, deletedAt: null },
    });

    // Compte inconnu : on ne révèle rien, on répond OK sans envoyer d'email.
    if (!user) {
      return NextResponse.json(genericOk);
    }

    // Invalide les jetons de reset encore actifs pour ce compte.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, email: emailLower, token, expiresAt },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
    const link = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = getResend();
        await resend.emails.send({
          from: EMAIL_FROM,
          to: emailLower,
          subject: "Réinitialisation de votre mot de passe — Kilowater",
          html: renderResetHtml({ name: user.name, link, expiresMinutes: TTL_MINUTES }),
          text: renderResetText({ name: user.name, link, expiresMinutes: TTL_MINUTES }),
        });
      } catch (err) {
        // On loggue mais on garde la réponse générique côté client.
        console.error("POST /api/auth/forgot-password — envoi email", err);
        genericOk.emailError = err instanceof Error ? err.message : "Envoi email échoué";
      }
    } else {
      // Dev : pas de Resend configuré → on renvoie le lien pour test manuel.
      genericOk.link = link;
      genericOk.emailError = "RESEND_API_KEY non configurée — lien renvoyé pour usage manuel.";
    }

    return NextResponse.json(genericOk);
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
    console.error("POST /api/auth/forgot-password", err);
    // Même en cas d'erreur serveur, on ne divulgue pas l'existence du compte.
    return NextResponse.json(genericOk);
  }
}

function renderResetHtml({
  name,
  link,
  expiresMinutes,
}: {
  name: string | null;
  link: string;
  expiresMinutes: number;
}): string {
  const greeting = name ? `Bonjour ${escapeHtml(name)},` : "Bonjour,";
  return `<!doctype html>
<html lang="fr">
<body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color:#0D1B35; max-width:560px; margin:0 auto; padding:32px 24px;">
  <div style="border-bottom:3px solid #2563EB; padding-bottom:12px; margin-bottom:24px;">
    <h1 style="font-size:22px; font-weight:700; margin:0; letter-spacing:-0.01em;">Kilowater · réinitialisation</h1>
  </div>
  <p style="font-size:15px; line-height:1.55; margin:0 0 12px;">${greeting}</p>
  <p style="font-size:15px; line-height:1.55; margin:0 0 12px;">
    Vous avez demandé la réinitialisation de votre mot de passe sur le tableau
    de bord Kilowater. Cliquez sur le bouton ci-dessous pour en définir un
    nouveau. Ce lien est valable ${expiresMinutes} minutes.
  </p>
  <p style="margin:24px 0;">
    <a href="${link}" style="display:inline-block; background:#2563EB; color:#fff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600; font-size:14px;">Réinitialiser mon mot de passe</a>
  </p>
  <p style="font-size:12px; color:#64748B; line-height:1.5; margin:24px 0 0;">
    Ou copiez ce lien dans votre navigateur :<br>
    <span style="word-break:break-all; color:#0D1B35;">${link}</span>
  </p>
  <p style="font-size:12px; color:#94A3B8; margin-top:32px;">
    Si vous n'êtes pas à l'origine de cette demande, ignorez ce message — votre
    mot de passe reste inchangé et le lien expirera automatiquement.
  </p>
</body>
</html>`;
}

function renderResetText({
  name,
  link,
  expiresMinutes,
}: {
  name: string | null;
  link: string;
  expiresMinutes: number;
}): string {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";
  return `${greeting}

Vous avez demandé la réinitialisation de votre mot de passe Kilowater.
Définissez un nouveau mot de passe ici (valable ${expiresMinutes} minutes) :

${link}

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
