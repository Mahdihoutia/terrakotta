"use client";

import { useEffect, useState, useCallback } from "react";
import { use as usePromise } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Loader2,
  Trash2,
  ArrowLeft,
  Calculator,
  Layers,
  Wind,
  Thermometer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { ZONE_USAGES } from "@/lib/validations/zone";

interface ZoneParoiUI {
  id: string;
  paroiId: string;
  surface: number;
  orientation: string | null;
  inclinaison: number | null;
  cotePaire: boolean;
  paroi: {
    id: string;
    nom: string;
    type: string;
    uCache: number | null;
    masseSurfaciqueCache: number | null;
  } | null;
}

interface ZoneUI {
  id: string;
  nom: string;
  usage: string;
  surface: number;
  hauteurSousPlafond: number;
  consigneChauffageOcc: number;
  consigneChauffageRed: number;
  consigneClimOcc: number;
  consigneClimRed: number;
  densiteOccupation: number;
  apportsParPersonne: number;
  apportsEquipements: number;
  apportsEclairage: number;
  qVmcM3hM2: number;
  efficaciteDoubleFlux: number;
  scenarioId: string | null;
  parois: ZoneParoiUI[];
}

interface BatimentUI {
  id: string;
  nom: string;
  description: string | null;
  zoneClimatique: string;
  altitude: number | null;
  zones: ZoneUI[];
}

interface ScenarioUI {
  id: string;
  nom: string;
  preset: boolean;
}

interface ParoiLite {
  id: string;
  nom: string;
  type: string;
  uCache: number | null;
}

interface BilanResult {
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
    usage: string;
    surface: number;
    result: {
      besoinChauffageMWh: number;
      besoinClimMWh: number;
      puissanceCreteChauffage: number;
      puissanceCreteClim: number;
    };
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BatimentDetailPage({ params }: PageProps) {
  const { id } = usePromise(params);
  const [batiment, setBatiment] = useState<BatimentUI | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioUI[]>([]);
  const [parois, setParois] = useState<ParoiLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [bilan, setBilan] = useState<BilanResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [zoneForm, setZoneForm] = useState({
    nom: "",
    usage: "BUREAUX",
    surface: 100,
    hauteurSousPlafond: 2.7,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resBat, resSc, resPa] = await Promise.all([
        fetch(`/api/batiments/${id}`),
        fetch(`/api/scenarios`),
        fetch(`/api/parois`),
      ]);
      if (!resBat.ok) {
        await showApiError(resBat);
        setLoading(false);
        return;
      }
      const data: BatimentUI = await resBat.json();
      setBatiment(data);
      if (resSc.ok) setScenarios(await resSc.json());
      if (resPa.ok) setParois(await resPa.json());
      if (!selectedZoneId && data.zones.length > 0) {
        setSelectedZoneId(data.zones[0].id);
      }
    } catch (err) {
      showNetworkError(err);
    }
    setLoading(false);
  }, [id, selectedZoneId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddZone(e: React.FormEvent) {
    e.preventDefault();
    if (!zoneForm.nom.trim()) {
      toast.error("Nom requis");
      return;
    }
    try {
      const res = await fetch(`/api/zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...zoneForm, batimentId: id }),
      });
      if (!res.ok) {
        await showApiError(res);
        return;
      }
      const z: ZoneUI = await res.json();
      toast.success("Zone créée");
      setShowAddZone(false);
      setZoneForm({ nom: "", usage: "BUREAUX", surface: 100, hauteurSousPlafond: 2.7 });
      setSelectedZoneId(z.id);
      await load();
    } catch (err) {
      showNetworkError(err);
    }
  }

  async function handleDeleteZone(zoneId: string) {
    if (!confirm("Supprimer cette zone ?")) return;
    const res = await fetch(`/api/zones/${zoneId}`, { method: "DELETE" });
    if (!res.ok) {
      await showApiError(res);
      return;
    }
    toast.success("Zone supprimée");
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
    await load();
  }

  async function handleUpdateZone(zoneId: string, patch: Partial<ZoneUI>) {
    const res = await fetch(`/api/zones/${zoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      await showApiError(res);
      return;
    }
    await load();
  }

  async function handleAddParoi(zoneId: string, paroiId: string, surface: number, orientation: string | null, cotePaire: boolean) {
    const res = await fetch(`/api/zones/${zoneId}/parois`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paroiId, surface, orientation, cotePaire }),
    });
    if (!res.ok) {
      await showApiError(res);
      return;
    }
    toast.success("Paroi associée");
    await load();
  }

