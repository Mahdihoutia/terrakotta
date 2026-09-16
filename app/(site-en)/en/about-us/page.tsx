import type { Metadata } from "next";
import AboutPage from "@/components/site/AboutPage";
import { SITE_URL } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  title: "About us — Decarbonisation & energy partner",
  description:
    "Kilowater is the decarbonisation & energy partner for businesses in France: Energy Efficiency Certificates (EEC), decarbonisation advisory and environmental products brokerage, backed by hands-on technical expertise. Discover our model, values and RGE qualifications.",
  openGraph: {
    title: "About us | Kilowater — Decarbonisation & energy partner",
    description:
      "Meet Kilowater: your single partner between energy obligations and the schemes that fund them (EEC, carbon credits, Guarantees of Origin), with genuine hands-on technical expertise.",
    url: `${SITE_URL}/en/about-us`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: getAlternates("about", "en"),
};

export default function AboutUsPage() {
  const dict = getDictionary("en");
  return <AboutPage locale="en" dict={dict.about} relatedDict={dict.relatedLinks} />;
}
