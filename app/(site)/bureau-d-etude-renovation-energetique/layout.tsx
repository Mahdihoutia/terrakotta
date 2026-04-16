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

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://kilowater.fr" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Bureau d'étude en rénovation énergétique",
      item: "https://kilowater.fr/bureau-d-etude-renovation-energetique",
    },
  ],
};

export default function BureauDEtudeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
