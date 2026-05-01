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
} from "lucide-react";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";

interface BatimentLite {
  id: string;
  nom: string;
  zoneClimatique: string;
  zonesCount?: number;
}

interface BilanResult {
  totalSurface: number;
  totalChauffageMWh: number;
  totalClimMWh: number;
  totalApportsSolairesMWh: number;
  totalApportsInternesMWh: number;
  totalPertesEnveloppeMWh: number;
  totalPertesVentilationMWh: number;
  ratios: {
    chauffageKwhM2An: number;
    climKwhM2An: number;
  };
  zones: Array<{
    id: string;
    nom: string;
    surface: number;
    besoinChauffageMWh: number;
    besoinClimMWh: number;
    heuresSurchauffe: number;
    puissanceCreteChauffage: number;
    puissanceCreteClim: number;
  }>;
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

export default function BilanThermiqueDocument({ onBack, onSaved, existingDoc }: Props) {
  const [batiments, setBatiments] = useState<BatimentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [bilan, setBilan] = useState<BilanResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docId, setDocId] = useState<string | null>(existingDoc?.id ?? null);
  const [titre, setTitre] = useState(existingDoc?.titre ?? "");
  const [reference, setReference] = useState(existingDoc?.reference ?? "");

  // ─── Charge la liste des bâtiments ─────────────────
  useEffect(() => {
    let cancelled = false;
    fetch("/api/batiments")
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (cancelled) return;
        setBatiments(list);
      })
      .catch(() => {})
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
      if (parsed.bilan) setBilan(parsed.bilan);
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
      const data = await res.json();
      setBilan(data.bilan ?? data);
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

  const selectedBat = batiments.find((b) => b.id === selectedId);

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
        <Button size="sm" onClick={handleSave} disabled={saving || !bilan}>
          {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
          Enregistrer
        </Button>
      </div>

      {/* Sélection bâtiment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Choix du bâtiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des bâtiments…
            </div>
          ) : batiments.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
              <Building2 className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">Aucun bâtiment disponible</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Créez d&apos;abord un bâtiment et ses zones depuis Bibliothèques → Bâtiments.
              </p>
              <Link href="/dashboard/batiments">
                <Button variant="outline" size="sm" className="mt-3">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Aller aux Bâtiments
                </Button>
              </Link>
            </div>
          ) : (
            <>
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
            </>
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
                Surface totale : {bilan.totalSurface.toFixed(0)} m²
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* KPIs principaux */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi
                icon={<Thermometer className="h-4 w-4" />}
                label="Besoin chauffage"
                value={`${bilan.totalChauffageMWh.toFixed(1)} MWh/an`}
                sub={`${bilan.ratios.chauffageKwhM2An.toFixed(0)} kWh/m²·an`}
                tone="orange"
              />
              <Kpi
                icon={<Snowflake className="h-4 w-4" />}
                label="Besoin clim"
                value={`${bilan.totalClimMWh.toFixed(1)} MWh/an`}
                sub={`${bilan.ratios.climKwhM2An.toFixed(0)} kWh/m²·an`}
                tone="blue"
              />
              <Kpi
                icon={<Sun className="h-4 w-4" />}
                label="Apports solaires"
                value={`${bilan.totalApportsSolairesMWh.toFixed(1)} MWh/an`}
                sub="Gratuits (vitrages)"
                tone="amber"
              />
              <Kpi
                icon={<TrendingUp className="h-4 w-4" />}
                label="Apports internes"
                value={`${bilan.totalApportsInternesMWh.toFixed(1)} MWh/an`}
                sub="Occupants + équip."
                tone="violet"
              />
            </div>

            {/* Pertes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Pertes enveloppe
                </p>
                <p className="mt-1 text-xl font-semibold">{bilan.totalPertesEnveloppeMWh.toFixed(1)} MWh/an</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Wind className="h-3 w-3" /> Pertes ventilation
                </p>
                <p className="mt-1 text-xl font-semibold">{bilan.totalPertesVentilationMWh.toFixed(1)} MWh/an</p>
              </div>
            </div>

            {/* Détail par zone */}
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
                      {bilan.zones.map((z) => (
                        <tr key={z.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{z.nom}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{z.surface.toFixed(0)} m²</td>
                          <td className="px-3 py-2 text-right tabular-nums">{z.besoinChauffageMWh.toFixed(1)} MWh</td>
                          <td className="px-3 py-2 text-right tabular-nums">{z.besoinClimMWh.toFixed(1)} MWh</td>
                          <td className="px-3 py-2 text-right tabular-nums">{z.puissanceCreteChauffage.toFixed(1)} kW</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            <span className={z.heuresSurchauffe > 100 ? "text-amber-600 font-medium" : ""}>
                              {z.heuresSurchauffe.toFixed(0)} h
                            </span>
                          </td>
                        </tr>
                      ))}
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
    </div>
  );
}

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
