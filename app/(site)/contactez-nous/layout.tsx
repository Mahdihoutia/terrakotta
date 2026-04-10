import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contactez-nous — Devis et prise de contact",
  description:
    "Contactez Terrakotta pour votre projet de rénovation énergétique. Demande de devis, audit énergétique, maîtrise d'œuvre : notre équipe vous répond rapidement. Particuliers, professionnels et collectivités.",
  keywords: [
    "contact bureau d'étude rénovation",
    "devis audit énergétique",
    "demande de devis rénovation",
    "prendre rendez-vous rénovation énergétique",
    "contact Terrakotta",
  ],
  openGraph: {
    title: "Contactez Terrakotta — Parlez-nous de votre projet",
    description:
      "Un projet de rénovation énergétique ? Contactez Terrakotta pour un audit, un accompagnement CEE ou une mission de maîtrise d'œuvre. Réponse rapide.",
    url: "https://terrakotta.fr/contactez-nous",
    type: "website",
  },
  alternates: {
    canonical: "https://terrakotta.fr/contactez-nous",
  },
};

export default function ContactezNousLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
