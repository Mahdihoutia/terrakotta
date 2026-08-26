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
 * NextAuth.js v4 — Kilowater dashboard.
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

        // Défensif : certaines valeurs d'env peuvent avoir été enregistrées
        // AVEC des guillemets inclus dans la valeur → on les retire.
        const stripQuotes = (v?: string) =>
          v?.replace(/^\s*["']|["']\s*$/g, "").trim();

        // 1. Fast-path compte admin (env) — vérifié AVANT la base, pour que la
        // connexion de l'admin mono-compte ne dépende pas d'une éventuelle
        // latence/blocage de la connexion Prisma au pooler sur serverless.
        const adminEmail = stripQuotes(process.env.ADMIN_EMAIL)?.toLowerCase();
        // Le hash bcrypt contient des `$` que l'expansion dotenv de Next.js
        // tronque (aussi bien en local qu'au build Vercel). On privilégie donc
        // une variante base64 (sans `$`, immunisée) si elle est fournie.
        const adminHashB64 = stripQuotes(process.env.ADMIN_PASSWORD_HASH_B64);
        let adminHash = stripQuotes(process.env.ADMIN_PASSWORD_HASH);
        if (adminHashB64) {
          try {
            adminHash = Buffer.from(adminHashB64, "base64").toString("utf8");
          } catch {
            /* garde la valeur brute en secours */
          }
        }
        if (adminEmail && adminHash && email === adminEmail) {
          const isBcryptHash = /^\$2[aby]\$\d{2}\$.{53}$/.test(adminHash);
          if (!isBcryptHash) {
            console.error(
              "[auth] ADMIN_PASSWORD_HASH invalide (attendu bcrypt 60 car.). " +
                "Vérifie ADMIN_PASSWORD_HASH_B64.",
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
        }

        // 2. Comptes en base (multi-utilisateurs). Timeout de garde pour ne
        // jamais bloquer la fonction si la DB ne répond pas.
        try {
          const user = await Promise.race([
            prisma.user.findFirst({ where: { email, deletedAt: null } }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("DB timeout")), 5000),
            ),
          ]);
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
        } catch (err) {
          console.error("[auth] DB lookup failed:", err);
        }
        return null;
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
