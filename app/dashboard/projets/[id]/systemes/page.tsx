import { Cog } from "lucide-react";
import WorkspaceTabPlaceholder from "@/components/dashboard/WorkspaceTabPlaceholder";

export default function SystemesTabPage() {
  return (
    <WorkspaceTabPlaceholder
      icon={<Cog className="h-5 w-5" />}
      title="Systèmes"
      description="Équipements de chauffage, ECS, ventilation, climatisation et production photovoltaïque rattachés au projet. Rendements, énergies et zones desservies."
    />
  );
}
