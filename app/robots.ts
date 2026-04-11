import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://kilowater.fr/sitemap.xml",
    host: "https://kilowater.fr",
  };
}