  async function handleRemoveParoi(zoneId: string, paroiZoneId: string) {
    const res = await fetch(`/api/zones/${zoneId}/parois/${paroiZoneId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      await showApiError(res);
      return;
    }
    await load();
  }

  async function handleCalculer() {
    setCalculating(true);
    try {
      const res = await fetch(`/api/batiments/${id}/calculer`, { method: "POST" });
      if (!res.ok) {
        await showApiError(res);
        setCalculating(false);
        return;
      }
      const data: BilanResult = await res.json();
      setBilan(data);
      toast.success("Bilan calculé");
    } catch (err) {
      showNetworkError(err);
    }
    setCalculating(false);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement...
      </div>
    );
  }

  if (!batiment) {
    return (
      <div className="p-6">
        <p>Bâtiment introuvable.</p>
        <Link href="/dashboard/batiments" className="text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const selectedZone = batiment.zones.find((z) => z.id === selectedZoneId) ?? null;

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/batiments"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {batiment.nom}
            </h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{batiment.zoneClimatique}</Badge>
              <Badge variant="secondary">
                {batiment.zones.length} zone{batiment.zones.length > 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={handleCalculer} disabled={calculating || batiment.zones.length === 0}>
          {calculating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4 mr-2" />
          )}
          Calculer le bilan
        </Button>
      </div>

      {bilan && (
        <Card className="border-emerald-300 bg-emerald-50/40">
          <CardHeader>
            <CardTitle className="text-base">Bilan thermique annuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Surface totale</div>
                <div className="text-xl font-semibold">{bilan.total.surface.toFixed(0)} m²</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Besoin chauffage</div>
                <div className="text-xl font-semibold text-orange-600">
                  {bilan.total.besoinChauffageMWh.toFixed(1)} MWh
                </div>
                <div className="text-xs text-muted-foreground">
                  {bilan.total.besoinChauffageKWhM2.toFixed(0)} kWh/m²/an
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Besoin clim</div>
                <div className="text-xl font-semibold text-blue-600">
                  {bilan.total.besoinClimMWh.toFixed(1)} MWh
                </div>
                <div className="text-xs text-muted-foreground">
                  {bilan.total.besoinClimKWhM2.toFixed(0)} kWh/m²/an
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Apports solaires</div>
                <div className="text-xl font-semibold">
                  {bilan.total.apportsSolairesMWh.toFixed(1)} MWh
                </div>
              </div>
            </div>
            <div className="mt-4 border-t pt-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Détail par zone
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium pb-1">Zone</th>
                    <th className="text-right font-medium pb-1">Surface</th>
                    <th className="text-right font-medium pb-1">Chauffage MWh</th>
                    <th className="text-right font-medium pb-1">Clim MWh</th>
                    <th className="text-right font-medium pb-1">P crête (kW)</th>
                  </tr>
                </thead>
                <tbody>
                  {bilan.zones.map((z) => (
                    <tr key={z.id} className="border-t">
                      <td className="py-1.5">{z.nom}</td>
                      <td className="text-right">{z.surface.toFixed(0)} m²</td>
                      <td className="text-right">{z.result.besoinChauffageMWh.toFixed(1)}</td>
                      <td className="text-right">{z.result.besoinClimMWh.toFixed(1)}</td>
                      <td className="text-right">
                        {z.result.puissanceCreteChauffage.toFixed(1)} / {z.result.puissanceCreteClim.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar zones */}
        <div className="col-span-12 md:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Zones</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddZone(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {showAddZone && (
                <form onSubmit={handleAddZone} className="space-y-2 p-2 border rounded mb-2 bg-muted/40">
                  <input
                    type="text"
                    placeholder="Nom de la zone"
                    value={zoneForm.nom}
                    onChange={(e) => setZoneForm({ ...zoneForm, nom: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm"
                    autoFocus
                  />
                  <select
                    value={zoneForm.usage}
                    onChange={(e) => setZoneForm({ ...zoneForm, usage: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    {ZONE_USAGES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Surface m²"
                      value={zoneForm.surface}
                      onChange={(e) => setZoneForm({ ...zoneForm, surface: Number(e.target.value) })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="HSP m"
                      value={zoneForm.hauteurSousPlafond}
                      onChange={(e) => setZoneForm({ ...zoneForm, hauteurSousPlafond: Number(e.target.value) })}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Créer</Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddZone(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
              {batiment.zones.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 text-center">
                  Aucune zone. Cliquez sur + pour en créer une.
                </div>
              ) : (
                <ul className="space-y-1">
                  {batiment.zones.map((z) => (
                    <li key={z.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedZoneId(z.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-muted ${
                          selectedZoneId === z.id ? "bg-muted font-medium" : ""
                        }`}
                      >
                        <div>{z.nom}</div>
                        <div className="text-xs text-muted-foreground">
                          {z.usage} · {z.surface} m²
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <div className="col-span-12 md:col-span-9">
          {selectedZone ? (
            <ZoneEditor
              zone={selectedZone}
              scenarios={scenarios}
              parois={parois}
              onUpdate={(patch) => handleUpdateZone(selectedZone.id, patch)}
              onAddParoi={(paroiId, surface, orientation, cotePaire) =>
                handleAddParoi(selectedZone.id, paroiId, surface, orientation, cotePaire)
              }
              onRemoveParoi={(paroiZoneId) =>
                handleRemoveParoi(selectedZone.id, paroiZoneId)
              }
              onDelete={() => handleDeleteZone(selectedZone.id)}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                Sélectionnez ou créez une zone pour démarrer.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface ZoneEditorProps {
  zone: ZoneUI;
  scenarios: ScenarioUI[];
  parois: ParoiLite[];
  onUpdate: (patch: Partial<ZoneUI>) => void;
  onAddParoi: (paroiId: string, surface: number, orientation: string | null, cotePaire: boolean) => void;
  onRemoveParoi: (paroiZoneId: string) => void;
  onDelete: () => void;
}

function ZoneEditor({
  zone,
  scenarios,
  parois,
  onUpdate,
  onAddParoi,
  onRemoveParoi,
  onDelete,
}: ZoneEditorProps) {
  const [showAddParoi, setShowAddParoi] = useState(false);
  const [paroiForm, setParoiForm] = useState({
    paroiId: "",
    surface: 50,
    orientation: "",
    cotePaire: true,
  });

  function submitAddParoi(e: React.FormEvent) {
    e.preventDefault();
    if (!paroiForm.paroiId) {
      toast.error("Sélectionnez une paroi");
      return;
    }
    onAddParoi(
      paroiForm.paroiId,
      paroiForm.surface,
      paroiForm.orientation || null,
      paroiForm.cotePaire,
    );
    setShowAddParoi(false);
    setParoiForm({ paroiId: "", surface: 50, orientation: "", cotePaire: true });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{zone.nom}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-1" /> Supprimer la zone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Général */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
              <Building2 className="h-4 w-4" /> Général
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Nom">
                <input
                  type="text"
                  value={zone.nom}
                  onChange={(e) => onUpdate({ nom: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </Field>
              <Field label="Usage">
                <select
                  value={zone.usage}
                  onChange={(e) => onUpdate({ usage: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  {ZONE_USAGES.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </Field>
              <Field label="Scénario d'occupation">
                <select
                  value={zone.scenarioId ?? ""}
                  onChange={(e) =>
                    onUpdate({ scenarioId: e.target.value || null })
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                >
                  <option value="">— Continu (24h/24)</option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
              </Field>
              <Field label="Surface (m²)">
                <NumberInput
                  value={zone.surface}
                  onCommit={(v) => onUpdate({ surface: v })}
                />
              </Field>
              <Field label="Hauteur sous plafond (m)">
                <NumberInput
                  value={zone.hauteurSousPlafond}
                  step={0.1}
                  onCommit={(v) => onUpdate({ hauteurSousPlafond: v })}
                />
              </Field>
            </div>
          </div>

          {/* Consignes */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
              <Thermometer className="h-4 w-4" /> Consignes (°C)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Chauffage occ.">
                <NumberInput
                  value={zone.consigneChauffageOcc}
                  step={0.5}
                  onCommit={(v) => onUpdate({ consigneChauffageOcc: v })}
                />
              </Field>
              <Field label="Chauffage réduit">
                <NumberInput
                  value={zone.consigneChauffageRed}
                  step={0.5}
                  onCommit={(v) => onUpdate({ consigneChauffageRed: v })}
                />
              </Field>
              <Field label="Clim occ.">
                <NumberInput
                  value={zone.consigneClimOcc}
                  step={0.5}
                  onCommit={(v) => onUpdate({ consigneClimOcc: v })}
                />
              </Field>
              <Field label="Clim réduit">
                <NumberInput
                  value={zone.consigneClimRed}
                  step={0.5}
                  onCommit={(v) => onUpdate({ consigneClimRed: v })}
                />
              </Field>
            </div>
          </div>

          {/* Apports internes */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
              <Users className="h-4 w-4" /> Apports internes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="m²/personne">
                <NumberInput
                  value={zone.densiteOccupation}
                  onCommit={(v) => onUpdate({ densiteOccupation: v })}
                />
              </Field>
              <Field label="W/personne">
                <NumberInput
                  value={zone.apportsParPersonne}
                  onCommit={(v) => onUpdate({ apportsParPersonne: v })}
                />
              </Field>
              <Field label="W/m² équip.">
                <NumberInput
                  value={zone.apportsEquipements}
                  onCommit={(v) => onUpdate({ apportsEquipements: v })}
                />
              </Field>
              <Field label="W/m² éclairage">
                <NumberInput
                  value={zone.apportsEclairage}
                  onCommit={(v) => onUpdate({ apportsEclairage: v })}
                />
              </Field>
            </div>
          </div>

          {/* Ventilation */}
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
              <Wind className="h-4 w-4" /> Ventilation
            </h3>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <Field label="Q VMC (m³/h/m²)">
                <NumberInput
                  value={zone.qVmcM3hM2}
                  step={0.1}
                  onCommit={(v) => onUpdate({ qVmcM3hM2: v })}
                />
              </Field>
              <Field label="Efficacité DF (0..1)">
                <NumberInput
                  value={zone.efficaciteDoubleFlux}
                  step={0.05}
                  onCommit={(v) => onUpdate({ efficaciteDoubleFlux: v })}
                />
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parois */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-1">
              <Layers className="h-4 w-4" /> Parois associées
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddParoi(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddParoi && (
            <form onSubmit={submitAddParoi} className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 border rounded mb-3 bg-muted/40">
              <select
                value={paroiForm.paroiId}
                onChange={(e) => setParoiForm({ ...paroiForm, paroiId: e.target.value })}
                className="col-span-2 border rounded px-2 py-1 text-sm"
              >
                <option value="">— Choisir une paroi</option>
                {parois.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom} ({p.type}{p.uCache ? ` U=${p.uCache.toFixed(2)}` : ""})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Surface m²"
                value={paroiForm.surface}
                onChange={(e) => setParoiForm({ ...paroiForm, surface: Number(e.target.value) })}
                className="border rounded px-2 py-1 text-sm"
              />
              <select
                value={paroiForm.orientation}
                onChange={(e) => setParoiForm({ ...paroiForm, orientation: e.target.value })}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">— Orient.</option>
                {["N","NE","E","SE","S","SO","O","NO"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={paroiForm.cotePaire}
                  onChange={(e) => setParoiForm({ ...paroiForm, cotePaire: e.target.checked })}
                />
                Donne sur l&apos;extérieur
              </label>
              <div className="col-span-2 flex gap-2">
                <Button type="submit" size="sm">Associer</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddParoi(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
          {zone.parois.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              Aucune paroi associée à cette zone.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium pb-1">Paroi</th>
                  <th className="text-left font-medium pb-1">Type</th>
                  <th className="text-right font-medium pb-1">Surface</th>
                  <th className="text-right font-medium pb-1">U</th>
                  <th className="text-left font-medium pb-1">Orient.</th>
                  <th className="text-center font-medium pb-1">Ext.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {zone.parois.map((zp) => (
                  <tr key={zp.id} className="border-t">
                    <td className="py-1.5">{zp.paroi?.nom ?? "—"}</td>
                    <td className="text-xs text-muted-foreground">{zp.paroi?.type}</td>
                    <td className="text-right">{zp.surface.toFixed(0)} m²</td>
                    <td className="text-right">
                      {zp.paroi?.uCache != null ? zp.paroi.uCache.toFixed(2) : "—"}
                    </td>
                    <td>{zp.orientation ?? "—"}</td>
                    <td className="text-center">{zp.cotePaire ? "Oui" : "Non"}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveParoi(zp.id)}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  step = 1,
  onCommit,
}: {
  value: number;
  step?: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => {
    setLocal(String(value));
  }, [value]);
  return (
    <input
      type="number"
      step={step}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const n = Number(local);
        if (Number.isFinite(n) && n !== value) onCommit(n);
      }}
      className="w-full border rounded px-2 py-1 text-sm"
    />
  );
}
