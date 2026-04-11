import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos références — Projets de rénovation énergétique réalisés",
  description:
    "Retrouvez les références Kilowater : maisons individuelles, bâtiments tertiaires, collectivités. Des projets concrets en isolation, chauffage, ventilation et rénovation globale avec résultats chiffrés.",
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
    title: "Nos références — Projets réalisés | Kilowater",
    description:
      "Découvrez les projets de rénovation énergétique réalisés par Kilowater : résidentiel, tertiaire, collectivités. Résultats et économies d'énergie chiffrés.",
    url: "https://kilowater.fr/nos-references",
    images: [{ url: "https://kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kilowater.fr/nos-references",
  },
};

export default function NosReferencesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
