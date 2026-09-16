import type { Metadata } from "next";
import RootDocument from "@/components/RootDocument";

export const metadata: Metadata = {
  title: {
    default: "Kilowater — Bureau d'étude en rénovation énergétique",
    template: "%s | Kilowater",
  },
  description:
    "Kilowater, bureau d'étude spécialisé en rénovation énergétique. Audit énergétique, maîtrise d'œuvre, accompagnement CEE et MaPrimeRénov' pour particuliers, professionnels et collectivités.",
  metadataBase: new URL("https://www.kilowater.fr"),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/** Racine des espaces privés (dashboard, auth, dev-preview). */
export default function AppRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootDocument lang="fr">{children}</RootDocument>;
}
