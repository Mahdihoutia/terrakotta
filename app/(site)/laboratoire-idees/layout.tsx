import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laboratoire d'idées — Décarbonation & énergie",
  description:
    "Le blog de Kilowater : conseils pratiques, actualités réglementaires et guides sur les CEE, la décarbonation des entreprises, le bilan carbone, les crédits carbone, le décret tertiaire et la CSRD.",
  keywords: [
    "blog décarbonation entreprise",
    "actualités CEE tertiaire",
    "guide bilan carbone",
    "crédits carbone volontaires",
    "décret tertiaire",
    "CSRD",
    "efficacité énergétique bâtiment",
  ],
  openGraph: {
    title: "Laboratoire d'idées | Kilowater — Décarbonation & énergie",
    description:
      "Guides, conseils et actualités décarbonation & énergie par les experts Kilowater. CEE, bilan carbone, crédits carbone, décret tertiaire : tout ce qu'il faut savoir.",
    url: "https://www.kilowater.fr/laboratoire-idees",
    images: [{ url: "https://www.kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://www.kilowater.fr/laboratoire-idees",
  },
};

export default function LaboratoireLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
