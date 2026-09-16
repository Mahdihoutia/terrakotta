import { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";
import { getAlternates, ROUTES, type RouteKey } from "@/lib/i18n/routes";

const BASE_URL = "https://www.kilowater.fr";

/** hreflang d'une page disponible en plusieurs langues. */
const languagesOf = (key: RouteKey) => getAlternates(key, "fr").languages;

/** Entrée sitemap de la version anglaise d'une page traduite. */
const enEntry = (
  key: RouteKey,
  entry: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap[number] => ({
  url: `${BASE_URL}${ROUTES.en[key]}`,
  alternates: { languages: languagesOf(key) },
  ...entry,
});

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Pages statiques du site vitrine
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1.0,
      alternates: { languages: languagesOf("home") },
    },
    enEntry("home", { lastModified: now, changeFrequency: "monthly", priority: 0.9 }),
    {
      url: `${BASE_URL}/nos-prestations`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: languagesOf("services") },
    },
    enEntry("services", { lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    {
      url: `${BASE_URL}/nos-references`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/qui-sommes-nous`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
      alternates: { languages: languagesOf("about") },
    },
    enEntry("about", { lastModified: now, changeFrequency: "yearly", priority: 0.6 }),
    {
      url: `${BASE_URL}/contactez-nous`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.8,
      alternates: { languages: languagesOf("contact") },
    },
    enEntry("contact", { lastModified: now, changeFrequency: "yearly", priority: 0.7 }),
    {
      url: `${BASE_URL}/laboratoire-idees`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    // Pages SEO piliers
    {
      url: `${BASE_URL}/accompagnement-cee`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: languagesOf("cee") },
    },
    enEntry("cee", { lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    {
      url: `${BASE_URL}/conseil-decarbonation`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: languagesOf("decarbonation") },
    },
    enEntry("decarbonation", { lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    {
      url: `${BASE_URL}/courtage-environnemental`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: languagesOf("brokerage") },
    },
    enEntry("brokerage", { lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    // Pages locales SEO (priorité élevée — fort potentiel de trafic local)
    {
      url: `${BASE_URL}/audit-energetique-paris`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/renovation-energetique-paris`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
  ];

  // Articles du laboratoire d'idées
  const articles = getAllArticles();
  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => {
    // article.date is French format like "18 février 2026" — not parseable by Date()
    const parsed = new Date(article.date);
    const lastMod = isNaN(parsed.getTime()) ? now : parsed;
    return {
      url: `${BASE_URL}/laboratoire-idees/${article.slug}`,
      lastModified: lastMod,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    };
  });

  const legalRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [...staticRoutes, ...articleRoutes, ...legalRoutes];
}
