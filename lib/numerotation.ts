import { prisma } from "@/lib/db";

interface NumeroPrefs {
  prefixDevis: string;
  prefixFacture: string;
  yearFmt: 4 | 2;
  padding: number;
}

const DEFAULTS: NumeroPrefs = {
  prefixDevis: "DV",
  prefixFacture: "FA",
  yearFmt: 4,
  padding: 3,
};

/**
 * Charge les préférences depuis la singleton `organisation`. Tolère l'absence
 * de la table (migration en attente) en retournant les valeurs par défaut.
 */
async function loadPrefs(): Promise<NumeroPrefs> {
  try {
    const org = await prisma.organisation.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        prefixDevis: true,
        prefixFacture: true,
        formatAnnee: true,
        paddingNumero: true,
      },
    });
    if (!org) return DEFAULTS;
    return {
      prefixDevis: org.prefixDevis?.trim() || DEFAULTS.prefixDevis,
      prefixFacture: org.prefixFacture?.trim() || DEFAULTS.prefixFacture,
      yearFmt: org.formatAnnee === "ANNEE_2" ? 2 : 4,
      padding:
        org.paddingNumero && org.paddingNumero >= 2 && org.paddingNumero <= 6
          ? org.paddingNumero
          : DEFAULTS.padding,
    };
  } catch {
    // Table absente (migration pas passée) → fallback silencieux.
    return DEFAULTS;
  }
}

function formatYear(yearFmt: 4 | 2): string {
  const y = new Date().getFullYear();
  return yearFmt === 4 ? String(y) : String(y).slice(-2);
}

/**
 * Génère un numéro de devis avec les préférences de l'organisation.
 * Compte les devis (incluant la corbeille) du même préfixe pour incrémenter.
 */
export async function generateDevisNumero(): Promise<string> {
  const prefs = await loadPrefs();
  const prefix = `${prefs.prefixDevis}-${formatYear(prefs.yearFmt)}-`;
  const count = await prisma.devis.count({
    where: { numero: { startsWith: prefix } },
  });
  const nextNum = String(count + 1).padStart(prefs.padding, "0");
  return `${prefix}${nextNum}`;
}

/**
 * Génère un numéro de facture avec les préférences de l'organisation.
 * Compte les factures (incluant la corbeille) du même préfixe pour incrémenter.
 */
export async function generateFactureNumero(): Promise<string> {
  const prefs = await loadPrefs();
  const prefix = `${prefs.prefixFacture}-${formatYear(prefs.yearFmt)}-`;
  const count = await prisma.facture.count({
    where: { numero: { startsWith: prefix } },
  });
  const nextNum = String(count + 1).padStart(prefs.padding, "0");
  return `${prefix}${nextNum}`;
}
