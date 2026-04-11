import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qui sommes-nous — Bureau d'étude Kilowater",
  description:
    "Kilowater est un bureau d'étude indépendant spécialisé en rénovation énergétique. Découvrez notre équipe, nos valeurs, nos qualifications RGE et notre engagement pour la transition énergétique des bâtiments.",
  keywords: [
    "bureau d'étude rénovation énergétique",
    "qualification RGE",
    "ingénieur thermicien",
    "expert rénovation bâtiment",
    "bureau d'études indépendant",
    "transition énergétique",
    "certifications rénovation",
  ],
  openGraph: {
    title: "Qui sommes-nous | Kilowater — Bureau d'étude rénovation",
    description:
      "Découvrez Kilowater : un bureau d'étude indépendant, qualifié RGE, engagé pour la performance énergétique des bâtiments résidentiels et tertiaires.",
    url: "https://kilowater.fr/qui-sommes-nous",
    images: [{ url: "https://kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kilowater.fr/qui-sommes-nous",
  },
};

export default function QuiSommesNousLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
