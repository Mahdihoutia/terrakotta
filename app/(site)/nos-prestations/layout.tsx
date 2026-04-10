import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos prestations — Audit énergétique & Maîtrise d'œuvre",
  description:
    "Découvrez les prestations de Terrakotta : audit énergétique réglementaire, maîtrise d'œuvre en rénovation, accompagnement CEE et MaPrimeRénov', note de dimensionnement. Expertise pour particuliers, professionnels et collectivités.",
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
    title: "Nos prestations — Audit & Maîtrise d'œuvre | Terrakotta",
    description:
      "Audit énergétique, maîtrise d'œuvre, CEE, MaPrimeRénov' : l'expertise complète de Terrakotta pour votre projet de rénovation énergétique.",
    url: "https://terrakotta.fr/nos-prestations",
    type: "website",
  },
  alternates: {
    canonical: "https://terrakotta.fr/nos-prestations",
  },
};

export default function NosPrestation({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
