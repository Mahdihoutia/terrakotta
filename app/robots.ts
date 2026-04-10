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
    sitemap: "https://terrakotta.fr/sitemap.xml",
    host: "https://terrakotta.fr",
  };
}
