import { Cormorant_Garamond, Manrope } from "next/font/google";
import Script from "next/script";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import CookieBanner from "@/components/site/CookieBanner";
import { SITE_URL, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

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

const SITE_NAME = "Kilowater";

// ─── JSON-LD Organisation ──────────────────────────────────────────────
function buildOrganizationSchema(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#organisation`,
    name: SITE_NAME,
    url: SITE_URL,
    description,
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
}

interface Props {
  locale: Locale;
  children: React.ReactNode;
}

/**
 * Habillage commun du site vitrine (polices, JSON-LD, navigation, footer,
 * bannière cookies), partagé par les root layouts FR et EN.
 */
export default function SiteShell({ locale, children }: Props) {
  const dict = getDictionary(locale);

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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildOrganizationSchema(dict.meta.description)),
        }}
      />

      <Navbar locale={locale} dict={dict.nav} switcherDict={dict.languageSwitcher} />
      <main>{children}</main>
      <Footer locale={locale} dict={dict.footer} />
      <CookieBanner locale={locale} dict={dict.cookies} />
    </div>
  );
}
