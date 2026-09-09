import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos références — Projets de décarbonation & énergie réalisés",
  description:
    "Retrouvez les références Kilowater : copropriétés, parcs de bailleurs, bâtiments tertiaires, sites industriels, collectivités. Des projets concrets d'efficacité énergétique, de valorisation CEE et de décarbonation avec résultats chiffrés.",
  keywords: [
    "références décarbonation entreprise",
    "projets efficacité énergétique tertiaire",
    "valorisation CEE copropriété",
    "rénovation bâtiment tertiaire",
    "projet énergétique collectivité",
    "exemples décarbonation industrie",
    "résultats performance énergétique",
  ],
  openGraph: {
    title: "Nos références — Projets réalisés | Kilowater",
    description:
      "Découvrez les projets de décarbonation et d'efficacité énergétique réalisés par Kilowater : copropriétés, tertiaire, industrie, collectivités. Résultats chiffrés.",
    url: "https://www.kilowater.fr/nos-references",
    images: [{ url: "https://www.kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://www.kilowater.fr/nos-references",
  },
};

export default function NosReferencesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
