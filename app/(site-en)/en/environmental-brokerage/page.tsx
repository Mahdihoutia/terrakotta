import type { Metadata } from "next";
import BrokeragePage from "@/components/site/BrokeragePage";
import { SITE_URL } from "@/lib/i18n/config";
import { BROKERAGE_CONTENT } from "@/lib/i18n/content/brokerage";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  title: "Environmental products brokerage — Carbon credits, GOs",
  description:
    "Environmental products brokerage by Kilowater: voluntary carbon credits (Label Bas Carbone), Guarantees of Origin and biotickets. An aggregator with rigorous project selection, to guard against greenwashing.",
  openGraph: {
    title: "Environmental products brokerage | Kilowater",
    description:
      "Voluntary carbon credits, Guarantees of Origin and biotickets. An aggregator that selects credible projects — not just matchmaking.",
    url: `${SITE_URL}/en/environmental-brokerage`,
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630, alt: "Kilowater — Environmental brokerage" }],
    type: "website",
  },
  alternates: getAlternates("brokerage", "en"),
};

export default function BrokerageEnPage() {
  return (
    <BrokeragePage
      locale="en"
      content={BROKERAGE_CONTENT.en}
      relatedDict={getDictionary("en").relatedLinks}
    />
  );
}
