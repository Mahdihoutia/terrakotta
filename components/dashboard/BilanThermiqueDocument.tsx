"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  Calculator,
  Thermometer,
  Wind,
  Sun,
  Snowflake,
  TrendingUp,
  ExternalLink,
  Layers,
  Boxes,
  FileText,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

interface BatimentLite {
  id: string;
  nom: string;
  zoneClimatique: string;
  zonesCount?: number;
}

interface ZoneResultDto {
  besoinChauffageMWh: number;
  besoinClimMWh: number;
  apportsSolairesMWh: number;
  apportsInternesMWh: number;
  pertesEnveloppeMWh: number;
  pertesVentilationMWh: number;
  heuresSurchauffe?: number;
  puissanceCreteChauffage?: number;
  puissanceCreteClim?: number;
}

interface BilanResult {
  batimentId?: string;
  zoneClimatique?: string;
  total: {
    surface: number;
    besoinChauffageMWh: number;
    besoinClimMWh: number;
    apportsSolairesMWh: number;
    apportsInternesMWh: number;
    pertesEnveloppeMWh: number;
    pertesVentilationMWh: number;
    besoinChauffageKWhM2: number;
    besoinClimKWhM2: number;
  };
  zones: Array<{
    id: string;
    nom: string;
    usage?: string;
    surface: number;
    result: ZoneResultDto;
  }>;
}

interface BatimentDetail {
  id: string;
  nom: string;
  zoneClimatique: string;
  altitude?: number | null;
  zones: Array<{
    id: string;
    nom: string;
    usage?: string | null;
    surface: number;
    parois: Array<{
      id: string;
      surface: number;
      orientation: string | null;
      paroi?: {
        id: string;
        nom: string;
        type: string;
        uCache: number | null;
      };
    }>;
  }>;
}

function safeNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return 0;
}

interface DocumentRecord {
  id: string;
  titre: string;
  reference: string;
  type: string;
  statut: string;
  clientNom: string | null;
  donnees: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onBack: () => void;
  onSaved?: () => void;
  existingDoc?: DocumentRecord | null;
}

type StepKey = "prerequis" | "selection" | "calcul" | "rapport";

