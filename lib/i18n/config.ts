export const LOCALES = ["fr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const SITE_URL = "https://www.kilowater.fr";

/** Valeurs `og:locale` par langue. */
export const OG_LOCALES: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_GB",
};
