import CeePage from "@/components/site/CeePage";
import { CEE_CONTENT } from "@/lib/i18n/content/cee";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function AccompagnementCEEPage() {
  return (
    <CeePage
      locale="fr"
      content={CEE_CONTENT.fr}
      relatedDict={getDictionary("fr").relatedLinks}
    />
  );
}
