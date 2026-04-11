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

// Icon background — terracotta / blue tones matching brand palette
const ICON_COLORS: Record<string, { from: string; to: string }> = {
  users:      { from: "#c2613a", to: "#8b4726" },
  trending:   { from: "#2563eb", to: "#1d4ed8" },
  bot:        { from: "#7c3aed", to: "#5b21b6" },
  target:     { from: "#c2613a", to: "#a0522d" },
  briefcase:  { from: "#c2613a", to: "#8b4726" },
  filetext:   { from: "#d4845a", to: "#a0522d" },
  handcoins:  { from: "#0d9488", to: "#0f766e" },
  calendar:   { from: "#3b82f6", to: "#2563eb" },
  check:      { from: "#16a34a", to: "#15803d" },
  clock:      { from: "#d4845a", to: "#c2613a" },
};

export default function KpiCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  index = 0,
}: Props) {
  const Icon    = ICON_MAP[icon]  ?? Target;
  const colors  = ICON_COLORS[icon] ?? { from: "#c2613a", to: "#8b4726" };
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${index * 70}ms`, animationFillMode: "both" }}
    >
      <div className="card-premium group p-5">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p
              className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "#9a8a7c" }}
            >
              {label}
            </p>
            <p
              className="text-[2rem] font-bold leading-none tracking-tight"
              style={{
                color: "#0D1B35",
                fontFamily: "var(--font-body), system-ui, sans-serif",
              }}
            >
              {value}
            </p>
          </div>

          {/* Icon circle */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
              boxShadow: `0 4px 12px ${colors.from}40`,
            }}
          >
            <Icon className="h-[18px] w-[18px] text-white" />
          </div>
        </div>

        {/* Bottom row — change indicator */}
        {change !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-[3px] text-[0.68rem] font-semibold",
                isPositive
                  ? "bg-[#EFF6FF] text-[#1D4ED8]"
                  : "bg-[#FEF2F2] text-[#DC2626]"
              )}
            >
              {isPositive
                ? <ArrowUpRight className="h-3 w-3" />
                : <ArrowDownRight className="h-3 w-3" />}
              {isPositive ? "+" : ""}{change}%
            </span>
            {changeLabel && (
              <span className="text-[0.72rem]" style={{ color: "#9a8a7c" }}>
                {changeLabel}
              </span>
            )}
          </div>
        )}

        {/* Accent bottom line */}
        <div
          className="absolute bottom-0 left-0 h-[2px] w-0 rounded-b-xl transition-all duration-300 group-hover:w-full"
          style={{
            background: `linear-gradient(90deg, ${colors.from}60, transparent)`,
          }}
        />
      </div>
    </div>
  );
}
