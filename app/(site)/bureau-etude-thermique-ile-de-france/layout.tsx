import type { Metadata } from "next";

const URL = "https://www.kilowater.fr/bureau-etude-thermique-ile-de-france";

export const metadata: Metadata = {
  title: "Bureau d'étude thermique Île-de-France — Kilowater",
  description:
    "Bureau d'étude thermique en Île-de-France. RE2020, audits, simulations dynamiques, ACV. Kilowater intervient sur Paris (75), Hauts-de-Seine (92), Seine-Saint-Denis (93), Val-de-Marne (94).",
  keywords: [
    "bureau étude thermique Île-de-France",
    "bureau étude thermique Paris",
    "bureau étude RE2020 Paris",
    "ingénieur thermicien Île-de-France",
    "STD simulation thermique dynamique Paris",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: "Bureau d'étude thermique Île-de-France — Kilowater",
    description:
      "Études thermiques RE2020, simulations dynamiques, ACV bâtiment. Bureau d'étude basé à Paris pour toute l'Île-de-France.",
    url: URL,
    type: "website",
    locale: "fr_FR",
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
