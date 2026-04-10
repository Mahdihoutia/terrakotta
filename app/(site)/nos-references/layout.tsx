import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos références — Projets de rénovation énergétique réalisés",
  description:
    "Retrouvez les références Terrakotta : maisons individuelles, bâtiments tertiaires, collectivités. Des projets concrets en isolation, chauffage, ventilation et rénovation globale avec résultats chiffrés.",
  keywords: [
    "références rénovation énergétique",
    "projets isolation thermique",
    "rénovation maison individuelle",
    "rénovation bâtiment tertiaire",
    "rénovation collectivité",
    "exemples travaux rénovation",
    "résultats performance énergétique",
  ],
  openGraph: {
    title: "Nos références — Projets réalisés | Terrakotta",
    description:
      "Découvrez les projets de rénovation énergétique réalisés par Terrakotta : résidentiel, tertiaire, collectivités. Résultats et économies d'énergie chiffrés.",
    url: "https://terrakotta.fr/nos-references",
    images: [{ url: "https://terrakotta.fr/og-image.jpg", width: 1200, height: 630, alt: "Terrakotta" }],
    type: "website",
  },
  alternates: {
    canonical: "https://terrakotta.fr/nos-references",
  },
};

export default function NosReferencesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
