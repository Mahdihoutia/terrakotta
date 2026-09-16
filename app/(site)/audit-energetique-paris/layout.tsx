import type { Metadata } from "next";

const URL = "https://www.kilowater.fr/audit-energetique-paris";

export const metadata: Metadata = {
  title: "Audit énergétique à Paris — Copropriétés, tertiaire, collectivités",
  description:
    "Audit énergétique à Paris pour copropriétés, bailleurs, tertiaire et collectivités. Kilowater, partenaire décarbonation & énergie basé à Paris 7e, valorisation CEE et aides B2B (MaPrimeRénov' Copropriétés, Éco-PTZ collectif). Réponse sous 48h.",
  keywords: [
    "audit énergétique Paris",
    "audit énergétique copropriété Paris",
    "audit énergétique réglementaire Paris",
    "partenaire CEE Paris",
    "audit DPE Paris",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "Audit énergétique à Paris | Kilowater — Partenaire décarbonation & énergie",
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
