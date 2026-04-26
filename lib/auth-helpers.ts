import { getServerSession, type Session } from "next-auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export { Role };

/**
 * Récupère la session côté serveur (route handlers, server components, server actions).
 */
export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Erreur typée levée par requireRole quand l'accès est refusé.
 */
export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Garde de rôle pour route handlers.
 *
 *   const session = await requireRole([Role.ADMIN, Role.COLLABORATEUR]);
 *
 * Lève une AuthError (401 si non authentifié, 403 si rôle insuffisant).
 * Utiliser de pair avec `withAuthErrors` ou un try/catch.
 */
export async function requireRole(roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session?.user) {
    throw new AuthError(401, "Non authentifié");
  }
  if (!roles.includes(session.user.role)) {
    throw new AuthError(
      403,
      "Votre rôle ne permet pas cette opération."
    );
  }
  return session;
}

/**
 * Wrap une réponse de route handler pour convertir AuthError en NextResponse.
 *
 *   export const DELETE = withAuthErrors(async (req) => {
 *     await requireRole([Role.ADMIN]);
 *     ...
 *   });
 */
export function withAuthErrors<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status }
        );
      }
      throw err;
    }
  };
}

/** Rôles autorisés à muter (POST/PATCH/DELETE par défaut). */
export const MUTATION_ROLES: Role[] = [Role.ADMIN, Role.COLLABORATEUR];

/** Rôles autorisés aux opérations destructives (DELETE). */
export const DESTRUCTIVE_ROLES: Role[] = [Role.ADMIN, Role.COLLABORATEUR];

/**
 * Helper inline : `const guard = await ensureRole(MUTATION_ROLES); if (guard) return guard;`
 * Renvoie `null` si OK, ou directement la NextResponse 401/403.
 */
export async function ensureRole(roles: Role[]): Promise<NextResponse | null> {
  try {
    await requireRole(roles);
    return null;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }
    throw err;
  }
}
