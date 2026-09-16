import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kilowater — Partenaire décarbonation & énergie",
    short_name: "Kilowater",
    description:
      "Partenaire décarbonation & énergie des entreprises : étude de gisement CEE, conseil en décarbonation et courtage de produits environnementaux.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#0D1B35",
    lang: "fr-FR",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    categories: ["business", "productivity", "utilities"],
  };
}
