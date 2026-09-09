import { Cormorant_Garamond, Manrope } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import CookieBanner from "@/components/site/CookieBanner";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const SITE_URL = "https://www.kilowater.fr";
const SITE_NAME = "Kilowater";
const DEFAULT_DESCRIPTION =
  "Kilowater, partenaire décarbonation & énergie des entreprises. Étude de gisement CEE, conseil en décarbonation (bilan carbone, CSRD, décret tertiaire) et courtage de produits environnementaux (crédits carbone, garanties d'origine, biotickets) pour copropriétés, bailleurs, collectivités et maîtres d'ouvrage tertiaires & industriels.";

export const metadata: Metadata = {
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
    locale: "fr_FR",
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

// ─── JSON-LD Organisation ──────────────────────────────────────────────
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organisation`,
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  telephone: "+33184161178",
  email: "contact@kilowater.fr",
  address: {
    "@type": "PostalAddress",
    streetAddress: "115 Rue Saint-Dominique",
    addressLocality: "Paris",
    postalCode: "75007",
    addressRegion: "Île-de-France",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 48.8606,
    longitude: 2.3114,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
  ],
  priceRange: "€€€",
  areaServed: [
    { "@type": "City", name: "Paris" },
    { "@type": "AdministrativeArea", name: "Île-de-France" },
    { "@type": "Country", name: "France" },
  ],
  sameAs: [
    "https://www.linkedin.com/company/kilowater",
  ],
  serviceType: [
    "Étude de gisement CEE",
    "Certificats d'économies d'énergie",
    "Conseil en décarbonation",
    "Bilan carbone",
    "Courtage de crédits carbone",
    "Garanties d'origine",
    "Audit énergétique tertiaire",
  ],
  knowsAbout: [
    "Certificats d'économies d'énergie",
    "Décarbonation des entreprises",
    "Bilan carbone scopes 1, 2 et 3",
    "Crédits carbone volontaires",
    "Garanties d'origine et biotickets",
    "Décret tertiaire et CSRD",
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      name: "Qualibat RGE",
    },
  ],
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${cormorant.variable} ${manrope.variable} font-body bg-[#FAF8F5] text-[#2C1810] min-h-screen`}
      style={{
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <style>{`
        .font-display { font-family: var(--font-display), Georgia, serif; }
        .font-body { font-family: var(--font-body), system-ui, sans-serif; }
      `}</style>

      {/* JSON-LD — Organisation */}
      <Script
        id="schema-organisation"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <Navbar />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
