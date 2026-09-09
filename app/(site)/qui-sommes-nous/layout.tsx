import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qui sommes-nous — Partenaire décarbonation & énergie Kilowater",
  description:
    "Kilowater est le partenaire décarbonation & énergie des entreprises : étude de gisement CEE, conseil en décarbonation et courtage de produits environnementaux, adossés à une expertise technique de terrain. Découvrez notre modèle, nos valeurs et nos qualifications RGE.",
  keywords: [
    "partenaire décarbonation & énergie",
    "qualification RGE",
    "ingénieur thermicien",
    "chargé d'affaires CEE",
    "conseil décarbonation entreprise",
    "bilan carbone",
    "courtage crédits carbone",
  ],
  openGraph: {
    title: "Qui sommes-nous | Kilowater — Partenaire décarbonation & énergie",
    description:
      "Découvrez Kilowater : le partenaire unique entre vos obligations énergétiques et les mécanismes qui les financent (CEE, crédits carbone, garanties d'origine), avec une vraie expertise technique de terrain.",
    url: "https://www.kilowater.fr/qui-sommes-nous",
    images: [{ url: "https://www.kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://www.kilowater.fr/qui-sommes-nous",
  },
};

export default function QuiSommesNousLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
