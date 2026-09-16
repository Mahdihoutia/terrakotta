import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { fr, type Dictionary } from "./dictionaries/fr";

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en };

/**
 * Dictionnaire d'une langue. À appeler côté serveur, puis transmettre
 * uniquement la section utile aux Client Components (évite d'embarquer
 * toutes les langues dans le bundle JS).
 */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
