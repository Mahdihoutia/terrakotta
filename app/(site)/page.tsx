import type { Metadata } from "next";
import HomePage from "@/components/site/HomePage";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  alternates: getAlternates("home", "fr"),
};

export default function Home() {
  return <HomePage locale="fr" dict={getDictionary("fr").home} />;
}
