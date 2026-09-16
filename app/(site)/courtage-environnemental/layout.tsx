import type { Metadata } from "next";
import { getAlternates } from "@/lib/i18n/routes";

const URL = "https://www.kilowater.fr/courtage-environnemental";

export const metadata: Metadata = {
  title: "Courtage de produits environnementaux — Crédits carbone, GO",
  description:
    "Courtage de produits environnementaux par Kilowater : crédits carbone volontaires (Label Bas Carbone), garanties d'origine et biotickets. Agrégateur avec une sélection exigeante des projets, contre le greenwashing.",
  keywords: [
    "courtage crédits carbone",
    "crédits carbone volontaires",
    "Label Bas Carbone",
    "garanties d'origine",
    "biotickets IRICC",
    "agrégateur carbone",
    "achat crédits carbone entreprise",
  ],
  alternates: getAlternates("brokerage", "fr"),
  openGraph: {
    title: "Courtage de produits environnementaux | Kilowater",
    description:
      "Crédits carbone volontaires, garanties d'origine et biotickets. Un agrégateur qui sélectionne des projets crédibles — pas seulement la mise en relation.",
    url: URL,
    images: [{ url: "https://www.kilowater.fr/opengraph-image", width: 1200, height: 630, alt: "Kilowater — Courtage environnemental" }],
    type: "website",
  },
};

export default function CourtageEnvironnementalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
