import { ARTICLES, toSummary, type Article, type ArticleSummary } from "@/lib/articles";
import type { Locale } from "./config";
import { ARTICLE_TRANSLATIONS_EN } from "./content/articles-en";
import { ROUTES } from "./routes";

/**
 * Articles dans une langue donnée. En anglais, seuls les articles traduits
 * sont exposés ; slug, titre, extrait, date et contenu sont remplacés.
 */
export function getLocalizedArticles(locale: Locale): Article[] {
  if (locale === "fr") return ARTICLES;
  return ARTICLES.flatMap((article) => {
    const t = ARTICLE_TRANSLATIONS_EN[article.slug];
    return t ? [{ ...article, ...t }] : [];
  });
}

export function getLocalizedArticle(locale: Locale, slug: string): Article | undefined {
  return getLocalizedArticles(locale).find((a) => a.slug === slug);
}

export function getLocalizedSummaries(locale: Locale): ArticleSummary[] {
  return getLocalizedArticles(locale).map(toSummary);
}

/** Articles connexes : même catégorie d'abord, puis les autres. */
export function getLocalizedRelated(locale: Locale, slug: string, count = 3): ArticleSummary[] {
  const all = getLocalizedArticles(locale);
  const current = all.find((a) => a.slug === slug);
  const others = all.filter((a) => a.slug !== slug);
  const same = others.filter((a) => a.category === current?.category);
  const rest = others.filter((a) => a.category !== current?.category);
  return [...same, ...rest].slice(0, count).map(toSummary);
}

/** Chemin public d'un article dans une langue. */
export function articlePath(locale: Locale, slug: string): string {
  return `${ROUTES[locale].lab}/${slug}`;
}
