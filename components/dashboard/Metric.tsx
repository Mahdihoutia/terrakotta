import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";
type Tone = "default" | "muted" | "pos" | "neg";

interface Props {
  value: number | string | null | undefined;
  unit?: React.ReactNode;
  size?: Size;
  tone?: Tone;
  /** Nombre de décimales pour formatter les number (Intl.NumberFormat fr-FR) */
  decimals?: number;
  /** Suffixe affiché si valeur null/undefined */
  fallback?: string;
  className?: string;
}

const SIZE_CLASS: Record<Size, string> = {
  sm: "metric-sm",
  md: "metric-md",
  lg: "metric-lg",
};

const TONE_CLASS: Record<Tone, string> = {
  default: "",
  muted: "metric-muted",
  pos: "metric-pos",
  neg: "metric-neg",
};

function formatValue(value: number | string, decimals?: number): string {
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals ?? 0,
    maximumFractionDigits: decimals ?? 0,
  }).format(value);
}

export default function Metric({
  value,
  unit,
  size = "md",
  tone = "default",
  decimals,
  fallback = "—",
  className,
}: Props) {
  const isEmpty = value === null || value === undefined || value === "";
  return (
    <span className={cn("metric", SIZE_CLASS[size], TONE_CLASS[tone], className)}>
      <span>{isEmpty ? fallback : formatValue(value as number | string, decimals)}</span>
      {unit && !isEmpty && <span className="unit">{unit}</span>}
    </span>
  );
}
