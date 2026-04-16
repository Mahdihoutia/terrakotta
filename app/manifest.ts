import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kilowater — Bureau d'étude en rénovation énergétique",
    short_name: "Kilowater",
    description:
      "Bureau d'étude spécialisé en rénovation énergétique des bâtiments tertiaires et industriels. Audit énergétique, accompagnement CEE, maîtrise d'œuvre.",
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
