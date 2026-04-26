import { prisma } from "@/lib/db";

/**
 * Génère un numéro de devis du type "DV-2026-001".
 * Compte les devis (incluant la corbeille) du même préfixe pour incrémenter.
 */
export async function generateDevisNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DV-${year}-`;

  const count = await prisma.devis.count({
    where: { numero: { startsWith: prefix } },
  });

  const nextNum = String(count + 1).padStart(3, "0");
  return `${prefix}${nextNum}`;
}

/**
 * Génère un numéro de facture du type "FA-2026-001".
 * Compte les factures (incluant la corbeille) du même préfixe pour incrémenter.
 */
export async function generateFactureNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FA-${year}-`;

  const count = await prisma.facture.count({
    where: { numero: { startsWith: prefix } },
  });

  const nextNum = String(count + 1).padStart(3, "0");
  return `${prefix}${nextNum}`;
}
