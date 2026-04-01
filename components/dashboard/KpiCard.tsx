"use client";

import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {label}
              </p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          {change !== undefined && (
            <div className="mt-3 flex items-center gap-1 text-sm">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  "font-medium",
                  isPositive ? "text-emerald-600" : "text-red-500"
                )}
              >
                {isPositive ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
