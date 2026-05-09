import type { Role } from "@prisma/client";

/** Métadonnées d'affichage des rôles — centralisé pour AccountPanel + UsersPanel. */
export const ROLE_META: Record<Role, { label: string; tone: string; description: string }> = {
  ADMIN: {
    label: "Administrateur",
    tone: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Accès complet, gestion des utilisateurs, suppressions définitives.",
  },
  COLLABORATEUR: {
    label: "Collaborateur",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Création et modification, pas de gestion des comptes.",
  },
  LECTURE_SEULE: {
    label: "Lecture seule",
    tone: "bg-zinc-100 text-zinc-700 border-zinc-200",
    description: "Consultation uniquement, aucune modification.",
  },
};

export const ROLES_ORDER: Role[] = ["ADMIN", "COLLABORATEUR", "LECTURE_SEULE"];
