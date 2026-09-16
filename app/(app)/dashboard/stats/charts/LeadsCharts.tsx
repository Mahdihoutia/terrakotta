"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, LabelList,
} from "recharts";
import { tooltipStyle } from "./chart-shared";

interface FunnelPoint { statut: string; count: number }
interface MonthlyPoint { label: string; nouveaux: number }
interface SourcePoint { source: string; count: number }
interface ConvPoint { source: string; taux: number; total: number }

const STATUT_LABEL: Record<string, string> = {
  NOUVEAU: "Nouveau", CONTACTE: "Contacté", QUALIFIE: "Qualifié",
  PROPOSITION: "Proposition", GAGNE: "Gagné", PERDU: "Perdu",
};

export function FunnelChart({ data }: { data: FunnelPoint[] }) {
  if (data.every((d) => d.count === 0)) return <EmptyChart />;
  const top = data[0]?.count ?? 0;
  const mapped = data.map((d, i) => {
    const prev = i > 0 ? data[i - 1].count : null;
    const drop = prev && prev > 0 ? ((prev - d.count) / prev) * 100 : null;
    return {
      name: STATUT_LABEL[d.statut] ?? d.statut,
      count: d.count,
      pctOfTop: top > 0 ? (d.count / top) * 100 : 0,
      drop,
    };
  });
  return (
    <div className="space-y-2">
      {mapped.map((row) => (
        <div key={row.name} className="flex items-center gap-3 text-sm">
          <div className="w-28 shrink-0 text-tk-text-muted">{row.name}</div>
          <div className="relative flex-1 overflow-hidden rounded-md bg-tk-hover">
            <div
              className="flex h-7 items-center justify-end rounded-md bg-tk-primary px-2 text-xs font-semibold text-white transition-all"
              style={{ width: `${Math.max(row.pctOfTop, 4)}%` }}
            >
              {row.count}
            </div>
          </div>
          <div className="w-14 shrink-0 text-right text-xs tabular text-tk-text-faint">
            {row.drop !== null ? `−${row.drop.toFixed(0)}%` : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeadsMonthlyChart({ data }: { data: MonthlyPoint[] }) {
  if (data.every((d) => d.nouveaux === 0)) return <EmptyChart />;
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="nouveaux" name="Nouveaux" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LeadsParSourceChart({ data }: { data: SourcePoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  const mapped = data.map((d) => ({ name: formatSource(d.source), count: d.count }));
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mapped} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Leads" fill="#10b981" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConversionParSourceChart({ data }: { data: ConvPoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  const mapped = data.map((d) => ({ name: formatSource(d.source), taux: Math.round(d.taux * 10) / 10 }));
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mapped} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
          <Bar dataKey="taux" name="Taux conv." fill="#8b5cf6" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="taux" position="right" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatSource(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function EmptyChart() {
  return (
    <div className="flex h-[320px] items-center justify-center text-sm text-tk-text-faint">
      Aucune donnée pour cette période
    </div>
  );
}
