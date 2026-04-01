import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  statut: LeadStatus;
}

const STATUS_STYLES: Record<LeadStatus, string> = {
  NOUVEAU: "bg-blue-100 text-blue-800",
  CONTACTE: "bg-yellow-100 text-yellow-800",
  QUALIFIE: "bg-purple-100 text-purple-800",
  PROPOSITION: "bg-orange-100 text-orange-800",
  GAGNE: "bg-emerald-100 text-emerald-800",
  PERDU: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  NOUVEAU: "Nouveau",
  CONTACTE: "Contacté",
  QUALIFIE: "Qualifié",
  PROPOSITION: "Proposition",
  GAGNE: "Gagné",
  PERDU: "Perdu",
};

export default function StatusBadge({ statut }: Props) {
  return (
    <Badge className={cn("font-medium", STATUS_STYLES[statut])}>
      {STATUS_LABELS[statut]}
    </Badge>
  );
}
