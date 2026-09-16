import type { Metadata } from "next";
import ContactPage from "@/components/site/ContactPage";
import { SITE_URL } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  title: "Contact us — Let's talk about your project",
  description:
    "Contact Kilowater, decarbonisation & energy partner in France. Energy Efficiency Certificates (EEC), decarbonisation advisory or environmental products brokerage: our team replies within 48 hours. Co-ownerships, landlords, local authorities, commercial & industrial.",
  openGraph: {
    title: "Contact Kilowater — Tell us about your project",
    description:
      "Need energy savings, decarbonisation or carbon monetisation? Contact Kilowater: EEC assessment, carbon footprint, environmental brokerage. Fast response.",
    url: `${SITE_URL}/en/contact-us`,
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: getAlternates("contact", "en"),
};

export default function ContactUsPage() {
  return (
    <ContactPage
      locale="en"
      dict={getDictionary("en").contact}
      projectTypeValues={getDictionary("fr").contact.form.projectTypes}
    />
  );
}
