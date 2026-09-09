import type { Metadata } from "next";

const URL = "https://www.kilowater.fr/audit-energetique-paris";

export const metadata: Metadata = {
  title: "Audit énergétique à Paris — Bureau d'étude Kilowater",
  description:
    "Audit énergétique à Paris pour copropriétés, bailleurs, tertiaire et collectivités. Bureau d'étude Kilowater (75007), équipe RGE, valorisation CEE et aides B2B (MaPrimeRénov' Copropriétés, Éco-PTZ collectif). Réponse sous 48h.",
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
      "Partenaire décarbonation & énergie basé à Paris 7e. Audits énergétiques et valorisation CEE pour copropriétés, bailleurs, tertiaire et collectivités en Île-de-France.",
    url: URL,
    type: "website",
    locale: "fr_FR",
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
