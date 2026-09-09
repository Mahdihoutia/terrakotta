import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contactez-nous — Parlons de votre projet",
  description:
    "Contactez Kilowater, partenaire décarbonation & énergie. Étude de gisement CEE, conseil en décarbonation ou courtage de produits environnementaux : notre équipe vous répond rapidement. Copropriétés, bailleurs, collectivités, tertiaire & industrie.",
  keywords: [
    "contact partenaire décarbonation énergie",
    "contact étude CEE",
    "contact bilan carbone entreprise",
    "prendre rendez-vous décarbonation",
    "contact Kilowater",
  ],
  openGraph: {
    title: "Contactez Kilowater — Parlez-nous de votre projet",
    description:
      "Un besoin d'économies d'énergie, de décarbonation ou de valorisation carbone ? Contactez Kilowater : étude CEE, bilan carbone, courtage environnemental. Réponse rapide.",
    url: "https://www.kilowater.fr/contactez-nous",
    images: [{ url: "https://www.kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://www.kilowater.fr/contactez-nous",
  },
};

export default function ContactezNousLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
