import type { Metadata } from "next";
import ServicesPage from "@/components/site/ServicesPage";
import { SITE_URL } from "@/lib/i18n/config";
import { SERVICES_CONTENT } from "@/lib/i18n/content/services";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  title: "Our services — Decarbonisation & energy partner",
  description:
    "Kilowater's integrated offering in France: Energy Efficiency Certificates (EEC) assessments, decarbonisation advisory (carbon footprint, CSRD, French Tertiary Decree) and environmental products brokerage (carbon credits, Guarantees of Origin, biotickets). For co-ownerships, landlords, local authorities, commercial & industrial.",
  openGraph: {
    title: "Our services — Decarbonisation & energy partner | Kilowater",
    description:
      "EEC, decarbonisation advisory and environmental products brokerage: Kilowater's complete value chain, from technical audit to monetisation.",
    url: `${SITE_URL}/en/services`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: getAlternates("services", "en"),
};

export default function ServicesEnPage() {
  return (
    <ServicesPage
      locale="en"
      content={SERVICES_CONTENT.en}
      relatedDict={getDictionary("en").relatedLinks}
    />
  );
}
