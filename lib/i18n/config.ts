export const LOCALES = ["fr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const SITE_URL = "https://www.kilowater.fr";

/** Valeurs `og:locale` par langue. */
export const OG_LOCALES: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_GB",
};

/**
 * Nom de chaque langue dans sa propre langue (endonyme) et mention affichée
 * quand la page courante n'existe pas encore dans cette langue.
 */
export const LOCALE_META: Record<Locale, { name: string; unavailable: string }> = {
  fr: { name: "Français", unavailable: "Pas encore traduite" },
  en: { name: "English", unavailable: "Not translated yet" },
};
