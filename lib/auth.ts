import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import type { AuthOptions } from "next-auth";

/**
 * NextAuth.js v4 configuration for Terrakotta dashboard.
 *
 * Mono-user authentication: admin credentials are stored in environment
 * variables (ADMIN_EMAIL + ADMIN_PASSWORD_HASH) rather than in the database.
 *
 * Session strategy uses JWT so no database session table is required.
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
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !adminPasswordHash) {
          throw new Error(
            "Variables ADMIN_EMAIL et ADMIN_PASSWORD_HASH non configurées."
          );
        }

        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        if (email.toLowerCase() !== adminEmail.toLowerCase()) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, adminPasswordHash);
        if (!passwordMatch) {
          return null;
        }

        return {
          id: "admin",
          email: adminEmail,
          name: "Administrateur",
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
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
