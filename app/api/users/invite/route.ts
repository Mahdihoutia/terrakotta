import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { EMAIL_FROM, getResend } from "@/lib/email/resend";
import { createInvitationSchema } from "@/lib/validations/invitation";

const TOKEN_BYTES = 32;
const TTL_HOURS = 72;

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * POST /api/users/invite — Crée une invitation et envoie un magic-link via
 * Resend. L'invité définira son mot de passe sur /auth/set-password?token=...
 *
 * Pas de transmission de mot de passe initial → onboarding plus sûr.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = createInvitationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const { email, name, role } = parsed.data;
  const emailLower = email.toLowerCase();

  try {
    // Refus si un compte actif existe déjà avec cet email.
    const existing = await prisma.user.findFirst({
      where: { email: emailLower, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json(
        { error: "EmailDejaUtilise", message: "Un compte existe déjà avec cet email." },
        { status: 409 },
      );
    }

    // Invalide les invitations pendantes pour le même email.
    await prisma.userInvitation.updateMany({
      where: { email: emailLower, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + TTL_HOURS * 3600 * 1000);

    const invitation = await prisma.userInvitation.create({
      data: {
        email: emailLower,
        name,
        role,
        token,
        expiresAt,
        invitedBy: session.user.id,
      },
    });

    // Envoie l'email — gracieux si Resend non configuré : on retourne le
    // lien dans la réponse pour transmission manuelle (utile en dev).
    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
    const link = `${baseUrl}/auth/set-password?token=${encodeURIComponent(token)}`;

    let emailSent = false;
    let emailError: string | null = null;
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = getResend();
        await resend.emails.send({
          from: EMAIL_FROM,
          to: emailLower,
          subject: "Vous êtes invité·e sur Kilowater",
          html: renderInviteHtml({
            name,
            link,
            expiresHours: TTL_HOURS,
            inviterName: session.user.name ?? session.user.email ?? "L'équipe",
            role,
          }),
          text: renderInviteText({ name, link, expiresHours: TTL_HOURS }),
        });
        emailSent = true;
      } catch (err) {
        emailError = err instanceof Error ? err.message : "Envoi email échoué";
      }
    } else {
      emailError = "RESEND_API_KEY non configurée — copie le lien manuellement.";
    }

    return NextResponse.json({
      ok: true,
      invitationId: invitation.id,
      emailSent,
      emailError,
      link, // toujours retourné en cas de fallback manuel
      expiresAt: invitation.expiresAt.toISOString(),
    });
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
    console.error("POST /api/users/invite", err);
    return NextResponse.json(
      { error: "ServerError", message: err instanceof Error ? err.message : "Erreur" },
      { status: 500 },
    );
  }
}

function renderInviteHtml({
  name,
  link,
  expiresHours,
  inviterName,
  role,
}: {
  name: string | null;
  link: string;
  expiresHours: number;
  inviterName: string;
  role: string;
}): string {
  const greeting = name ? `Bonjour ${escapeHtml(name)},` : "Bonjour,";
  return `<!doctype html>
<html lang="fr">
<body style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color:#0D1B35; max-width:560px; margin:0 auto; padding:32px 24px;">
  <div style="border-bottom:3px solid #2563EB; padding-bottom:12px; margin-bottom:24px;">
    <h1 style="font-size:22px; font-weight:700; margin:0; letter-spacing:-0.01em;">Kilowater · invitation</h1>
  </div>
  <p style="font-size:15px; line-height:1.55; margin:0 0 12px;">${greeting}</p>
  <p style="font-size:15px; line-height:1.55; margin:0 0 12px;">
    ${escapeHtml(inviterName)} vous invite à rejoindre le tableau de bord
    Kilowater avec le rôle <strong>${escapeHtml(role)}</strong>.
  </p>
  <p style="font-size:15px; line-height:1.55; margin:0 0 24px;">
    Cliquez sur le bouton ci-dessous pour définir votre mot de passe et
    activer votre compte. Ce lien est valable ${expiresHours} h.
  </p>
  <p style="margin:24px 0;">
    <a href="${link}" style="display:inline-block; background:#2563EB; color:#fff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600; font-size:14px;">Activer mon compte</a>
  </p>
  <p style="font-size:12px; color:#64748B; line-height:1.5; margin:24px 0 0;">
    Ou copiez ce lien dans votre navigateur :<br>
    <span style="word-break:break-all; color:#0D1B35;">${link}</span>
  </p>
  <p style="font-size:12px; color:#94A3B8; margin-top:32px;">
    Si vous n'attendez pas cette invitation, ignorez ce message — le lien
    expirera automatiquement.
  </p>
</body>
</html>`;
}

function renderInviteText({
  name,
  link,
  expiresHours,
}: {
  name: string | null;
  link: string;
  expiresHours: number;
}): string {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";
  return `${greeting}

Vous êtes invité·e à rejoindre le tableau de bord Kilowater.
Définissez votre mot de passe ici (valable ${expiresHours} h) :

${link}

Si vous n'attendez pas cette invitation, ignorez ce message.`;
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
