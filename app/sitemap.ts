import { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

const BASE_URL = "https://kilowater.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Pages statiques du site vitrine
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/nos-prestations`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
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
    },
    {
      url: `${BASE_URL}/contactez-nous`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/laboratoire-idees`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    // Pages SEO piliers
    {
      url: `${BASE_URL}/bureau-d-etude-renovation-energetique`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/accompagnement-cee`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/audit-energetique`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
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

  return [...staticRoutes, ...articleRoutes];
}
