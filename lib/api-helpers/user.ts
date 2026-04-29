/**
 * Helpers de sérialisation pour les utilisateurs.
 * Extraits hors des fichiers route.ts car Next.js 15 App Router
 * n'autorise QUE les exports HTTP (GET, POST, …) dans `route.ts`.
 */

import type { Role } from "@prisma/client";

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  deletedAt?: Date | null;
}

/** Sérialise un user pour la réponse API (sans password). */
export function serializeUser(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
  };
}
