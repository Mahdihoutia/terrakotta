import { FileOutput } from "lucide-react";
import WorkspaceTabPlaceholder from "@/components/dashboard/WorkspaceTabPlaceholder";

export default function LivrablesTabPage() {
  return (
    <WorkspaceTabPlaceholder
      icon={<FileOutput className="h-5 w-5" />}
      title="Livrables"
      description="Génération et suivi des documents : rapport d'audit, note de dimensionnement, devis, plan de financement des aides. Exports PDF et historique des versions."
      relatedLinks={[
        { href: "/dashboard/documents", label: "Documents" },
        { href: "/dashboard/devis", label: "Devis" },
      ]}
    />
  );
}
