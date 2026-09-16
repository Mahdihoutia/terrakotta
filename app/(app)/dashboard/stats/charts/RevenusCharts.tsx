"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { CHART_PALETTE, tooltipStyle } from "./chart-shared";

interface MonthlyPoint { label: string; emis: number; accepte: number; facture: number; encaisse: number }
interface AgingPoint { bucket: string; count: number; montant: number }
interface TopClientPoint { nom: string; total: number }
interface AcceptationDevis { accepte: number; refuse: number; enCours: number }

function fmtK(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}
function fmtEuro(v: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}

export function RevenusMonthlyChart({ data }: { data: MonthlyPoint[] }) {
  if (data.every((d) => d.emis === 0 && d.facture === 0 && d.encaisse === 0)) return <EmptyChart />;
  return (
    <div className="h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtEuro(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="emis" name="Émis" stroke="#6b7280" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="accepte" name="Accepté" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="facture" name="Facturé" stroke="#3b82f6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="encaisse" name="Encaissé" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AcceptationDevisChart({ data }: { data: AcceptationDevis }) {
  const total = data.accepte + data.refuse + data.enCours;
  if (total === 0) return <EmptyChart />;
  const mapped = [
    { name: "Accepté", value: data.accepte, color: "#10b981" },
    { name: "Refusé", value: data.refuse, color: "#ef4444" },
    { name: "En cours", value: data.enCours, color: "#6b7280" },
  ];
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={mapped} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
            {mapped.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AgingChart({ data }: { data: AgingPoint[] }) {
  if (data.every((d) => d.count === 0)) return <EmptyChart />;
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={fmtK} />
          <Tooltip contentStyle={tooltipStyle}
            formatter={(v, name) => (name === "Montant" ? fmtEuro(Number(v)) : String(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="left" dataKey="count" name="Nombre" fill="#6b7280" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="montant" name="Montant" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopClientsChart({ data }: { data: TopClientPoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 11 }} />
          <YAxis dataKey="nom" type="category" width={140} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtEuro(Number(v))} />
          <Bar dataKey="total" name="CA facturé" fill="#3b82f6" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
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
