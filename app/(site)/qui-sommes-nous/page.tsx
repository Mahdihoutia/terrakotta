import AboutPage from "@/components/site/AboutPage";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function QuiSommesNousPage() {
  const dict = getDictionary("fr");
  return <AboutPage locale="fr" dict={dict.about} relatedDict={dict.relatedLinks} />;
}
