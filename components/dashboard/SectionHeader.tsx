import { cn } from "@/lib/utils";

interface Props {
  kicker?: string;
  title:   string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * En-tête de section réutilisable — hiérarchie SaaS B2B standard :
 * micro-kicker bleu optionnel · titre fort · sous-titre gris · action à droite.
 */
export default function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        {kicker && <p className="section-kicker">{kicker}</p>}
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
