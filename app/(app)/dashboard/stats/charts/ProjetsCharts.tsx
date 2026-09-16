"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { CHART_PALETTE, tooltipStyle } from "./chart-shared";

interface MonthlyPoint { label: string; crees: number; livres: number }
interface StatutPoint { statut: string; count: number }
interface CategPoint { categorie: string; count: number }
interface TravauxPoint { type: string; count: number }

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: "En attente", EN_COURS: "En cours", EN_PAUSE: "En pause",
  TERMINE: "Terminé", ANNULE: "Annulé",
};
const CATEG_LABEL: Record<string, string> = {
  PARTICULIER: "Particulier", RESIDENTIEL_COLLECTIF: "Résidentiel coll.",
  TERTIAIRE: "Tertiaire", INDUSTRIE: "Industrie", AGRICULTURE: "Agriculture",
};

export function ProjetsMonthlyChart({ data }: { data: MonthlyPoint[] }) {
  if (data.every((d) => d.crees === 0 && d.livres === 0)) return <EmptyChart />;
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="crees" name="Créés" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="livres" name="Livrés" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProjetsParStatutChart({ data }: { data: StatutPoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  const mapped = data.map((d) => ({ name: STATUT_LABEL[d.statut] ?? d.statut, count: d.count }));
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={mapped}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Projets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProjetsParCategorieChart({ data }: { data: CategPoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  const mapped = data.map((d) => ({ name: CATEG_LABEL[d.categorie] ?? d.categorie, value: d.count }));
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

export function TopTravauxChart({ data }: { data: TravauxPoint[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis dataKey="type" type="category" width={140} tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Projets" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
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
