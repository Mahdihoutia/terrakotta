"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { CHART_PALETTE, tooltipStyle } from "./chart-shared";

interface MonthlyPoint { label: string; deposees: number; accordees: number }
interface TypePoint { type: string; count: number; montant: number }
interface AcceptationAides { accorde: number; refuse: number; enInstruction: number }

const TYPE_LABEL: Record<string, string> = {
  MAPRIMERENOVATION: "MaPrimeRénov'", CEE: "CEE", ECO_PTZ: "Éco-PTZ",
  AIDE_LOCALE: "Aide locale", COUP_DE_POUCE: "Coup de pouce", AUTRE: "Autre",
};

export function AidesMonthlyChart({ data }: { data: MonthlyPoint[] }) {
  if (data.every((d) => d.deposees === 0 && d.accordees === 0)) return <EmptyChart />;
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="deposees" name="Déposées" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="accordees" name="Accordées" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AidesParTypeChart({ data }: { data: TypePoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  const mapped = data.map((d) => ({ name: TYPE_LABEL[d.type] ?? d.type, value: d.count }));
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={mapped} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
            {mapped.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AidesAcceptationChart({ data }: { data: AcceptationAides }) {
  const total = data.accorde + data.refuse + data.enInstruction;
  if (total === 0) return <EmptyChart />;
  const mapped = [
    { name: "Accordé", count: data.accorde },
    { name: "Refusé", count: data.refuse },
    { name: "En instruction", count: data.enInstruction },
  ];
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mapped}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Dossiers" radius={[4, 4, 0, 0]}>
            <Cell fill="#10b981" />
            <Cell fill="#ef4444" />
            <Cell fill="#6b7280" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[320px] items-center justify-center text-sm text-tk-text-faint">
      Aucune donnée pour cette période
    </div>
  );
}
