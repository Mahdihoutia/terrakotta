import type { Metadata } from "next";
import RootDocument from "@/components/RootDocument";
import SiteShell from "@/components/site/SiteShell";
import { OG_LOCALES, SITE_URL } from "@/lib/i18n/config";
import { fr } from "@/lib/i18n/dictionaries/fr";

const SITE_NAME = "Kilowater";
const DEFAULT_DESCRIPTION = fr.meta.description;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Partenaire décarbonation & énergie`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "partenaire décarbonation & énergie",
    "certificats d'économies d'énergie",
    "CEE tertiaire",
    "bilan carbone entreprise",
    "conseil décarbonation",
    "crédits carbone volontaires",
    "garanties d'origine",
    "décret tertiaire",
    "audit énergétique tertiaire",
    "trajectoire SBTi",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: OG_LOCALES.fr,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Partenaire décarbonation & énergie`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Kilowater — Partenaire décarbonation & énergie",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Partenaire décarbonation & énergie`,
    description: DEFAULT_DESCRIPTION,
    creator: "@kilowater",
    images: [`${SITE_URL}/opengraph-image`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

/** Root layout du site vitrine français (`<html lang="fr">`). */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootDocument lang="fr">
      <SiteShell locale="fr">{children}</SiteShell>
    </RootDocument>
  );
}
