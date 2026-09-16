import { ARTICLE_SLUGS_EN, ARTICLE_SLUGS_FR } from "./article-slugs";
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
    lab: "/en/insights",
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
  const article = getArticleAlternatePath(pathname, target);
  if (article !== undefined) return article;

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

/**
 * Équivalent d'une page article (`/laboratoire-idees/<slug>` ↔ `/en/insights/<slug>`).
 * `undefined` si le chemin n'est pas un article, `null` si l'article n'est pas traduit.
 */
function getArticleAlternatePath(pathname: string, target: Locale): string | null | undefined {
  for (const locale of LOCALES) {
    const prefix = `${ROUTES[locale].lab}/`;
    if (!pathname.startsWith(prefix)) continue;
    const slug = pathname.slice(prefix.length);
    if (locale === target) return pathname;
    const frSlug = locale === "fr" ? slug : ARTICLE_SLUGS_FR[slug];
    const targetSlug = target === "fr" ? frSlug : frSlug && ARTICLE_SLUGS_EN[frSlug];
    return targetSlug ? `${ROUTES[target].lab}/${targetSlug}` : null;
  }
  return undefined;
}

/** Bloc `alternates` (canonical + hreflang) d'un article, à partir de son slug FR. */
export function getArticleAlternates(frSlug: string, locale: Locale) {
  const enSlug = ARTICLE_SLUGS_EN[frSlug];
  const frUrl = `${SITE_URL}${ROUTES.fr.lab}/${frSlug}`;
  const enUrl = enSlug ? `${SITE_URL}${ROUTES.en.lab}/${enSlug}` : null;
  return {
    canonical: locale === "en" && enUrl ? enUrl : frUrl,
    languages: enUrl ? { fr: frUrl, en: enUrl, "x-default": frUrl } : undefined,
  };
}
