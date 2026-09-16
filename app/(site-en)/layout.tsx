import type { Metadata } from "next";
import RootDocument from "@/components/RootDocument";
import SiteShell from "@/components/site/SiteShell";
import { OG_LOCALES, SITE_URL } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";

const SITE_NAME = "Kilowater";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: en.meta.siteTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: en.meta.description,
  keywords: [
    "decarbonisation partner France",
    "Energy Efficiency Certificates",
    "EEC France",
    "carbon footprint assessment",
    "decarbonisation advisory",
    "voluntary carbon credits",
    "Guarantees of Origin",
    "French Tertiary Decree",
    "CSRD advisory France",
    "SBTi pathway",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: OG_LOCALES.en,
    alternateLocale: [OG_LOCALES.fr],
    url: `${SITE_URL}/en`,
    siteName: SITE_NAME,
    title: en.meta.siteTitle,
    description: en.meta.description,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: en.meta.siteTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: en.meta.siteTitle,
    description: en.meta.description,
    creator: "@kilowater",
    images: [`${SITE_URL}/opengraph-image`],
  },
};

/** Root layout du site vitrine anglais (`<html lang="en">`), servi sous `/en`. */
export default function SiteEnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootDocument lang="en">
      <SiteShell locale="en">{children}</SiteShell>
    </RootDocument>
  );
}
