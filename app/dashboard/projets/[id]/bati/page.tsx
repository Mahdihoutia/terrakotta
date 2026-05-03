import { Building2 } from "lucide-react";
import WorkspaceTabPlaceholder from "@/components/dashboard/WorkspaceTabPlaceholder";

export default function BatiTabPage() {
  return (
    <WorkspaceTabPlaceholder
      icon={<Building2 className="h-5 w-5" />}
      title="Bâti"
      description="Arborescence des bâtiments, niveaux et locaux. Saisie des parois (murs, planchers, toitures, menuiseries) et des ponts thermiques associés au projet."
      relatedLinks={[
        { href: "/dashboard/batiments", label: "Bâtiments" },
        { href: "/dashboard/parois", label: "Parois" },
        { href: "/dashboard/materiaux", label: "Matériaux" },
      ]}
    />
  );
}
