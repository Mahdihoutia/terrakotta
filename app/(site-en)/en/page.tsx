import type { Metadata } from "next";
import HomePage from "@/components/site/HomePage";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAlternates } from "@/lib/i18n/routes";

export const metadata: Metadata = {
  alternates: getAlternates("home", "en"),
};

export default function HomeEn() {
  return <HomePage locale="en" dict={getDictionary("en").home} />;
}
