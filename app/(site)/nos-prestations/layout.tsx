import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos prestations — Audit énergétique & Maîtrise d'œuvre",
  description:
    "Découvrez les prestations de Kilowater : audit énergétique réglementaire, maîtrise d'œuvre en rénovation, accompagnement CEE et MaPrimeRénov', note de dimensionnement. Expertise pour particuliers, professionnels et collectivités.",
  keywords: [
    "audit énergétique réglementaire",
    "maîtrise d'œuvre rénovation",
    "accompagnement CEE",
    "MaPrimeRénov accompagnement",
    "note de dimensionnement",
    "bilan thermique bâtiment",
    "AMO rénovation énergétique",
  ],
  openGraph: {
    title: "Nos prestations — Audit & Maîtrise d'œuvre | Kilowater",
    description:
      "Audit énergétique, maîtrise d'œuvre, CEE, MaPrimeRénov' : l'expertise complète de Kilowater pour votre projet de rénovation énergétique.",
    url: "https://kilowater.fr/nos-prestations",
    images: [{ url: "https://kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kilowater.fr/nos-prestations",
  },
};

export default function NosPrestation({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
