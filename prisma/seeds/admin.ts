/**
 * Bootstrap d'un utilisateur ADMIN en base.
 *
 * Utilisation :
 *   npx tsx prisma/seeds/admin.ts <email> <password> [nom]
 *
 * Crée l'utilisateur s'il n'existe pas, ou met à jour son mot de passe et
 * son rôle (ADMIN) s'il existe déjà (utile pour réinitialiser l'accès).
 *
 * Pré-requis : la migration `2026_04_28_add_user_deleted_at.sql` doit avoir
 * été exécutée et `npx prisma generate` lancé.
 */

import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [, , emailRaw, password, nameRaw] = process.argv;
  if (!emailRaw || !password) {
    console.error(
      "Usage : npx tsx prisma/seeds/admin.ts <email> <password> [nom]",
    );
    process.exit(1);
  }
  const email = emailRaw.toLowerCase().trim();
  if (password.length < 8) {
    console.error("Le mot de passe doit faire au moins 8 caractères.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const name = nameRaw?.trim() || null;

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: hash,
        role: Role.ADMIN,
        deletedAt: null,
        ...(name ? { name } : {}),
      },
    });
    console.log(`Utilisateur mis à jour : ${updated.email} (${updated.role})`);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        password: hash,
        role: Role.ADMIN,
        name,
      },
    });
    console.log(`Utilisateur créé : ${created.email} (${created.role})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
