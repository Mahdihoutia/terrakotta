import { MetadataRoute } from "next";

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
  ];

  return staticRoutes;
}
