import DecarbonisationPage from "@/components/site/DecarbonisationPage";
import { DECARBONISATION_CONTENT } from "@/lib/i18n/content/decarbonisation";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function ConseilDecarbonationPage() {
  return (
    <DecarbonisationPage
      locale="fr"
      content={DECARBONISATION_CONTENT.fr}
      relatedDict={getDictionary("fr").relatedLinks}
    />
  );
}
