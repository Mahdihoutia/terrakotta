import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bureau d'étude rénovation énergétique Paris | Kilowater BET RGE",
  description:
    "✓ Bureau d'étude rénovation énergétique à Paris ✓ Qualification RGE ✓ Audit énergétique, maîtrise d'œuvre, accompagnement CEE. Tertiaire, industrie, copropriétés. Devis sous 48h.",
  keywords: [
    "bureau d'étude rénovation énergétique",
    "bureau d'étude rénovation énergétique Paris",
    "BET rénovation énergétique",
    "bureau d'étude thermique",
    "bureau d'étude thermique Paris",
    "bureau d'études indépendant",
    "bureau d'étude RGE",
    "bureau d'étude OPQIBI",
    "audit énergétique tertiaire",
    "maîtrise d'œuvre rénovation énergétique",
    "bureau d'étude CEE",
    "BET thermique",
  ],
  openGraph: {
    title: "Bureau d'étude rénovation énergétique Paris | Kilowater BET RGE",
    description:
      "Bureau d'étude rénovation énergétique indépendant, qualifié RGE. Audit, maîtrise d'œuvre et CEE pour tertiaire, industrie et copropriétés. Île-de-France & France entière.",
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
