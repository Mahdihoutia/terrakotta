import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helpers";
import { updateUserSchema } from "@/lib/validations/user";
import { serializeUser } from "@/lib/api-helpers/user";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function migrationPendingResponse(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("deleted_at") ||
    lower.includes("deletedat") ||
    lower.includes("p2021") ||
    lower.includes("p2022") ||
    lower.includes("does not exist") ||
    lower.includes("relation") ||
    lower.includes("column")
  ) {
    return NextResponse.json(
      {
        error: "MigrationPending",
        message:
          "Migration users.deleted_at requise. Exécute prisma/migrations/_manual/2026_04_28_add_user_deleted_at.sql.",
      },
      { status: 503 },
    );
  }
  return null;
}

/** GET /api/users/[id] — ADMIN ou self. */
export async function GET(_req: Request, ctx: RouteContext) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const isAdmin = session.user.role === Role.ADMIN;
  const isSelf = session.user.id === id;
  if (!isAdmin && !isSelf) {
    return NextResponse.json(
      { error: "Accès refusé" },
      { status: 403 },
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }
    return NextResponse.json(serializeUser(user));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const pending = migrationPendingResponse(message);
    if (pending) return pending;
    return NextResponse.json(
      { error: "ServerError", message },
      { status: 500 },
    );
  }
}

/** PATCH /api/users/[id] — ADMIN ou self (self ne peut pas changer son rôle). */
export async function PATCH(req: Request, ctx: RouteContext) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const isAdmin = session.user.role === Role.ADMIN;
  const isSelf = session.user.id === id;
  if (!isAdmin && !isSelf) {
    return NextResponse.json(
      { error: "Accès refusé" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;

  // Self ne peut pas changer son propre rôle.
  if (isSelf && d.role !== undefined && d.role !== session.user.role) {
    return NextResponse.json(
      {
        error: "RoleSelfChange",
        message: "Vous ne pouvez pas modifier votre propre rôle.",
      },
      { status: 403 },
    );
  }
  // Seul un ADMIN peut changer le rôle d'un autre user.
  if (!isAdmin && d.role !== undefined) {
    return NextResponse.json(
      { error: "Accès refusé" },
      { status: 403 },
    );
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    // Si on rétrograde le dernier ADMIN actif → refus.
    if (
      d.role !== undefined &&
      existing.role === Role.ADMIN &&
      d.role !== Role.ADMIN
    ) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN, deletedAt: null },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error: "DernierAdmin",
            message:
              "Impossible de rétrograder le dernier administrateur actif.",
          },
          { status: 409 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (d.name !== undefined) updateData.name = d.name;
    if (d.role !== undefined) updateData.role = d.role;
    if (d.email !== undefined) {
      const emailLower = d.email.toLowerCase();
      if (emailLower !== existing.email) {
        const taken = await prisma.user.findFirst({
          where: { email: emailLower, id: { not: id } },
        });
        if (taken) {
          return NextResponse.json(
            {
              error: "EmailDejaUtilise",
              message: "Cet email est déjà utilisé.",
            },
            { status: 409 },
          );
        }
        updateData.email = emailLower;
      }
    }
    if (d.password !== undefined) {
      updateData.password = await bcrypt.hash(d.password, 12);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(serializeUser(updated));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const pending = migrationPendingResponse(message);
    if (pending) return pending;
    return NextResponse.json(
      { error: "ServerError", message },
      { status: 500 },
    );
  }
}

/** DELETE /api/users/[id] — Soft-delete (ADMIN uniquement). */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await ctx.params;

  try {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    // Empêcher la suppression du dernier ADMIN actif.
    if (existing.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN, deletedAt: null },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error: "DernierAdmin",
            message:
              "Impossible de supprimer le dernier administrateur actif.",
          },
          { status: 409 },
        );
      }
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    const pending = migrationPendingResponse(message);
    if (pending) return pending;
    return NextResponse.json(
      { error: "ServerError", message },
      { status: 500 },
    );
  }
}
