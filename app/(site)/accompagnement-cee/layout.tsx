import type { Metadata } from "next";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  title: "Accompagnement CEE — Certificats d'Économies d'Énergie",
  description: "Kilowater, partenaire décarbonation & énergie, vous accompagne dans vos dossiers CEE : calcul kWh cumac, montage de dossier, fiches BAR-TH et BAT-TH, valorisation via mandat EMMY. Pour copropriétés, bailleurs, tertiaire, industrie et collectivités.",
  keywords: [
    "accompagnement CEE",
    "bureau d'étude CEE",
    "certificats d'économies d'énergie",
    "kWh cumac",
    "fiches CEE tertiaire",
    "fiches BAR-TH",
    "fiches BAT-TH",
    "prime énergie rénovation",
    "dossier CEE entreprise",
  ],
  openGraph: {
    title: "Accompagnement CEE — Certificats d'Économies d'Énergie | Kilowater",
    description: "Étude de gisement CEE : calcul kWh cumac, montage dossier, fiches BAR-TH et BAT-TH, valorisation EMMY. Optimisez vos primes CEE, du diagnostic au versement.",
    url: "https://www.kilowater.fr/accompagnement-cee",
    images: [{ url: "https://www.kilowater.fr/opengraph-image", width: 1200, height: 630, alt: "Kilowater — Accompagnement CEE" }],
    type: "website",
  },
  alternates: getAlternates("cee", "fr"),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.kilowater.fr" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Accompagnement CEE",
      item: "https://www.kilowater.fr/accompagnement-cee",
    },
  ],
};

export default function AccompagnementCEELayout({ children }: { children: React.ReactNode }) {
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
