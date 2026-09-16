import LabPage from "@/components/site/LabPage";
import { LAB_CONTENT } from "@/lib/i18n/content/lab";
import { getLocalizedSummaries } from "@/lib/i18n/articles";

export default function LaboratoireIdeesPage() {
  return <LabPage locale="fr" content={LAB_CONTENT.fr} articles={getLocalizedSummaries("fr")} />;
}
