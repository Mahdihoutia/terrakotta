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
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8ecf4]">
          Évolution des leads
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-[#5a6478]">
          6 derniers mois
        </span>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA}>
            <defs>
              <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="convertGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <XAxis
              dataKey="mois"
              tick={{ fill: "#5a6478", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#5a6478", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 20, 35, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                color: "#e8ecf4",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              name="Leads entrants"
              stroke="#38bdf8"
              fill="url(#leadGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="convertis"
              name="Convertis"
              stroke="#4ade80"
              fill="url(#convertGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
