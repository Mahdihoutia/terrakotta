import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos prestations — Partenaire décarbonation & énergie",
  description:
    "L'offre intégrée de Kilowater : étude de gisement CEE, conseil en décarbonation (bilan carbone, CSRD, décret tertiaire) et courtage de produits environnementaux (crédits carbone, garanties d'origine, biotickets). Pour copropriétés, bailleurs, collectivités, tertiaire & industrie.",
  keywords: [
    "étude de gisement CEE",
    "conseil en décarbonation",
    "bilan carbone entreprise",
    "courtage crédits carbone",
    "garanties d'origine",
    "audit énergétique tertiaire",
    "AMO efficacité énergétique",
  ],
  openGraph: {
    title: "Nos prestations — Partenaire décarbonation & énergie | Kilowater",
    description:
      "CEE, conseil décarbonation et courtage de produits environnementaux : la chaîne de valeur complète de Kilowater, de l'audit technique à la valorisation.",
    url: "https://www.kilowater.fr/nos-prestations",
    images: [{ url: "https://www.kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://www.kilowater.fr/nos-prestations",
  },
};

export default function NosPrestation({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
