import type { Metadata } from "next";

const BASE_URL = "https://kilowater.fr";

export const metadata: Metadata = {
  title: "Bureau d'étude thermique Paris | Kilowater BET RGE",
  description:
    "✓ Bureau d'étude thermique indépendant à Paris ✓ Qualifié RGE & OPQIBI ✓ STD, audit énergétique, conformité RE2020 & Décret Tertiaire. Tertiaire, industrie, copropriétés.",
  keywords: [
    "bureau d'étude thermique",
    "bureau d'étude thermique Paris",
    "BET thermique",
    "BET thermique Paris",
    "bureau d'études thermique indépendant",
    "simulation thermique dynamique",
    "STD",
    "thermique du bâtiment",
    "RE2020",
    "RT2012",
    "bureau d'étude RGE",
    "audit thermique",
  ],
  openGraph: {
    title: "Bureau d'étude thermique Paris | Kilowater",
    description:
      "Bureau d'étude thermique indépendant, qualifié RGE & OPQIBI. Modélisation STD, audit énergétique, conformité RE2020 et Décret Tertiaire.",
    url: `${BASE_URL}/bureau-d-etude-thermique`,
    type: "website",
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Kilowater — Bureau d'étude thermique",
      },
    ],
  },
  alternates: {
    canonical: `${BASE_URL}/bureau-d-etude-thermique`,
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Bureau d'étude thermique",
      item: `${BASE_URL}/bureau-d-etude-thermique`,
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Bureau d'étude thermique",
  provider: {
    "@type": "ProfessionalService",
    name: "Kilowater",
    url: BASE_URL,
  },
  areaServed: [
    { "@type": "City", name: "Paris" },
    { "@type": "AdministrativeArea", name: "Île-de-France" },
    { "@type": "Country", name: "France" },
  ],
  description:
    "Bureau d'étude thermique indépendant spécialisé dans la performance énergétique des bâtiments. Modélisation STD, audit énergétique, conformité RE2020, RT2012, DPE et Décret Tertiaire.",
};

export default function BureauDEtudeThermiqueLayout({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {children}
    </>
  );
}
