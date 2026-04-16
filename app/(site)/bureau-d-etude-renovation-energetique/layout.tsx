import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bureau d'étude en rénovation énergétique — Kilowater",
  description:
    "Kilowater, bureau d'étude indépendant spécialisé en rénovation énergétique. Audit thermique, maîtrise d'œuvre, accompagnement CEE et MaPrimeRénov'. Qualification RGE, expertise tertiaire et résidentiel.",
  keywords: [
    "bureau d'étude rénovation énergétique",
    "bureau d'étude thermique",
    "BET rénovation",
    "bureau d'études indépendant",
    "audit énergétique",
    "maîtrise d'œuvre rénovation",
    "qualification RGE",
    "bureau d'étude CEE",
  ],
  openGraph: {
    title: "Bureau d'étude en rénovation énergétique | Kilowater",
    description:
      "Bureau d'étude indépendant, qualifié RGE. Audit, maîtrise d'œuvre, accompagnement CEE et MaPrimeRénov' pour particuliers, professionnels et collectivités.",
    url: "https://kilowater.fr/bureau-d-etude-renovation-energetique",
    images: [
      {
        url: "https://kilowater.fr/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Kilowater — Bureau d'étude en rénovation énergétique",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: "https://kilowater.fr/bureau-d-etude-renovation-energetique",
  },
};

export default function BureauDEtudeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
