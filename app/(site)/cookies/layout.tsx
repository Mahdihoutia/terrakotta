import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestion des cookies",
  description:
    "Information sur les cookies utilisés par www.kilowater.fr et gestion de vos préférences.",
  alternates: { canonical: "https://www.kilowater.fr/cookies" },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
