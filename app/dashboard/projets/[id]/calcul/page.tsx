import { Calculator } from "lucide-react";
import WorkspaceTabPlaceholder from "@/components/dashboard/WorkspaceTabPlaceholder";

export default function CalculTabPage() {
  return (
    <WorkspaceTabPlaceholder
      icon={<Calculator className="h-5 w-5" />}
      title="Calcul"
      description="Lancement du moteur de calcul thermique (méthode 3CL-DPE). Synthèse des déperditions, besoins par usage, étiquette DPE et note de dimensionnement."
      relatedLinks={[
        { href: "/dashboard/audit", label: "Audit énergétique" },
        { href: "/dashboard/bilan-thermique", label: "Bilan thermique" },
      ]}
    />
  );
}
