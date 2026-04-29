import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureRole } from "@/lib/auth-helpers";
import { createUserSchema } from "@/lib/validations/user";
import { serializeUser } from "@/lib/api-helpers/user";

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

/** GET /api/users — Liste des utilisateurs (ADMIN uniquement). */
export async function GET() {
  const guard = await ensureRole([Role.ADMIN]);
  if (guard) return guard;

  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users.map(serializeUser));
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

/** POST /api/users — Création d'un utilisateur (ADMIN uniquement). */
export async function POST(request: Request) {
  const guard = await ensureRole([Role.ADMIN]);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.issues },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const email = d.email.toLowerCase();

  try {
    const existing = await prisma.user.findFirst({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "EmailDejaUtilise", message: "Cet email est déjà utilisé." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(d.password, 12);
    const created = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: d.name ?? null,
        role: d.role as Role,
      },
    });

    // Note : on ne renvoie jamais le password hashé.
    return NextResponse.json(serializeUser(created), { status: 201 });
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
