"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const LEADS_PAR_MOIS = [
  { mois: "Oct", leads: 12, convertis: 4, ca: 48000 },
  { mois: "Nov", leads: 18, convertis: 7, ca: 73000 },
  { mois: "Déc", leads: 15, convertis: 5, ca: 55000 },
  { mois: "Jan", leads: 22, convertis: 9, ca: 98000 },
  { mois: "Fév", leads: 28, convertis: 11, ca: 112000 },
  { mois: "Mar", leads: 35, convertis: 14, ca: 124500 },
];

const LEADS_PAR_SOURCE = [
  { name: "Site web", value: 42, color: "#3b82f6" },
  { name: "Recommandation", value: 28, color: "#10b981" },
  { name: "Réseau", value: 18, color: "#8b5cf6" },
  { name: "Démarchage", value: 8, color: "#f59e0b" },
  { name: "Autre", value: 4, color: "#6b7280" },
];

const LEADS_PAR_TYPE = [
  { name: "Particulier", value: 55, color: "#3b82f6" },
  { name: "Professionnel", value: 30, color: "#10b981" },
  { name: "Collectivité", value: 15, color: "#8b5cf6" },
];

const CONVERSION_FUNNEL = [
  { etape: "Nouveaux", count: 130 },
  { etape: "Contactés", count: 95 },
  { etape: "Qualifiés", count: 62 },
  { etape: "Proposition", count: 38 },
  { etape: "Gagnés", count: 24 },
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground">
          Analysez vos performances et indicateurs clés
        </p>
      </div>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="revenus">Revenus</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Leads par mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={LEADS_PAR_MOIS}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar
                        dataKey="leads"
                        name="Leads entrants"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="convertis"
                        name="Convertis"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Répartition par source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={LEADS_PAR_SOURCE}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {LEADS_PAR_SOURCE.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Répartition par type de client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={LEADS_PAR_TYPE}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {LEADS_PAR_TYPE.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Funnel de conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CONVERSION_FUNNEL} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis type="number" />
                    <YAxis dataKey="etape" type="category" width={100} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="count"
                      name="Leads"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">18.5%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Taux de conversion global
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">12 jours</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Durée moyenne du cycle
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">65%</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Taux qualification
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenus" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Chiffre d&apos;affaires mensuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={LEADS_PAR_MOIS}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis dataKey="mois" />
                    <YAxis tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => formatEuro(Number(value))}
                    />
                    <Line
                      type="monotone"
                      dataKey="ca"
                      name="CA"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">510 500 €</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  CA cumulé (6 mois)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">85 083 €</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  CA moyen mensuel
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">21 271 €</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Panier moyen par lead
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