export default function BilanThermiqueDocument({ onBack, onSaved, existingDoc }: Props) {
  const [batiments, setBatiments] = useState<BatimentLite[]>([]);
  const [materiauxCount, setMateriauxCount] = useState<number | null>(null);
  const [paroisCount, setParoisCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [bilan, setBilan] = useState<BilanResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [docId, setDocId] = useState<string | null>(existingDoc?.id ?? null);
  const [titre, setTitre] = useState(existingDoc?.titre ?? "");
  const [reference, setReference] = useState(existingDoc?.reference ?? "");

  // ─── Charge en parallèle matériaux / parois / bâtiments ───────
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/materiaux").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/parois").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/batiments").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([mats, parois, bats]) => {
        if (cancelled) return;
        setMateriauxCount(Array.isArray(mats) ? mats.length : 0);
        setParoisCount(Array.isArray(parois) ? parois.length : 0);
        setBatiments(Array.isArray(bats) ? bats : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ─── Restaure le bilan d'un document existant ────
  useEffect(() => {
    if (!existingDoc?.donnees) return;
    try {
      const parsed = JSON.parse(existingDoc.donnees);
      if (parsed.batimentId) setSelectedId(parsed.batimentId);
      const candidate = parsed.bilan ?? parsed;
      if (candidate && typeof candidate === "object" && candidate.total) {
        setBilan(candidate as BilanResult);
      }
    } catch {
      /* ignore */
    }
  }, [existingDoc]);

  async function handleCalculer() {
    if (!selectedId) {
      toast.error("Sélectionnez d'abord un bâtiment");
      return;
    }
    setComputing(true);
    setBilan(null);
    try {
      const res = await fetch(`/api/batiments/${selectedId}/calculer`, {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) {
        await showApiError(res, "Calcul du bilan impossible");
        return;
      }
      const data = (await res.json()) as BilanResult;
      setBilan(data);
      const bat = batiments.find((b) => b.id === selectedId);
      if (bat && !titre) {
        setTitre(`Bilan thermique — ${bat.nom}`);
      }
      if (!reference) {
        setReference(`BT-${new Date().getFullYear()}-${Date.now().toString(36).slice(-4).toUpperCase()}`);
      }
      toast.success("Bilan calculé");
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setComputing(false);
    }
  }

  async function handleSave() {
    if (!bilan) {
      toast.error("Calculez le bilan avant d'enregistrer");
      return;
    }
    if (!titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    setSaving(true);
    try {
      const ref = reference || `BT-${Date.now().toString(36).toUpperCase()}`;
      const donnees = JSON.stringify({
        batimentId: selectedId,
        bilan,
        savedAt: new Date().toISOString(),
      });
      const url = docId ? `/api/documents/${docId}` : "/api/documents";
      const method = docId ? "PATCH" : "POST";
      const body = docId
        ? JSON.stringify({ titre, reference: ref, donnees, statut: "TERMINE" })
        : JSON.stringify({
            titre,
            reference: ref,
            type: "BILAN_THERMIQUE",
            statut: "TERMINE",
            clientNom: null,
            donnees,
          });
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        await showApiError(res, "Enregistrement impossible");
        return;
      }
      if (!docId) {
        const created = await res.json();
        setDocId(created.id);
      }
      toast.success("Bilan enregistré");
      onSaved?.();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePDF() {
    if (!bilan) return;
    setGeneratingPDF(true);
    try {
      // Récupère le détail complet du bâtiment (zones + parois)
      let detail: BatimentDetail | null = null;
      if (selectedId) {
        try {
          const res = await fetch(`/api/batiments/${selectedId}`, { cache: "no-store" });
          if (res.ok) detail = (await res.json()) as BatimentDetail;
        } catch {
          /* ignore — on génère sans détail */
        }
      }
      const bat = batiments.find((b) => b.id === selectedId);
      const ref = reference || `BT-${Date.now().toString(36).toUpperCase()}`;
      await generateBilanPDF(bilan, bat ?? null, detail, ref);
      toast.success("PDF téléchargé");
    } catch (err) {
      showNetworkError(err, "Erreur lors de la génération du PDF");
    } finally {
      setGeneratingPDF(false);
    }
  }

  const selectedBat = batiments.find((b) => b.id === selectedId);

  // ─── État des pré-requis ──────────────────────────
  const matsOk = (materiauxCount ?? 0) > 0;
  const paroisOk = (paroisCount ?? 0) > 0;
  const batsOk = batiments.length > 0;
  const allReady = matsOk && paroisOk && batsOk;

  // ─── Étape courante (stepper) ─────────────────────
  const currentStep: StepKey = !allReady
    ? "prerequis"
    : !selectedId
      ? "selection"
      : !bilan
        ? "calcul"
        : "rapport";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <div className="rounded-lg p-2 bg-orange-500/10 text-orange-700">
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {existingDoc ? "Modifier le bilan thermique" : "Nouveau bilan thermique"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Simulation horaire 8760h sur un bâtiment multi-zones (méthode 5R1C)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={generatingPDF || !bilan}
          >
            {generatingPDF ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1 h-3.5 w-3.5" />
            )}
            Générer le PDF
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !bilan}>
            {saving ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1 h-3.5 w-3.5" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <Stepper current={currentStep} />

      {loading ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de vos bibliothèques…
            </div>
          </CardContent>
        </Card>
      ) : !allReady ? (
        <PrerequisitesPanel
          materiauxCount={materiauxCount ?? 0}
          paroisCount={paroisCount ?? 0}
          batimentsCount={batiments.length}
        />
      ) : (
        <>
          {/* Sélection bâtiment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Choix du bâtiment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Bâtiment à analyser
                  </label>
                  <select
                    value={selectedId}
                    onChange={(e) => { setSelectedId(e.target.value); setBilan(null); }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— Choisir —</option>
                    {batiments.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nom} (Zone {b.zoneClimatique})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCalculer} disabled={!selectedId || computing} className="w-full">
                    {computing ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Calculator className="mr-1 h-3.5 w-3.5" />
                    )}
                    Lancer le calcul (8760h)
                  </Button>
                </div>
              </div>

              {selectedBat && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Titre du document
                    </label>
                    <input
                      type="text"
                      value={titre}
                      onChange={(e) => setTitre(e.target.value)}
                      placeholder={`Bilan thermique — ${selectedBat.nom}`}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Référence
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="BT-2026-XXX"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résultats du bilan */}
          {bilan && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Bilan annuel
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    Surface totale : {safeNum(bilan.total?.surface).toFixed(0)} m²
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Kpi
                    icon={<Thermometer className="h-4 w-4" />}
                    label="Besoin chauffage"
                    value={`${safeNum(bilan.total?.besoinChauffageMWh).toFixed(1)} MWh/an`}
                    sub={`${safeNum(bilan.total?.besoinChauffageKWhM2).toFixed(0)} kWh/m²·an`}
                    tone="orange"
                  />
                  <Kpi
                    icon={<Snowflake className="h-4 w-4" />}
                    label="Besoin clim"
                    value={`${safeNum(bilan.total?.besoinClimMWh).toFixed(1)} MWh/an`}
                    sub={`${safeNum(bilan.total?.besoinClimKWhM2).toFixed(0)} kWh/m²·an`}
                    tone="blue"
                  />
                  <Kpi
                    icon={<Sun className="h-4 w-4" />}
                    label="Apports solaires"
                    value={`${safeNum(bilan.total?.apportsSolairesMWh).toFixed(1)} MWh/an`}
                    sub="Gratuits (vitrages)"
                    tone="amber"
                  />
                  <Kpi
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Apports internes"
                    value={`${safeNum(bilan.total?.apportsInternesMWh).toFixed(1)} MWh/an`}
                    sub="Occupants + équip."
                    tone="violet"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Pertes enveloppe
                    </p>
                    <p className="mt-1 text-xl font-semibold">{safeNum(bilan.total?.pertesEnveloppeMWh).toFixed(1)} MWh/an</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Wind className="h-3 w-3" /> Pertes ventilation
                    </p>
                    <p className="mt-1 text-xl font-semibold">{safeNum(bilan.total?.pertesVentilationMWh).toFixed(1)} MWh/an</p>
                  </div>
                </div>

                {bilan.zones.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Détail par zone</h4>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Zone</th>
                            <th className="text-right px-3 py-2 font-medium">Surface</th>
                            <th className="text-right px-3 py-2 font-medium">Chauffage</th>
                            <th className="text-right px-3 py-2 font-medium">Clim</th>
                            <th className="text-right px-3 py-2 font-medium">P. crête ch.</th>
                            <th className="text-right px-3 py-2 font-medium">H. surchauffe</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {bilan.zones.map((z) => {
                            const r = z.result ?? ({} as ZoneResultDto);
                            const surchauffe = safeNum(r.heuresSurchauffe);
                            return (
                              <tr key={z.id} className="hover:bg-muted/30">
                                <td className="px-3 py-2 font-medium">{z.nom}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{safeNum(z.surface).toFixed(0)} m²</td>
                                <td className="px-3 py-2 text-right tabular-nums">{safeNum(r.besoinChauffageMWh).toFixed(1)} MWh</td>
                                <td className="px-3 py-2 text-right tabular-nums">{safeNum(r.besoinClimMWh).toFixed(1)} MWh</td>
                                <td className="px-3 py-2 text-right tabular-nums">{safeNum(r.puissanceCreteChauffage).toFixed(1)} kW</td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  <span className={surchauffe > 100 ? "text-amber-600 font-medium" : ""}>
                                    {surchauffe.toFixed(0)} h
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground italic">
                  Méthode 5R1C ISO 13790 simplifiée — météo synthétique par zone climatique, simulation 8760h.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────

const STEPS: Array<{ key: StepKey; label: string }> = [
  { key: "prerequis", label: "Pré-requis" },
  { key: "selection", label: "Sélection" },
  { key: "calcul", label: "Calcul" },
  { key: "rapport", label: "Rapport" },
];

function Stepper({ current }: { current: StepKey }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <ol className="flex items-center gap-2 text-xs">
        {STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={[
                  "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : active
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground",
                ].join(" ")}
              >
                {done ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
              </span>
              <span
                className={[
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 mx-1" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Pré-requis ──────────────────────────────────────────────────

function PrerequisitesPanel({
  materiauxCount,
  paroisCount,
  batimentsCount,
}: {
  materiauxCount: number;
  paroisCount: number;
  batimentsCount: number;
}) {
  const items = [
    {
      key: "materiaux",
      icon: <Layers className="h-4 w-4" />,
      label: "Matériaux",
      count: materiauxCount,
      hint: "Importez votre bibliothèque de matériaux (lambda, épaisseur, masse).",
      href: "/dashboard/materiaux",
      cta: "Aller aux matériaux",
    },
    {
      key: "parois",
      icon: <Boxes className="h-4 w-4" />,
      label: "Parois",
      count: paroisCount,
      hint: "Composez vos parois en empilant les couches de matériaux (U calculé automatiquement).",
      href: "/dashboard/parois",
      cta: "Aller aux parois",
    },
    {
      key: "batiments",
      icon: <Building2 className="h-4 w-4" />,
      label: "Bâtiments",
      count: batimentsCount,
      hint: "Créez un bâtiment, ses zones et associez-y vos parois avec orientation et surface.",
      href: "/dashboard/batiments",
      cta: "Aller aux bâtiments",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Pré-requis du bilan thermique
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Le calcul s&apos;appuie sur la chaîne <span className="font-medium">Matériaux → Parois → Bâtiments</span>.
          Complétez chaque bibliothèque avant de lancer la simulation.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => {
          const ok = it.count > 0;
          return (
            <div
              key={it.key}
              className={[
                "flex items-center gap-3 rounded-lg border p-3",
                ok ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40",
              ].join(" ")}
            >
              <div
                className={[
                  "rounded-md p-2",
                  ok ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700",
                ].join(" ")}
              >
                {it.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{it.label}</p>
                  <Badge
                    variant="outline"
                    className={[
                      "text-[10px]",
                      ok
                        ? "border-emerald-300 text-emerald-700"
                        : "border-amber-300 text-amber-700",
                    ].join(" ")}
                  >
                    {ok ? `${it.count} disponible${it.count > 1 ? "s" : ""}` : "À compléter"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{it.hint}</p>
              </div>
              <Link href={it.href}>
                <Button variant={ok ? "ghost" : "outline"} size="sm">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  {it.cta}
                </Button>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── KPI card ────────────────────────────────────────────────────

function Kpi({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "orange" | "blue" | "amber" | "violet";
}) {
  const tones: Record<string, string> = {
    orange: "bg-orange-50 border-orange-200 text-orange-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    violet: "bg-violet-50 border-violet-200 text-violet-900",
  };
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-bold">{value}</p>
      <p className="text-[11px] opacity-70">{sub}</p>
    </div>
  );
}

// ─── PDF Generation ──────────────────────────────────────────────

async function generateBilanPDF(
  bilan: BilanResult,
  batiment: BatimentLite | null,
  detail: BatimentDetail | null,
  reference: string,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const {
    drawCoverPage,
    drawSectionHeader,
    drawFooter,
    needsPageBreak,
    resetTextState,
    sanitizePdfText,
    formatNumberPdf,
    PDF_LAYOUT,
    PDF_COLORS,
  } = await import("@/lib/pdf-styles");

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = PDF_LAYOUT.margin;
  const contentWidth = pageWidth - margin * 2;

  const fmt1 = (n: number) =>
    formatNumberPdf(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt0 = (n: number) =>
    formatNumberPdf(n, { maximumFractionDigits: 0 });
  const txt = (s: string | null | undefined) => sanitizePdfText((s ?? "").trim());

  const batNom = batiment?.nom ?? bilan.batimentId ?? "Bâtiment";
  const zoneClim = batiment?.zoneClimatique ?? bilan.zoneClimatique ?? "—";
  const totalSurface = safeNum(bilan.total?.surface);
  const nbZones = bilan.zones?.length ?? 0;

  // ─── Page 1 — Couverture ───────────────────────────────────
  drawCoverPage(
    doc,
    "Bilan thermique",
    `${batNom} — Zone climatique ${zoneClim}`,
    [
      ["Référence", reference],
      ["Date", new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })],
      ["Surface totale", `${fmt0(totalSurface)} m²`],
      ["Zones thermiques", `${nbZones}`],
      ["Méthode", "ISO 13790 — 5R1C — 8760h"],
    ],
    reference,
  );

  // ─── Page 2 — Synthèse exécutive ───────────────────────────
  doc.addPage();
  let y: number = PDF_LAYOUT.topMargin;

  y = drawSectionHeader(
    doc,
    "Synthèse",
    y,
    "Vue d'ensemble des besoins et apports énergétiques annuels.",
    { number: 1 },
  );
  y += 4;

  // 4 KPI cards en grille 2x2
  const kpis: Array<{
    label: string;
    value: string;
    sub: string;
    color: [number, number, number];
  }> = [
    {
      label: "Besoin chauffage",
      value: `${fmt1(safeNum(bilan.total?.besoinChauffageMWh))} MWh/an`,
      sub: `${fmt0(safeNum(bilan.total?.besoinChauffageKWhM2))} kWh/m²·an`,
      color: [234, 88, 12], // orange-600
    },
    {
      label: "Besoin clim",
      value: `${fmt1(safeNum(bilan.total?.besoinClimMWh))} MWh/an`,
      sub: `${fmt0(safeNum(bilan.total?.besoinClimKWhM2))} kWh/m²·an`,
      color: [37, 99, 235], // blue-600
    },
    {
      label: "Apports solaires",
      value: `${fmt1(safeNum(bilan.total?.apportsSolairesMWh))} MWh/an`,
      sub: "Gratuits (vitrages)",
      color: [217, 119, 6], // amber-600
    },
    {
      label: "Apports internes",
      value: `${fmt1(safeNum(bilan.total?.apportsInternesMWh))} MWh/an`,
      sub: "Occupants + équipements",
      color: [124, 58, 237], // violet-600
    },
  ];

  const gap = 5;
  const cardW = (contentWidth - gap) / 2;
  const cardH = 28;
  for (let i = 0; i < kpis.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = margin + col * (cardW + gap);
    const cy = y + row * (cardH + gap);
    const k = kpis[i];

    // Fond
    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, cy, cardW, cardH, 1.5, 1.5, "FD");
    // Filet coloré à gauche
    doc.setFillColor(...k.color);
    doc.rect(cx, cy, 1.8, cardH, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(sanitizePdfText(k.label.toUpperCase()), cx + 6, cy + 6);

    // Valeur
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(sanitizePdfText(k.value), cx + 6, cy + 15);

    // Sub
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.body);
    doc.text(sanitizePdfText(k.sub), cx + 6, cy + 22);
  }
  y += 2 * (cardH + gap) + 4;

  // Bloc méthode
  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.blue);
  doc.text("MÉTHODE", margin + 5, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.body);
  const methodeLines = doc.splitTextToSize(
    sanitizePdfText(
      `Simulation horaire 8760h selon ISO 13790 (modèle 5R1C simplifié) — météo synthétique pour la zone climatique ${zoneClim}. Apports solaires calculés par orientation des vitrages, apports internes selon scénario d'occupation par zone.`,
    ),
    contentWidth - 10,
  ) as string[];
  doc.text(methodeLines, margin + 5, y + 11);
  y += 22;

  // ─── Page 3 — Bilan énergétique ────────────────────────────
  doc.addPage();
  y = PDF_LAYOUT.topMargin;
  y = drawSectionHeader(
    doc,
    "Bilan énergétique annuel",
    y,
    "Décomposition des besoins, pertes et apports gratuits.",
    { number: 2 },
  );
  y += 2;

  const t = bilan.total;
  const besoinTotal = safeNum(t?.besoinChauffageMWh) + safeNum(t?.besoinClimMWh);
  const pertesTotal = safeNum(t?.pertesEnveloppeMWh) + safeNum(t?.pertesVentilationMWh);
  const apportsTotal = safeNum(t?.apportsSolairesMWh) + safeNum(t?.apportsInternesMWh);

  function pct(v: number, total: number): string {
    if (total <= 0) return "—";
    return `${formatNumberPdf((v / total) * 100, { maximumFractionDigits: 1 })} %`;
  }

  const bilanRows: string[][] = [
    [
      "Besoins de chauffage",
      `${fmt1(safeNum(t?.besoinChauffageMWh))} MWh/an`,
      pct(safeNum(t?.besoinChauffageMWh), besoinTotal),
    ],
    [
      "Besoins de climatisation",
      `${fmt1(safeNum(t?.besoinClimMWh))} MWh/an`,
      pct(safeNum(t?.besoinClimMWh), besoinTotal),
    ],
    [
      "Pertes par l'enveloppe",
      `${fmt1(safeNum(t?.pertesEnveloppeMWh))} MWh/an`,
      pct(safeNum(t?.pertesEnveloppeMWh), pertesTotal),
    ],
    [
      "Pertes par ventilation",
      `${fmt1(safeNum(t?.pertesVentilationMWh))} MWh/an`,
      pct(safeNum(t?.pertesVentilationMWh), pertesTotal),
    ],
    [
      "Apports solaires (gratuits)",
      `${fmt1(safeNum(t?.apportsSolairesMWh))} MWh/an`,
      pct(safeNum(t?.apportsSolairesMWh), apportsTotal),
    ],
    [
      "Apports internes (gratuits)",
      `${fmt1(safeNum(t?.apportsInternesMWh))} MWh/an`,
      pct(safeNum(t?.apportsInternesMWh), apportsTotal),
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Poste", "Valeur", "Part"]],
    body: bilanRows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: PDF_COLORS.body,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: PDF_COLORS.navy,
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: PDF_COLORS.surface },
    columnStyles: {
      0: { cellWidth: contentWidth - 80, fontStyle: "bold", textColor: PDF_COLORS.heading },
      1: { cellWidth: 45, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;
  resetTextState(doc);

  // Mini répartition par zone (barres horizontales)
  if (bilan.zones.length > 0) {
    if (needsPageBreak(y, 60)) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(sanitizePdfText("Répartition des besoins de chauffage par zone"), margin, y);
    y += 4;

    const maxBesoin = bilan.zones.reduce(
      (m, z) => Math.max(m, safeNum(z.result?.besoinChauffageMWh)),
      0,
    );
    const barMaxW = contentWidth - 80;
    for (const z of bilan.zones) {
      const v = safeNum(z.result?.besoinChauffageMWh);
      const w = maxBesoin > 0 ? (v / maxBesoin) * barMaxW : 0;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...PDF_COLORS.body);
      const label = sanitizePdfText(z.nom);
      const truncated = doc.getTextWidth(label) > 60 ? label.slice(0, 22) + "…" : label;
      doc.text(truncated, margin, y + 3.5);

      // Track
      doc.setFillColor(...PDF_COLORS.surface);
      doc.rect(margin + 65, y, barMaxW, 5, "F");
      // Bar
      doc.setFillColor(234, 88, 12);
      doc.rect(margin + 65, y, w, 5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.heading);
      doc.text(`${fmt1(v)} MWh`, pageWidth - margin, y + 3.5, { align: "right" });
      y += 7;

      if (needsPageBreak(y, 10)) {
        doc.addPage();
        y = PDF_LAYOUT.topMargin;
      }
    }
    y += 4;
  }

  // ─── Page(s) 4+ — Détail par zone ──────────────────────────
  for (let zi = 0; zi < bilan.zones.length; zi++) {
    const z = bilan.zones[zi];
    const detailZone = detail?.zones.find((dz) => dz.id === z.id) ?? null;
    const r = z.result ?? ({} as ZoneResultDto);

    doc.addPage();
    y = PDF_LAYOUT.topMargin;
    y = drawSectionHeader(
      doc,
      `Zone : ${txt(z.nom)}${z.usage ? ` (${txt(z.usage)})` : ""}`,
      y,
      undefined,
      { kicker: `ZONE ${String(zi + 1).padStart(2, "0")} / ${String(bilan.zones.length).padStart(2, "0")}` },
    );
    y += 2;

    // Tableau récap
    const recap: string[][] = [
      ["Surface", `${fmt0(safeNum(z.surface))} m²`],
      ["Besoin chauffage", `${fmt1(safeNum(r.besoinChauffageMWh))} MWh/an`],
      ["Besoin clim", `${fmt1(safeNum(r.besoinClimMWh))} MWh/an`],
      ["Puissance crête chauffage", `${fmt1(safeNum(r.puissanceCreteChauffage))} kW`],
      ["Puissance crête clim", `${fmt1(safeNum(r.puissanceCreteClim))} kW`],
      ["Heures de surchauffe", `${fmt0(safeNum(r.heuresSurchauffe))} h`],
      ["Apports solaires", `${fmt1(safeNum(r.apportsSolairesMWh))} MWh/an`],
      ["Apports internes", `${fmt1(safeNum(r.apportsInternesMWh))} MWh/an`],
      ["Pertes enveloppe", `${fmt1(safeNum(r.pertesEnveloppeMWh))} MWh/an`],
      ["Pertes ventilation", `${fmt1(safeNum(r.pertesVentilationMWh))} MWh/an`],
    ];

    autoTable(doc, {
      startY: y,
      body: recap,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
        textColor: PDF_COLORS.body,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.15,
      },
      alternateRowStyles: { fillColor: PDF_COLORS.surface },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70, textColor: PDF_COLORS.heading },
        1: { halign: "right", cellWidth: contentWidth - 70 },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6;

    // Détail des parois si dispo
    if (detailZone && detailZone.parois.length > 0) {
      if (needsPageBreak(y, 30)) {
        doc.addPage();
        y = PDF_LAYOUT.topMargin;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.heading);
      doc.text(sanitizePdfText("Détail des parois"), margin, y);
      y += 3;

      const paroisRows: string[][] = detailZone.parois.map((zp) => {
        const surface = safeNum(zp.surface);
        const u = safeNum(zp.paroi?.uCache);
        const pertes = u * surface; // W/K
        return [
          txt(zp.paroi?.nom) || "—",
          txt(zp.paroi?.type) || "—",
          txt(zp.orientation) || "—",
          `${fmt0(surface)} m²`,
          u > 0 ? formatNumberPdf(u, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—",
          `${fmt1(pertes)} W/K`,
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [["Paroi", "Type", "Orientation", "Surface", "U (W/m²·K)", "Pertes (W/K)"]],
        body: paroisRows,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8.5,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          textColor: PDF_COLORS.body,
          lineColor: PDF_COLORS.border,
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: PDF_COLORS.surface,
          textColor: PDF_COLORS.heading,
          fontStyle: "bold",
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: "bold", textColor: PDF_COLORS.heading },
          1: { cellWidth: 28 },
          2: { cellWidth: 24 },
          3: { cellWidth: 20, halign: "right" },
          4: { cellWidth: 24, halign: "right" },
          5: { cellWidth: contentWidth - 50 - 28 - 24 - 20 - 24, halign: "right" },
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (needsPageBreak(y, 12)) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(
      sanitizePdfText("Méthode 5R1C ISO 13790 — simulation horaire 8760h."),
      margin,
      y,
    );
  }

  // ─── Page finale — Méthode et hypothèses ───────────────────
  doc.addPage();
  y = PDF_LAYOUT.topMargin;
  y = drawSectionHeader(
    doc,
    "Méthode et hypothèses",
    y,
    "Cadre normatif et choix de modélisation retenus.",
    { number: 99, kicker: "ANNEXE" },
  );
  y += 2;

  const paragraphs: Array<[string, string]> = [
    [
      "Modèle thermique",
      "Le bilan repose sur le modèle 5R1C de la norme ISO 13790, simplifié à un nœud capacitif par zone. Cinq résistances thermiques modélisent l'enveloppe (transmission), la ventilation, la masse intérieure et les surfaces internes/externes.",
    ],
    [
      "Pas de temps",
      "La simulation est effectuée au pas horaire sur l'année entière (8760 heures). Les besoins de chauffage et de climatisation sont calculés instantanément en fonction des consignes par zone, puis intégrés.",
    ],
    [
      "Météo",
      `Météo synthétique générée pour la zone climatique ${zoneClim} (températures, rayonnement diffus et direct par orientation, vitesse de vent). Source : modèles paramétriques calibrés sur les fichiers TRY (Test Reference Year).`,
    ],
    [
      "Apports gratuits",
      "Apports solaires calculés par orientation des vitrages, avec un facteur g standard (0.5) et un coefficient d'ombrage moyen. Apports internes intégrés selon le scénario d'occupation et la densité d'occupation paramétrée par zone (occupants, équipements, éclairage).",
    ],
    [
      "Ventilation",
      "Débit constant en m³/h·m² (paramétré par zone) — efficacité de récupération de chaleur prise en compte si VMC double flux déclarée.",
    ],
    [
      "Limites du modèle",
      "Les ponts thermiques linéiques ne sont pas modélisés explicitement (à intégrer en majoration des U si nécessaire). L'inertie est représentée par un seul nœud capacitif équivalent par zone.",
    ],
  ];

  for (const [title, body] of paragraphs) {
    if (needsPageBreak(y, 24)) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(sanitizePdfText(title), margin, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.body);
    const lines = doc.splitTextToSize(sanitizePdfText(body), contentWidth) as string[];
    for (const line of lines) {
      if (needsPageBreak(y, 5)) {
        doc.addPage();
        y = PDF_LAYOUT.topMargin;
      }
      doc.text(line, margin, y);
      y += 4.2;
    }
    y += 4;
  }

  // Mention finale
  if (needsPageBreak(y, 14)) {
    doc.addPage();
    y = PDF_LAYOUT.topMargin;
  }
  doc.setFillColor(...PDF_COLORS.surface);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.bodyLight);
  doc.text(
    sanitizePdfText(
      `Document généré par Kilowater le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.`,
    ),
    margin + 4,
    y + 6.5,
  );

  // ─── Footers (toutes les pages sauf la couverture) ─────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Bilan thermique", reference, i - 1, totalPages - 1);
  }

  const safeName = batNom.replace(/[^a-zA-Z0-9-_]+/g, "_");
  const filename = `Bilan_thermique_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
