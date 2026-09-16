import { DEFAULT_LOCALE, LOCALES, SITE_URL, type Locale } from "./config";

export type RouteKey =
  | "home"
  | "services"
  | "cee"
  | "decarbonation"
  | "brokerage"
  | "about"
  | "contact"
  | "references"
  | "lab"
  | "cookies";

const FR_ROUTES: Record<RouteKey, string> = {
  home: "/",
  services: "/nos-prestations",
  cee: "/accompagnement-cee",
  decarbonation: "/conseil-decarbonation",
  brokerage: "/courtage-environnemental",
  about: "/qui-sommes-nous",
  contact: "/contactez-nous",
  references: "/nos-references",
  lab: "/laboratoire-idees",
  cookies: "/cookies",
};

/**
 * Chemins par langue. Une page non encore traduite pointe vers sa version
 * française : il suffit de remplacer le chemin EN une fois la page livrée
 * (ex. `about: "/en/about-us"`).
 */
export const ROUTES: Record<Locale, Record<RouteKey, string>> = {
  fr: FR_ROUTES,
  en: {
    ...FR_ROUTES,
    home: "/en",
    about: "/en/about-us",
    contact: "/en/contact-us",
    services: "/en/services",
    cee: "/en/energy-efficiency-certificates",
    decarbonation: "/en/decarbonisation-advisory",
    brokerage: "/en/environmental-brokerage",
  },
};

/** Une page est traduite lorsque son chemin diffère de la version française. */
export function isTranslated(key: RouteKey, locale: Locale): boolean {
  return locale === DEFAULT_LOCALE || ROUTES[locale][key] !== FR_ROUTES[key];
}

/**
 * Retrouve l'équivalent d'un chemin dans une autre langue.
 * Retourne `null` si la page n'existe pas (encore) dans la langue cible.
 */
export function getAlternatePath(pathname: string, target: Locale): string | null {
  for (const locale of LOCALES) {
    const entry = (Object.keys(ROUTES[locale]) as RouteKey[]).find(
      (key) => ROUTES[locale][key] === pathname && isTranslated(key, locale),
    );
    if (entry) {
      return isTranslated(entry, target) ? ROUTES[target][entry] : null;
    }
  }
  return null;
}

/**
 * Bloc `alternates` (canonical + hreflang) pour l'API metadata.
 * `x-default` pointe vers la version française.
 */
export function getAlternates(key: RouteKey, locale: Locale) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    if (isTranslated(key, l)) languages[l] = `${SITE_URL}${ROUTES[l][key]}`;
  }
  languages["x-default"] = `${SITE_URL}${ROUTES[DEFAULT_LOCALE][key]}`;
  return {
    canonical: `${SITE_URL}${ROUTES[locale][key]}`,
    languages,
  };
}
