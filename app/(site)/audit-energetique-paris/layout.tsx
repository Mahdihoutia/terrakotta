import type { Metadata } from "next";

const URL = "https://www.kilowater.fr/audit-energetique-paris";

export const metadata: Metadata = {
  title: "Audit énergétique à Paris — Bureau d'étude Kilowater",
  description:
    "Audit énergétique à Paris pour copropriétés, tertiaire et logements. Bureau d'étude Kilowater (75007), équipe RGE, accompagnement aides MaPrimeRénov' et CEE. Devis sous 48h.",
  keywords: [
    "audit énergétique Paris",
    "audit énergétique copropriété Paris",
    "audit énergétique réglementaire Paris",
    "bureau d'étude Paris",
    "audit DPE Paris",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "Audit énergétique à Paris — Bureau d'étude Kilowater",
    description:
      "Bureau d'étude basé à Paris 7e. Audits énergétiques pour copropriétés, tertiaire et particuliers en Île-de-France.",
    url: URL,
    type: "website",
    locale: "fr_FR",
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
