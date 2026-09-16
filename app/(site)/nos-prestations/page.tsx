import ServicesPage from "@/components/site/ServicesPage";
import { SERVICES_CONTENT } from "@/lib/i18n/content/services";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function NosPrestationsPage() {
  return (
    <ServicesPage
      locale="fr"
      content={SERVICES_CONTENT.fr}
      relatedDict={getDictionary("fr").relatedLinks}
    />
  );
}
