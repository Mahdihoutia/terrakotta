"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DATA = [
  { mois: "Oct", leads: 12, convertis: 4 },
  { mois: "Nov", leads: 18, convertis: 7 },
  { mois: "Déc", leads: 15, convertis: 5 },
  { mois: "Jan", leads: 22, convertis: 9 },
  { mois: "Fév", leads: 28, convertis: 11 },
  { mois: "Mar", leads: 35, convertis: 14 },
];

export default function LeadsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Évolution des leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="mois"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="leads"
                name="Leads entrants"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="convertis"
                name="Convertis"
                stroke="hsl(142 71% 45%)"
                fill="hsl(142 71% 45%)"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
