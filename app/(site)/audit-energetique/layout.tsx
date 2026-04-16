import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit énergétique — Bilan thermique de votre bâtiment | Kilowater",
  description: "Audit énergétique réglementaire et incitatif par Kilowater, bureau d'étude RGE. Diagnostic thermique, DPE, simulation des travaux de rénovation, préconisations chiffrées pour maisons, copropriétés et bâtiments tertiaires.",
  keywords: [
    "audit énergétique",
    "audit énergétique réglementaire",
    "bilan thermique bâtiment",
    "DPE diagnostic performance énergétique",
    "bureau d'étude audit énergétique",
    "audit thermique maison",
    "audit énergétique copropriété",
    "audit énergétique tertiaire",
  ],
  openGraph: {
    title: "Audit énergétique — Bilan thermique | Kilowater",
    description: "Audit énergétique complet par un bureau d'étude RGE. Diagnostic, simulation, préconisations chiffrées.",
    url: "https://kilowater.fr/audit-energetique",
    images: [{ url: "https://kilowater.fr/opengraph-image", width: 1200, height: 630, alt: "Kilowater — Audit énergétique" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kilowater.fr/audit-energetique",
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
      name: "Audit énergétique",
      item: "https://kilowater.fr/audit-energetique",
    },
  ],
};

export default function AuditLayout({ children }: { children: React.ReactNode }) {
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
