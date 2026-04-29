import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

import type { AuthOptions } from "next-auth";

/**
 * Détermine le rôle de l'utilisateur mono-compte (fallback env).
 * Configurable via la variable d'env `ADMIN_ROLE` (ADMIN | COLLABORATEUR | LECTURE_SEULE).
 * Par défaut : ADMIN.
 */
function resolveAdminRole(): Role {
  const raw = process.env.ADMIN_ROLE?.toUpperCase();
  if (raw === "COLLABORATEUR") return Role.COLLABORATEUR;
  if (raw === "LECTURE_SEULE") return Role.LECTURE_SEULE;
  return Role.ADMIN;
}

/**
 * NextAuth.js v4 — Terrakotta dashboard.
 *
 * Authentification multi-utilisateurs :
 *   1. Recherche d'abord en base (`prisma.user`) — comptes créés depuis
 *      l'onglet Paramètres > Utilisateurs.
 *   2. Fallback sur `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (compatibilité
 *      avec le mode mono-utilisateur initial). Activé seulement si la DB
 *      ne renvoie pas l'utilisateur ou si la requête échoue (table absente
 *      avant migration).
 *
 * Session JWT (24h) — pas de table de sessions à provisionner.
 */
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) {
          return null;
        }

        // 1. Recherche en base (multi-utilisateurs)
        try {
          const user = await prisma.user.findFirst({
            where: { email, deletedAt: null },
          });
          if (user) {
            const ok = await bcrypt.compare(password, user.password);
            if (!ok) return null;
            return {
              id: user.id,
              email: user.email,
              name: user.name ?? user.email,
              role: user.role,
            };
          }
          // Pas trouvé en DB → on tente le fallback env
        } catch (err) {
          console.error("[auth] DB lookup failed, falling back to env:", err);
        }

        // 2. Fallback env-based (compatibilité mono-compte)
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const adminHash = process.env.ADMIN_PASSWORD_HASH;
        if (!adminEmail || !adminHash) {
          return null;
        }
        if (email !== adminEmail) {
          return null;
        }
        const isBcryptHash = /^\$2[aby]\$\d{2}\$.{53}$/.test(adminHash);
        if (!isBcryptHash) {
          console.error(
            "[auth] ADMIN_PASSWORD_HASH does not look like a valid bcrypt hash.",
          );
          return null;
        }
        const ok = await bcrypt.compare(password, adminHash);
        if (!ok) return null;
        return {
          id: "admin-env",
          email: adminEmail,
          name: "Administrateur",
          role: resolveAdminRole(),
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 heures
  },

  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.role) token.role = user.role;
      }
      if (!token.role) token.role = resolveAdminRole();
      return token;
    },

    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
        session.user.role = (token.role ?? resolveAdminRole()) as Role;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
