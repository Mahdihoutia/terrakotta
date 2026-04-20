"use client";

import {
  Users,
  TrendingUp,
  Bot,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  FileText,
  HandCoins,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: string;
  index?: number;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  users:      Users,
  trending:   TrendingUp,
  bot:        Bot,
  target:     Target,
  briefcase:  Briefcase,
  filetext:   FileText,
  handcoins:  HandCoins,
  calendar:   CalendarCheck,
  check:      CheckCircle2,
  clock:      Clock,
};

// Accent de la tuile — on garde cohérent mais plus subtil qu'avant.
const ICON_ACCENT: Record<string, string> = {
  users:      "#c2613a",
  trending:   "#2563eb",
  bot:        "#7c3aed",
  target:     "#c2613a",
  briefcase:  "#c2613a",
  filetext:   "#d4845a",
  handcoins:  "#0d9488",
  calendar:   "#3b82f6",
  check:      "#16a34a",
  clock:      "#d4845a",
};

export default function KpiCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  index = 0,
}: Props) {
  const Icon   = ICON_MAP[icon]  ?? Target;
  const accent = ICON_ACCENT[icon] ?? "#2563eb";

  const hasChange   = typeof change === "number";
  const isFlat      = hasChange && Math.abs(change!) < 1;
  const isPositive  = hasChange && change! > 0;
  const changeClass = !hasChange
    ? ""
    : isFlat
    ? "chip"
    : isPositive
    ? "chip chip-success chip-dot"
    : "chip chip-danger chip-dot";

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
    >
      <div
        className="card-premium group relative h-full p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px"
        style={
          {
            // Variable locale pour les effets hover
            ["--accent" as string]: accent,
          } as React.CSSProperties
        }
      >
        {/* Halo subtil au hover */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(120% 80% at 100% 0%, ${accent}12, transparent 55%)`,
          }}
        />

        {/* En-tête : icône + label */}
        <div className="relative flex items-center justify-between">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-tk-text-muted">
            {label}
          </p>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105"
            style={{
              background: `${accent}16`,
              color: accent,
            }}
          >
            <Icon className="h-[15px] w-[15px]" />
          </div>
        </div>

        {/* Valeur principale */}
        <p
          className="tabular relative mt-3 text-[1.85rem] font-bold leading-none tracking-tight text-tk-text"
          style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
        >
          {value}
        </p>

        {/* Variation */}
        {hasChange && (
          <div className="relative mt-3 flex items-center gap-2">
            <span className={cn(changeClass, "!px-2 !py-[2px] !text-[0.66rem]")}>
              {isFlat ? (
                <Minus className="h-3 w-3" />
              ) : isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {isFlat ? "Stable" : `${isPositive ? "+" : ""}${change}%`}
            </span>
            {changeLabel && (
              <span className="text-[0.7rem] text-tk-text-faint">
                {changeLabel}
              </span>
            )}
          </div>
        )}

        {/* Accent bottom line */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-0 rounded-b-xl transition-all duration-300 group-hover:w-full"
          style={{
            background: `linear-gradient(90deg, ${accent}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
