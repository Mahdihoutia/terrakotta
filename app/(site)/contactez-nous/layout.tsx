import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contactez-nous — Devis et prise de contact",
  description:
    "Contactez Kilowater pour votre projet de rénovation énergétique. Demande de devis, audit énergétique, maîtrise d'œuvre : notre équipe vous répond rapidement. Particuliers, professionnels et collectivités.",
  keywords: [
    "contact bureau d'étude rénovation",
    "devis audit énergétique",
    "demande de devis rénovation",
    "prendre rendez-vous rénovation énergétique",
    "contact Kilowater",
  ],
  openGraph: {
    title: "Contactez Kilowater — Parlez-nous de votre projet",
    description:
      "Un projet de rénovation énergétique ? Contactez Kilowater pour un audit, un accompagnement CEE ou une mission de maîtrise d'œuvre. Réponse rapide.",
    url: "https://kilowater.fr/contactez-nous",
    images: [{ url: "https://kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kilowater.fr/contactez-nous",
  },
};

export default function ContactezNousLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
