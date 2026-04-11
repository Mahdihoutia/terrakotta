import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laboratoire d'idées — Conseils rénovation énergétique",
  description:
    "Le blog de Kilowater : conseils pratiques, actualités réglementaires et guides sur la rénovation énergétique, les aides financières (CEE, MaPrimeRénov'), l'isolation et les systèmes de chauffage.",
  keywords: [
    "blog rénovation énergétique",
    "conseils isolation thermique",
    "actualités CEE 2024",
    "guide MaPrimeRénov",
    "pompe à chaleur conseils",
    "réglementation thermique",
    "aides financières rénovation",
  ],
  openGraph: {
    title: "Laboratoire d'idées | Kilowater — Conseils rénovation",
    description:
      "Guides, conseils et actualités rénovation énergétique par les experts Kilowater. CEE, MaPrimeRénov', isolation, chauffage : tout ce qu'il faut savoir.",
    url: "https://kilowater.fr/laboratoire-idees",
    images: [{ url: "https://kilowater.fr/og-image.jpg", width: 1200, height: 630, alt: "Kilowater" }],
    type: "website",
  },
  alternates: {
    canonical: "https://kilowater.fr/laboratoire-idees",
  },
};

export default function LaboratoireLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
