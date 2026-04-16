import { Cormorant_Garamond, Manrope } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

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

const SITE_URL = "https://kilowater.fr";
const SITE_NAME = "Kilowater";
const DEFAULT_DESCRIPTION =
  "Kilowater, bureau d'étude spécialisé en rénovation énergétique. Audit énergétique, maîtrise d'œuvre, accompagnement CEE et MaPrimeRénov' pour particuliers, professionnels et collectivités.";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Bureau d'étude en rénovation énergétique`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "bureau d'étude rénovation énergétique",
    "audit énergétique",
    "maîtrise d'œuvre",
    "CEE certificats économies énergie",
    "MaPrimeRénov",
    "isolation thermique",
    "bilan thermique",
    "rénovation bâtiment",
    "DPE",
    "performance énergétique",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Bureau d'étude en rénovation énergétique`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Kilowater — Bureau d'étude en rénovation énergétique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Bureau d'étude en rénovation énergétique`,
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
    "Audit énergétique",
    "Maîtrise d'œuvre",
    "Accompagnement CEE",
    "Accompagnement MaPrimeRénov'",
    "Bilan thermique",
    "Rénovation énergétique",
  ],
  knowsAbout: [
    "Rénovation énergétique",
    "Performance énergétique des bâtiments",
    "Certificats d'économies d'énergie",
    "Isolation thermique",
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
    </div>
  );
}
