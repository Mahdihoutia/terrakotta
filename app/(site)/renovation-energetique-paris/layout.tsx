import type { Metadata } from "next";

const URL = "https://www.kilowater.fr/renovation-energetique-paris";

export const metadata: Metadata = {
  title: "Rénovation énergétique à Paris — Copropriétés et bâtiments tertiaires",
  description:
    "Rénovation énergétique à Paris : audit, maîtrise d'œuvre, accompagnement aides. Spécialiste du bâti haussmannien et de la copropriété parisienne. Kilowater, partenaire décarbonation & énergie, Paris 7e.",
  keywords: [
    "rénovation énergétique Paris",
    "rénovation copropriété Paris",
    "rénovation immeuble haussmannien",
    "MaPrimeRénov copropriété Paris",
    "ITE ITI Paris",
    "isolation copropriété Paris",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "Rénovation énergétique à Paris | Kilowater — Partenaire décarbonation & énergie",
    description:
      "Audit, maîtrise d'œuvre et accompagnement aides pour rénover votre bâtiment à Paris. Spécialiste copropriété et bâti haussmannien.",
    url: URL,
    type: "website",
    locale: "fr_FR",
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
