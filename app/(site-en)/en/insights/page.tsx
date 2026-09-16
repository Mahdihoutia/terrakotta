import type { Metadata } from "next";
import LabPage from "@/components/site/LabPage";
import { SITE_URL } from "@/lib/i18n/config";
import { getLocalizedSummaries } from "@/lib/i18n/articles";
import { LAB_CONTENT } from "@/lib/i18n/content/lab";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  title: "Insights — Decarbonisation & energy",
  description:
    "Kilowater's insights: analysis of Energy Efficiency Certificates, business decarbonisation, carbon footprint, voluntary carbon credits, the French Tertiary Decree and CSRD.",
  openGraph: {
    title: "Insights | Kilowater — Decarbonisation & energy",
    description:
      "Regulation, environmental markets and field experience: analysis by Kilowater for real estate, finance and sustainability leaders.",
    url: `${SITE_URL}/en/insights`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: getAlternates("lab", "en"),
};

export default function InsightsPage() {
  return <LabPage locale="en" content={LAB_CONTENT.en} articles={getLocalizedSummaries("en")} />;
}
