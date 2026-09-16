import type { Metadata } from "next";
import CeePage from "@/components/site/CeePage";
import { SITE_URL } from "@/lib/i18n/config";
import { CEE_CONTENT } from "@/lib/i18n/content/cee";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAlternates, ROUTES } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  title: "Energy Efficiency Certificates (EEC) — Application support",
  description:
    "Kilowater supports your French Energy Efficiency Certificates (EEC) applications: kWh cumac calculation, application filing, BAR-TH and BAT-TH operation sheets, monetisation via EMMY registry mandate. For co-ownerships, landlords, commercial, industrial and local authorities.",
  openGraph: {
    title: "Energy Efficiency Certificates (EEC) — Application support | Kilowater",
    description:
      "EEC assessment: kWh cumac calculation, application filing, BAR-TH and BAT-TH sheets, EMMY monetisation. Optimise your EEC incentives, from diagnosis to payment.",
    url: `${SITE_URL}/en/energy-efficiency-certificates`,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Kilowater — Energy Efficiency Certificates" }],
    type: "website",
  },
  alternates: getAlternates("cee", "en"),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}${ROUTES.en.home}` },
    {
      "@type": "ListItem",
      position: 2,
      name: "Energy Efficiency Certificates (EEC)",
      item: `${SITE_URL}${ROUTES.en.cee}`,
    },
  ],
};

export default function CeeEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CeePage locale="en" content={CEE_CONTENT.en} relatedDict={getDictionary("en").relatedLinks} />
    </>
  );
}
