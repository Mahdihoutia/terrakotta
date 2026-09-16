import BrokeragePage from "@/components/site/BrokeragePage";
import { BROKERAGE_CONTENT } from "@/lib/i18n/content/brokerage";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function CourtageEnvironnementalPage() {
  return (
    <BrokeragePage
      locale="fr"
      content={BROKERAGE_CONTENT.fr}
      relatedDict={getDictionary("fr").relatedLinks}
    />
  );
}
