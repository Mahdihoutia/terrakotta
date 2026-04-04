"use client";

import {
  Users,
  TrendingUp,
  Bot,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: string;
  index?: number;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  trending: TrendingUp,
  bot: Bot,
  target: Target,
};

const ICON_COLORS: Record<string, string> = {
  users: "from-[#c2613a] to-[#8b4726]",
  trending: "from-[#d4845a] to-[#a0522d]",
  bot: "from-[#a0522d] to-[#7a3b1e]",
  target: "from-[#c2613a] to-[#a0522d]",
};

export default function KpiCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  index = 0,
}: Props) {
  const Icon = ICON_MAP[icon] ?? Target;
  const isPositive = change !== undefined && change >= 0;
  const gradient = ICON_COLORS[icon] ?? "from-orange-400 to-emerald-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="glass glass-hover group rounded-2xl p-5 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-tk-text-muted">
              {label}
            </p>
            <p className="text-3xl font-bold text-tk-text">{value}</p>
          </div>
          <div className={cn("rounded-2xl bg-gradient-to-br p-3 shadow-lg", gradient)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {isPositive ? (
              <span className="flex items-center gap-0.5 rounded-full bg-tk-primary-light px-2 py-0.5 text-tk-primary">
                <ArrowUpRight className="h-3 w-3" />
                +{change}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-red-400">
                <ArrowDownRight className="h-3 w-3" />
                {change}%
              </span>
            )}
            {changeLabel && (
              <span className="text-tk-text-faint">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
