import type { Metadata } from "next";
import DecarbonisationPage from "@/components/site/DecarbonisationPage";
import { SITE_URL } from "@/lib/i18n/config";
import { DECARBONISATION_CONTENT } from "@/lib/i18n/content/decarbonisation";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  title: "Decarbonisation advisory — Carbon footprint & pathway",
  description:
    "Decarbonisation advisory by Kilowater: scope 1, 2 & 3 carbon footprint, reduction pathway (SBTi), CSRD and French Tertiary Decree compliance. For co-ownerships, landlords, commercial, industrial and local authorities.",
  openGraph: {
    title: "Decarbonisation advisory | Kilowater",
    description:
      "Scope 1, 2 & 3 carbon footprint, reduction pathway and CSRD / French Tertiary Decree compliance. The natural next step after an EEC audit.",
    url: `${SITE_URL}/en/decarbonisation-advisory`,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Kilowater — Decarbonisation advisory" }],
    type: "website",
  },
  alternates: getAlternates("decarbonation", "en"),
};

export default function DecarbonisationEnPage() {
  return (
    <DecarbonisationPage
      locale="en"
      content={DECARBONISATION_CONTENT.en}
      relatedDict={getDictionary("en").relatedLinks}
    />
  );
}
