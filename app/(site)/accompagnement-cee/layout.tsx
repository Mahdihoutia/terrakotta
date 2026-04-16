import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accompagnement CEE — Certificats d'Économies d'Énergie | Kilowater",
  description: "Kilowater vous accompagne dans vos dossiers CEE : calcul kWh cumac, montage de dossier, fiches BAR-TH et BAT-TH. Bureau d'étude RGE spécialisé en rénovation énergétique.",
  keywords: [
    "accompagnement CEE",
    "bureau d'étude CEE",
    "certificats d'économies d'énergie",
    "kWh cumac",
    "fiches CEE tertiaire",
    "fiches BAR-TH",
    "fiches BAT-TH",
    "prime énergie rénovation",
    "dossier CEE entreprise",
  ],
  openGraph: {
    title: "Accompagnement CEE — Certificats d'Économies d'Énergie | Kilowater",
    description: "Bureau d'étude CEE : calcul kWh cumac, montage dossier, fiches BAR-TH et BAT-TH. Optimisez vos aides à la rénovation énergétique.",
    url: "https://kilowater.fr/accompagnement-cee",
    images: [{ url: "https://kilowater.fr/opengraph-image", width: 1200, height: 630, alt: "Kilowater — Accompagnement CEE" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kilowater.fr/accompagnement-cee",
  },
};

export default function AccompagnementCEELayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
