import type { Metadata } from "next";
import { getAlternates } from "@/lib/i18n/routes";

const URL = "https://www.kilowater.fr/conseil-decarbonation";

export const metadata: Metadata = {
  title: "Conseil en décarbonation — Bilan carbone & trajectoire",
  description:
    "Conseil en décarbonation par Kilowater : bilan carbone scopes 1, 2 & 3, trajectoire de réduction (SBTi), conformité CSRD et décret tertiaire. Pour copropriétés, bailleurs, tertiaire, industrie et collectivités.",
  keywords: [
    "conseil en décarbonation",
    "bilan carbone entreprise",
    "bilan carbone scopes 1 2 3",
    "trajectoire SBTi",
    "conformité CSRD",
    "décret tertiaire OPERAT",
    "plan de décarbonation",
  ],
  alternates: getAlternates("decarbonation", "fr"),
  openGraph: {
    title: "Conseil en décarbonation | Kilowater",
    description:
      "Bilan carbone scopes 1, 2 & 3, trajectoire de réduction et mise en conformité CSRD / décret tertiaire. La montée en gamme après l'audit CEE.",
    url: URL,
    images: [{ url: "https://www.kilowater.fr/opengraph-image", width: 1200, height: 630, alt: "Kilowater — Conseil en décarbonation" }],
    type: "website",
  },
};

export default function ConseilDecarbonationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
