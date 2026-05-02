"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Layers,
  Boxes,
  FileText,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Database,
  CalendarClock,
  Home,
  Briefcase,
  Hotel,
} from "lucide-react";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import {
  BATIMENT_TEMPLATES_BILAN,
  type BatimentTemplateBilan,
} from "@/lib/thermal/batiment-templates-bilan";
import MateriauDrawer from "./bilan-thermique/drawers/MateriauDrawer";
import ParoiDrawer from "./bilan-thermique/drawers/ParoiDrawer";
import BatimentDrawer from "./bilan-thermique/drawers/BatimentDrawer";
import ZoneDrawer from "./bilan-thermique/drawers/ZoneDrawer";
import ScenarioDrawer from "./bilan-thermique/drawers/ScenarioDrawer";
import type {
  MateriauDto,
  ParoiDto,
  BatimentDto,
  ZoneDto,
  ScenarioDto,
} from "./bilan-thermique/types";

// ─── Types résultats ─────────────────────────────────────────────

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

type StepKey = "demarrage" | "bibliotheques" | "bilan" | "rapport";

// ─── Composant principal ─────────────────────────────────────────

export default function BilanThermiqueDocument({ onBack, onSaved, existingDoc }: Props) {
  // Bibliothèques
  const [materiaux, setMateriaux] = useState<MateriauDto[]>([]);
  const [parois, setParois] = useState<ParoiDto[]>([]);
  const [batiments, setBatiments] = useState<BatimentDto[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Étapes
  const [step, setStep] = useState<StepKey>("demarrage");

  // Sélection bilan
  const [selectedId, setSelectedId] = useState<string>("");
  const [bilan, setBilan] = useState<BilanResult | null>(null);
  const [computing, setComputing] = useState(false);

  // Document
  const [docId, setDocId] = useState<string | null>(existingDoc?.id ?? null);
  const [titre, setTitre] = useState(existingDoc?.titre ?? "");
  const [reference, setReference] = useState(existingDoc?.reference ?? "");
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  // Drawers
  const [materiauDrawer, setMateriauDrawer] = useState<{ open: boolean; existing: MateriauDto | null }>({ open: false, existing: null });
  const [paroiDrawer, setParoiDrawer] = useState<{ open: boolean; existing: ParoiDto | null }>({ open: false, existing: null });
  const [batimentDrawer, setBatimentDrawer] = useState<{ open: boolean; existing: BatimentDto | null }>({ open: false, existing: null });
  const [zoneDrawer, setZoneDrawer] = useState<{ open: boolean; existing: ZoneDto | null; batiment: BatimentDto | null }>({ open: false, existing: null, batiment: null });
  const [scenarioDrawer, setScenarioDrawer] = useState<{ open: boolean; existing: ScenarioDto | null }>({ open: false, existing: null });

  // ─── Chargement initial ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/materiaux").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/parois").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/batiments").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/scenarios").then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([mats, prs, bats, scs]) => {
        if (cancelled) return;
        setMateriaux(Array.isArray(mats) ? mats : []);
        setParois(Array.isArray(prs) ? prs : []);
        setBatiments(Array.isArray(bats) ? bats : []);
        setScenarios(Array.isArray(scs) ? scs : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Au mount, si on édite un doc existant, on saute directement à l'étape rapport.
  useEffect(() => {
    if (!existingDoc?.donnees) return;
    try {
      const parsed = JSON.parse(existingDoc.donnees);
      if (parsed.batimentId) setSelectedId(parsed.batimentId);
      const candidate = parsed.bilan ?? parsed;
      if (candidate && typeof candidate === "object" && candidate.total) {
        setBilan(candidate as BilanResult);
        setStep("rapport");
      }
    } catch {
      /* ignore */
    }
  }, [existingDoc]);

  // ─── Refresh helpers ───────────────────────────────────────
  async function refreshMateriaux() {
    const r = await fetch("/api/materiaux", { cache: "no-store" });
    if (r.ok) setMateriaux(await r.json());
  }
  async function refreshParois() {
    const r = await fetch("/api/parois", { cache: "no-store" });
    if (r.ok) setParois(await r.json());
  }
  async function refreshBatiments() {
    const r = await fetch("/api/batiments", { cache: "no-store" });
    if (r.ok) setBatiments(await r.json());
  }
  async function refreshScenarios() {
    const r = await fetch("/api/scenarios", { cache: "no-store" });
    if (r.ok) setScenarios(await r.json());
  }

  // ─── Templates "démarrage rapide" ──────────────────────────
  async function applyTemplate(tpl: BatimentTemplateBilan) {
    setApplyingTemplate(tpl.id);
    try {
      const res = await fetch("/api/admin/apply-batiment-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: tpl.id }),
      });
      if (!res.ok) {
        await showApiError(res, "Application du template impossible");
        return;
      }
      const data = (await res.json()) as { batimentId: string; batimentNom: string };
      toast.success(`Template appliqué — ${data.batimentNom}`);
      await Promise.all([refreshMateriaux(), refreshParois(), refreshBatiments(), refreshScenarios()]);
      setSelectedId(data.batimentId);
      setStep("bilan");
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setApplyingTemplate(null);
    }
  }

  // ─── Seeds admin ──────────────────────────────────────────
  async function seedMateriaux() {
    try {
      const res = await fetch("/api/admin/seed-materiaux", { method: "POST" });
      if (!res.ok) { await showApiError(res, "Seed impossible"); return; }
      const j = await res.json();
      toast.success(`Base initiale : +${j.created} matériaux (${j.skipped} déjà présents)`);
      await refreshMateriaux();
    } catch (err) { showNetworkError(err, "Erreur réseau"); }
  }
  async function seedScenarios() {
    try {
      const res = await fetch("/api/admin/seed-scenarios", { method: "POST" });
      if (!res.ok) { await showApiError(res, "Seed impossible"); return; }
      const j = await res.json();
      toast.success(`Presets : +${j.created} scénarios (${j.skipped} déjà présents)`);
      await refreshScenarios();
    } catch (err) { showNetworkError(err, "Erreur réseau"); }
  }

  // ─── Suppression d'une ressource ─────────────────────────
  async function deleteResource(kind: "materiau" | "paroi" | "batiment" | "scenario", id: string) {
    if (!confirm("Confirmer la suppression ?")) return;
    const url = ({
      materiau: `/api/materiaux/${id}`,
      paroi: `/api/parois/${id}`,
      batiment: `/api/batiments/${id}`,
      scenario: `/api/scenarios/${id}`,
    })[kind];
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) { await showApiError(res, "Suppression impossible"); return; }
      toast.success("Supprimé");
      if (kind === "materiau") refreshMateriaux();
      if (kind === "paroi") refreshParois();
      if (kind === "batiment") { refreshBatiments(); if (selectedId === id) setSelectedId(""); }
      if (kind === "scenario") refreshScenarios();
    } catch (err) { showNetworkError(err, "Erreur réseau"); }
  }

  // ─── Calcul + sauvegarde + PDF (fonctions d'origine conservées) ─
  async function handleCalculer() {
    if (!selectedId) { toast.error("Sélectionnez d'abord un bâtiment"); return; }
    const bat = batiments.find((b) => b.id === selectedId);
    if (bat && bat.zonesCount === 0) {
      toast.error("Le bâtiment doit avoir au moins une zone");
      return;
    }
    setComputing(true);
    setBilan(null);
    try {
      const res = await fetch(`/api/batiments/${selectedId}/calculer`, { method: "POST", cache: "no-store" });
      if (!res.ok) { await showApiError(res, "Calcul du bilan impossible"); return; }
      const data = (await res.json()) as BilanResult;
      setBilan(data);
      if (bat && !titre) setTitre(`Bilan thermique — ${bat.nom}`);
      if (!reference) setReference(`BT-${new Date().getFullYear()}-${Date.now().toString(36).slice(-4).toUpperCase()}`);
      setStep("rapport");
      toast.success("Bilan calculé");
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setComputing(false);
    }
  }

  async function handleSave() {
    if (!bilan) { toast.error("Calculez le bilan avant d'enregistrer"); return; }
    if (!titre.trim()) { toast.error("Le titre est requis"); return; }
    setSaving(true);
    try {
      const ref = reference || `BT-${Date.now().toString(36).toUpperCase()}`;
      const donnees = JSON.stringify({ batimentId: selectedId, bilan, savedAt: new Date().toISOString() });
      const url = docId ? `/api/documents/${docId}` : "/api/documents";
      const method = docId ? "PATCH" : "POST";
      const body = docId
        ? JSON.stringify({ titre, reference: ref, donnees, statut: "TERMINE" })
        : JSON.stringify({ titre, reference: ref, type: "BILAN_THERMIQUE", statut: "TERMINE", clientNom: null, donnees });
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
      if (!res.ok) { await showApiError(res, "Enregistrement impossible"); return; }
      if (!docId) { const created = await res.json(); setDocId(created.id); }
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
      let detail: BatimentDetail | null = null;
      if (selectedId) {
        try {
          const res = await fetch(`/api/batiments/${selectedId}`, { cache: "no-store" });
          if (res.ok) detail = (await res.json()) as BatimentDetail;
        } catch { /* ignore */ }
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

  // ─── Render ────────────────────────────────────────────────
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
              {existingDoc ? "Modifier le bilan thermique" : "Studio Bilan thermique"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Pilotez vos bibliothèques et lancez la simulation horaire 8760h (5R1C ISO 13790)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleGeneratePDF} disabled={generatingPDF || !bilan}>
            {generatingPDF ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1 h-3.5 w-3.5" />}
            Générer le PDF
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !bilan}>
            {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <Stepper
        current={step}
        onChange={setStep}
        counts={{
          materiaux: materiaux.length,
          parois: parois.length,
          batiments: batiments.length,
          scenarios: scenarios.length,
        }}
        canGoToBilan={batiments.length > 0}
        canGoToRapport={Boolean(bilan)}
      />

      {loading ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement de vos bibliothèques…
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {step === "demarrage" && (
            <DemarrageSection
              templates={BATIMENT_TEMPLATES_BILAN}
              applying={applyingTemplate}
              onApply={applyTemplate}
              onManual={() => setStep("bibliotheques")}
              hasBatiments={batiments.length > 0}
            />
          )}

          {step === "bibliotheques" && (
            <BibliothequesSection
              materiaux={materiaux}
              parois={parois}
              batiments={batiments}
              scenarios={scenarios}
              onAddMateriau={() => setMateriauDrawer({ open: true, existing: null })}
              onEditMateriau={(m) => setMateriauDrawer({ open: true, existing: m })}
              onDeleteMateriau={(id) => deleteResource("materiau", id)}
              onSeedMateriaux={seedMateriaux}
              onAddParoi={() => setParoiDrawer({ open: true, existing: null })}
              onEditParoi={(p) => setParoiDrawer({ open: true, existing: p })}
              onDeleteParoi={(id) => deleteResource("paroi", id)}
              onAddBatiment={() => setBatimentDrawer({ open: true, existing: null })}
              onEditBatiment={(b) => setBatimentDrawer({ open: true, existing: b })}
              onDeleteBatiment={(id) => deleteResource("batiment", id)}
              onAddZone={(b) => setZoneDrawer({ open: true, existing: null, batiment: b })}
              onAddScenario={() => setScenarioDrawer({ open: true, existing: null })}
              onEditScenario={(s) => setScenarioDrawer({ open: true, existing: s })}
              onDeleteScenario={(id) => deleteResource("scenario", id)}
              onSeedScenarios={seedScenarios}
              onNext={() => setStep("bilan")}
              canNext={batiments.length > 0}
            />
          )}

          {step === "bilan" && (
            <BilanSection
              batiments={batiments}
              selectedId={selectedId}
              setSelectedId={(id) => { setSelectedId(id); setBilan(null); }}
              titre={titre}
              setTitre={setTitre}
              reference={reference}
              setReference={setReference}
              computing={computing}
              onCalculer={handleCalculer}
              selectedBat={selectedBat ?? null}
              onBackToBibliotheques={() => setStep("bibliotheques")}
            />
          )}

          {step === "rapport" && bilan && (
            <RapportSection bilan={bilan} />
          )}
          {step === "rapport" && !bilan && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucun bilan calculé — revenez à l&apos;étape précédente.
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => setStep("bilan")}>
                    Retour au calcul
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Drawers */}
      <MateriauDrawer
        open={materiauDrawer.open}
        existing={materiauDrawer.existing}
        onClose={() => setMateriauDrawer({ open: false, existing: null })}
        onSaved={() => refreshMateriaux()}
      />
      <ParoiDrawer
        open={paroiDrawer.open}
        existing={paroiDrawer.existing}
        onClose={() => setParoiDrawer({ open: false, existing: null })}
        onSaved={() => refreshParois()}
        materiaux={materiaux}
      />
      <BatimentDrawer
        open={batimentDrawer.open}
        existing={batimentDrawer.existing}
        onClose={() => setBatimentDrawer({ open: false, existing: null })}
        onSaved={() => refreshBatiments()}
      />
      {zoneDrawer.batiment && (
        <ZoneDrawer
          open={zoneDrawer.open}
          existing={zoneDrawer.existing}
          onClose={() => setZoneDrawer({ open: false, existing: null, batiment: null })}
          onSaved={() => refreshBatiments()}
          batiment={zoneDrawer.batiment}
          parois={parois}
          scenarios={scenarios}
        />
      )}
      <ScenarioDrawer
        open={scenarioDrawer.open}
        existing={scenarioDrawer.existing}
        onClose={() => setScenarioDrawer({ open: false, existing: null })}
        onSaved={() => refreshScenarios()}
      />
    </div>
  );
}

// ─── Sous-sections ────────────────────────────────────────────────

function DemarrageSection({
  templates,
  applying,
  onApply,
  onManual,
  hasBatiments,
}: {
  templates: BatimentTemplateBilan[];
  applying: string | null;
  onApply: (t: BatimentTemplateBilan) => void;
  onManual: () => void;
  hasBatiments: boolean;
}) {
  const iconFor = (cat: BatimentTemplateBilan["categorie"]) => {
    if (cat === "RESIDENTIEL") return <Home className="h-4 w-4" />;
    if (cat === "TERTIAIRE") return <Briefcase className="h-4 w-4" />;
    return <Hotel className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Démarrage rapide
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Créez un bâtiment-type complet en un clic — matériaux, parois, zones et scénario sont configurés.
          Vous pourrez ensuite ajuster chaque élément depuis l&apos;onglet Bibliothèques.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border bg-background p-4 hover:border-foreground/30 transition-colors flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-md bg-muted p-1.5 text-muted-foreground">
                  {iconFor(t.categorie)}
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {t.categorie}
                </Badge>
              </div>
              <h4 className="text-sm font-semibold mb-1">{t.nom}</h4>
              <p className="text-xs text-muted-foreground mb-3 flex-1">{t.description}</p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                <span>{t.surfaceTotale} m²</span>
                <span>{t.zones.length} zone{t.zones.length > 1 ? "s" : ""}</span>
                <span>{t.zoneClimatique}</span>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => onApply(t)}
                disabled={applying != null}
              >
                {applying === t.id ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                )}
                Créer en 1 clic
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {hasBatiments
              ? "Vous avez déjà des bâtiments — vous pouvez aussi piloter manuellement vos bibliothèques."
              : "Vous préférez tout configurer à la main ?"}
          </p>
          <Button size="sm" variant="outline" onClick={onManual}>
            Configurer manuellement
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BibliothequesSection(props: {
  materiaux: MateriauDto[];
  parois: ParoiDto[];
  batiments: BatimentDto[];
  scenarios: ScenarioDto[];
  onAddMateriau: () => void;
  onEditMateriau: (m: MateriauDto) => void;
  onDeleteMateriau: (id: string) => void;
  onSeedMateriaux: () => void;
  onAddParoi: () => void;
  onEditParoi: (p: ParoiDto) => void;
  onDeleteParoi: (id: string) => void;
  onAddBatiment: () => void;
  onEditBatiment: (b: BatimentDto) => void;
  onDeleteBatiment: (id: string) => void;
  onAddZone: (b: BatimentDto) => void;
  onAddScenario: () => void;
  onEditScenario: (s: ScenarioDto) => void;
  onDeleteScenario: (id: string) => void;
  onSeedScenarios: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Bibliothèques
          </CardTitle>
          <Button size="sm" onClick={props.onNext} disabled={!props.canNext}>
            Lancer un calcul
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Gérez vos matériaux, parois, bâtiments et scénarios. Toutes les modifications sont persistées immédiatement.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="materiaux">
          <TabsList>
            <TabsTrigger value="materiaux">
              <Layers className="h-3.5 w-3.5 mr-1" />
              Matériaux ({props.materiaux.length})
            </TabsTrigger>
            <TabsTrigger value="parois">
              <Boxes className="h-3.5 w-3.5 mr-1" />
              Parois ({props.parois.length})
            </TabsTrigger>
            <TabsTrigger value="batiments">
              <Building2 className="h-3.5 w-3.5 mr-1" />
              Bâtiments ({props.batiments.length})
            </TabsTrigger>
            <TabsTrigger value="scenarios">
              <CalendarClock className="h-3.5 w-3.5 mr-1" />
              Scénarios ({props.scenarios.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materiaux">
            <ListHeader
              count={props.materiaux.length}
              onAdd={props.onAddMateriau}
              extra={
                <Button size="sm" variant="outline" onClick={props.onSeedMateriaux}>
                  <Database className="h-3.5 w-3.5 mr-1" />
                  Importer base initiale
                </Button>
              }
            />
            {props.materiaux.length === 0 ? (
              <EmptyState text="Aucun matériau — créez-en un ou importez la base initiale." />
            ) : (
              <SimpleTable
                columns={["Nom", "Catégorie", "λ (W/m·K)", "ρ (kg/m³)", ""]}
                rows={props.materiaux.map((m) => ({
                  key: m.id,
                  cells: [
                    m.nom,
                    <Badge key="cat" variant="outline" className="text-[10px]">{m.categorie}</Badge>,
                    m.conductivite.toFixed(3),
                    m.masseVolumique.toFixed(0),
                    <RowActions key="a" onEdit={() => props.onEditMateriau(m)} onDelete={() => props.onDeleteMateriau(m.id)} />,
                  ],
                }))}
              />
            )}
          </TabsContent>

          <TabsContent value="parois">
            <ListHeader count={props.parois.length} onAdd={props.onAddParoi} />
            {props.parois.length === 0 ? (
              <EmptyState text="Aucune paroi — composez votre première paroi à partir des matériaux." />
            ) : (
              <SimpleTable
                columns={["Nom", "Type", "U (W/m²·K)", "Couches", ""]}
                rows={props.parois.map((p) => ({
                  key: p.id,
                  cells: [
                    p.nom,
                    <Badge key="t" variant="outline" className="text-[10px]">{p.type}</Badge>,
                    p.uCache != null ? p.uCache.toFixed(2) : "—",
                    `${p.couches?.length ?? 0}`,
                    <RowActions key="a" onEdit={() => props.onEditParoi(p)} onDelete={() => props.onDeleteParoi(p.id)} />,
                  ],
                }))}
              />
            )}
          </TabsContent>

          <TabsContent value="batiments">
            <ListHeader count={props.batiments.length} onAdd={props.onAddBatiment} />
            {props.batiments.length === 0 ? (
              <EmptyState text="Aucun bâtiment — créez-en un puis ajoutez ses zones." />
            ) : (
              <SimpleTable
                columns={["Nom", "Zone climatique", "Zones", ""]}
                rows={props.batiments.map((b) => ({
                  key: b.id,
                  cells: [
                    b.nom,
                    <Badge key="z" variant="outline" className="text-[10px]">{b.zoneClimatique}</Badge>,
                    `${b.zonesCount}`,
                    <div key="a" className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => props.onAddZone(b)}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Zone
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => props.onEditBatiment(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => props.onDeleteBatiment(b.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>,
                  ],
                }))}
              />
            )}
          </TabsContent>

          <TabsContent value="scenarios">
            <ListHeader
              count={props.scenarios.length}
              onAdd={props.onAddScenario}
              extra={
                <Button size="sm" variant="outline" onClick={props.onSeedScenarios}>
                  <Database className="h-3.5 w-3.5 mr-1" />
                  Importer presets
                </Button>
              }
            />
            {props.scenarios.length === 0 ? (
              <EmptyState text="Aucun scénario — importez les presets ou créez le vôtre." />
            ) : (
              <SimpleTable
                columns={["Nom", "Description", "Type", ""]}
                rows={props.scenarios.map((s) => ({
                  key: s.id,
                  cells: [
                    s.nom,
                    <span key="d" className="text-xs text-muted-foreground line-clamp-1">{s.description ?? "—"}</span>,
                    s.preset ? (
                      <Badge key="p" variant="outline" className="text-[10px]">Preset</Badge>
                    ) : (
                      <Badge key="p" variant="outline" className="text-[10px]">Personnalisé</Badge>
                    ),
                    <RowActions key="a" onEdit={() => props.onEditScenario(s)} onDelete={() => props.onDeleteScenario(s.id)} />,
                  ],
                }))}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function BilanSection({
  batiments,
  selectedId,
  setSelectedId,
  titre,
  setTitre,
  reference,
  setReference,
  computing,
  onCalculer,
  selectedBat,
  onBackToBibliotheques,
}: {
  batiments: BatimentDto[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  titre: string;
  setTitre: (s: string) => void;
  reference: string;
  setReference: (s: string) => void;
  computing: boolean;
  onCalculer: () => void;
  selectedBat: BatimentDto | null;
  onBackToBibliotheques: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Choix du bâtiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {batiments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">Aucun bâtiment disponible.</p>
            <Button size="sm" variant="outline" onClick={onBackToBibliotheques}>
              Retour aux bibliothèques
            </Button>
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
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— Choisir —</option>
                  {batiments.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.zonesCount === 0}>
                      {b.nom} (Zone {b.zoneClimatique}){b.zonesCount === 0 ? " — sans zone" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={onCalculer} disabled={!selectedId || computing} className="w-full">
                  {computing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Calculator className="mr-1 h-3.5 w-3.5" />}
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
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Référence</label>
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
  );
}

function RapportSection({ bilan }: { bilan: BilanResult }) {
  return (
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
          <Kpi icon={<Thermometer className="h-4 w-4" />} label="Besoin chauffage"
            value={`${safeNum(bilan.total?.besoinChauffageMWh).toFixed(1)} MWh/an`}
            sub={`${safeNum(bilan.total?.besoinChauffageKWhM2).toFixed(0)} kWh/m²·an`} tone="orange" />
          <Kpi icon={<Snowflake className="h-4 w-4" />} label="Besoin clim"
            value={`${safeNum(bilan.total?.besoinClimMWh).toFixed(1)} MWh/an`}
            sub={`${safeNum(bilan.total?.besoinClimKWhM2).toFixed(0)} kWh/m²·an`} tone="blue" />
          <Kpi icon={<Sun className="h-4 w-4" />} label="Apports solaires"
            value={`${safeNum(bilan.total?.apportsSolairesMWh).toFixed(1)} MWh/an`}
            sub="Gratuits (vitrages)" tone="amber" />
          <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Apports internes"
            value={`${safeNum(bilan.total?.apportsInternesMWh).toFixed(1)} MWh/an`}
            sub="Occupants + équip." tone="violet" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pertes enveloppe</p>
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
  );
}

// ─── Petits composants ────────────────────────────────────────────

function ListHeader({
  count,
  onAdd,
  extra,
}: {
  count: number;
  onAdd: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mt-3 mb-3">
      <p className="text-xs text-muted-foreground">{count} entrée{count > 1 ? "s" : ""}</p>
      <div className="flex items-center gap-2">
        {extra}
        <Button size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nouveau
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

interface SimpleRow { key: string; cells: React.ReactNode[]; }

function SimpleTable({ columns, rows }: { columns: string[]; rows: SimpleRow[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {columns.map((c, i) => (
              <th
                key={c + i}
                className={`px-3 py-2 font-medium ${i === columns.length - 1 ? "text-right" : "text-left"}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.key} className="hover:bg-muted/30">
              {r.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`px-3 py-2 align-middle ${i === r.cells.length - 1 ? "text-right" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      <Button size="sm" variant="ghost" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5 text-red-600" />
      </Button>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────

const STEPS: Array<{ key: StepKey; label: string }> = [
  { key: "demarrage", label: "Démarrage" },
  { key: "bibliotheques", label: "Bibliothèques" },
  { key: "bilan", label: "Bilan" },
  { key: "rapport", label: "Rapport" },
];

function Stepper({
  current,
  onChange,
  counts,
  canGoToBilan,
  canGoToRapport,
}: {
  current: StepKey;
  onChange: (s: StepKey) => void;
  counts: { materiaux: number; parois: number; batiments: number; scenarios: number };
  canGoToBilan: boolean;
  canGoToRapport: boolean;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <ol className="flex items-center gap-2 text-xs flex-wrap">
        {STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const disabled =
            (step.key === "bilan" && !canGoToBilan) ||
            (step.key === "rapport" && !canGoToRapport);
          return (
            <li key={step.key} className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(step.key)}
                className="flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span
                  className={[
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                    done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : active
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground group-hover:border-foreground/50",
                  ].join(" ")}
                >
                  {done ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
                </span>
                <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {step.label}
                </span>
              </button>
              {idx < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40 mx-1" />}
            </li>
          );
        })}
        <li className="ml-auto text-[10px] text-muted-foreground hidden sm:flex items-center gap-3">
          <span>{counts.materiaux} matériaux</span>
          <span>{counts.parois} parois</span>
          <span>{counts.batiments} bâtiments</span>
          <span>{counts.scenarios} scénarios</span>
        </li>
      </ol>
    </div>
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

// ─── PDF Generation (inchangé par rapport à la version d'origine) ──

async function generateBilanPDF(
  bilan: BilanResult,
  batiment: BatimentDto | null,
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

  // Page 1 — Couverture
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

  // Page 2 — Synthèse exécutive
  doc.addPage();
  let y: number = PDF_LAYOUT.topMargin;
  y = drawSectionHeader(doc, "Synthèse", y, "Vue d'ensemble des besoins et apports énergétiques annuels.", { number: 1 });
  y += 4;

  const kpis: Array<{ label: string; value: string; sub: string; color: [number, number, number] }> = [
    { label: "Besoin chauffage", value: `${fmt1(safeNum(bilan.total?.besoinChauffageMWh))} MWh/an`, sub: `${fmt0(safeNum(bilan.total?.besoinChauffageKWhM2))} kWh/m²·an`, color: [234, 88, 12] },
    { label: "Besoin clim", value: `${fmt1(safeNum(bilan.total?.besoinClimMWh))} MWh/an`, sub: `${fmt0(safeNum(bilan.total?.besoinClimKWhM2))} kWh/m²·an`, color: [37, 99, 235] },
    { label: "Apports solaires", value: `${fmt1(safeNum(bilan.total?.apportsSolairesMWh))} MWh/an`, sub: "Gratuits (vitrages)", color: [217, 119, 6] },
    { label: "Apports internes", value: `${fmt1(safeNum(bilan.total?.apportsInternesMWh))} MWh/an`, sub: "Occupants + équipements", color: [124, 58, 237] },
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
    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, cy, cardW, cardH, 1.5, 1.5, "FD");
    doc.setFillColor(...k.color);
    doc.rect(cx, cy, 1.8, cardH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(sanitizePdfText(k.label.toUpperCase()), cx + 6, cy + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(sanitizePdfText(k.value), cx + 6, cy + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.body);
    doc.text(sanitizePdfText(k.sub), cx + 6, cy + 22);
  }
  y += 2 * (cardH + gap) + 4;

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

  // Page 3 — Bilan
  doc.addPage();
  y = PDF_LAYOUT.topMargin;
  y = drawSectionHeader(doc, "Bilan énergétique annuel", y, "Décomposition des besoins, pertes et apports gratuits.", { number: 2 });
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
    ["Besoins de chauffage", `${fmt1(safeNum(t?.besoinChauffageMWh))} MWh/an`, pct(safeNum(t?.besoinChauffageMWh), besoinTotal)],
    ["Besoins de climatisation", `${fmt1(safeNum(t?.besoinClimMWh))} MWh/an`, pct(safeNum(t?.besoinClimMWh), besoinTotal)],
    ["Pertes par l'enveloppe", `${fmt1(safeNum(t?.pertesEnveloppeMWh))} MWh/an`, pct(safeNum(t?.pertesEnveloppeMWh), pertesTotal)],
    ["Pertes par ventilation", `${fmt1(safeNum(t?.pertesVentilationMWh))} MWh/an`, pct(safeNum(t?.pertesVentilationMWh), pertesTotal)],
    ["Apports solaires (gratuits)", `${fmt1(safeNum(t?.apportsSolairesMWh))} MWh/an`, pct(safeNum(t?.apportsSolairesMWh), apportsTotal)],
    ["Apports internes (gratuits)", `${fmt1(safeNum(t?.apportsInternesMWh))} MWh/an`, pct(safeNum(t?.apportsInternesMWh), apportsTotal)],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Poste", "Valeur", "Part"]],
    body: bilanRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: PDF_COLORS.body, lineColor: PDF_COLORS.border, lineWidth: 0.15 },
    headStyles: { fillColor: PDF_COLORS.navy, textColor: PDF_COLORS.white, fontStyle: "bold", fontSize: 9 },
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

  if (bilan.zones.length > 0) {
    if (needsPageBreak(y, 60)) { doc.addPage(); y = PDF_LAYOUT.topMargin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(sanitizePdfText("Répartition des besoins de chauffage par zone"), margin, y);
    y += 4;

    const maxBesoin = bilan.zones.reduce((m, z) => Math.max(m, safeNum(z.result?.besoinChauffageMWh)), 0);
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
      doc.setFillColor(...PDF_COLORS.surface);
      doc.rect(margin + 65, y, barMaxW, 5, "F");
      doc.setFillColor(234, 88, 12);
      doc.rect(margin + 65, y, w, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.heading);
      doc.text(`${fmt1(v)} MWh`, pageWidth - margin, y + 3.5, { align: "right" });
      y += 7;
      if (needsPageBreak(y, 10)) { doc.addPage(); y = PDF_LAYOUT.topMargin; }
    }
    y += 4;
  }

  // Pages détail par zone
  for (let zi = 0; zi < bilan.zones.length; zi++) {
    const z = bilan.zones[zi];
    const detailZone = detail?.zones.find((dz) => dz.id === z.id) ?? null;
    const r = z.result ?? ({} as ZoneResultDto);
    doc.addPage();
    y = PDF_LAYOUT.topMargin;
    y = drawSectionHeader(doc, `Zone : ${txt(z.nom)}${z.usage ? ` (${txt(z.usage)})` : ""}`, y, undefined, { kicker: `ZONE ${String(zi + 1).padStart(2, "0")} / ${String(bilan.zones.length).padStart(2, "0")}` });
    y += 2;

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
      styles: { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 }, textColor: PDF_COLORS.body, lineColor: PDF_COLORS.border, lineWidth: 0.15 },
      alternateRowStyles: { fillColor: PDF_COLORS.surface },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70, textColor: PDF_COLORS.heading },
        1: { halign: "right", cellWidth: contentWidth - 70 },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6;

    if (detailZone && detailZone.parois.length > 0) {
      if (needsPageBreak(y, 30)) { doc.addPage(); y = PDF_LAYOUT.topMargin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.heading);
      doc.text(sanitizePdfText("Détail des parois"), margin, y);
      y += 3;
      const paroisRows: string[][] = detailZone.parois.map((zp) => {
        const surface = safeNum(zp.surface);
        const u = safeNum(zp.paroi?.uCache);
        const pertes = u * surface;
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
        styles: { fontSize: 8.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, textColor: PDF_COLORS.body, lineColor: PDF_COLORS.border, lineWidth: 0.15 },
        headStyles: { fillColor: PDF_COLORS.surface, textColor: PDF_COLORS.heading, fontStyle: "bold", fontSize: 8 },
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

    if (needsPageBreak(y, 12)) { doc.addPage(); y = PDF_LAYOUT.topMargin; }
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.bodyLight);
    doc.text(sanitizePdfText("Méthode 5R1C ISO 13790 — simulation horaire 8760h."), margin, y);
  }

  // Page finale — Méthode et hypothèses
  doc.addPage();
  y = PDF_LAYOUT.topMargin;
  y = drawSectionHeader(doc, "Méthode et hypothèses", y, "Cadre normatif et choix de modélisation retenus.", { number: 99, kicker: "ANNEXE" });
  y += 2;

  const paragraphs: Array<[string, string]> = [
    ["Modèle thermique", "Le bilan repose sur le modèle 5R1C de la norme ISO 13790, simplifié à un nœud capacitif par zone."],
    ["Pas de temps", "La simulation est effectuée au pas horaire sur l'année entière (8760 heures)."],
    ["Météo", `Météo synthétique générée pour la zone climatique ${zoneClim}.`],
    ["Apports gratuits", "Apports solaires calculés par orientation des vitrages."],
    ["Ventilation", "Débit constant en m³/h·m² (paramétré par zone)."],
    ["Limites du modèle", "Les ponts thermiques linéiques ne sont pas modélisés explicitement."],
  ];

  for (const [title, body] of paragraphs) {
    if (needsPageBreak(y, 24)) { doc.addPage(); y = PDF_LAYOUT.topMargin; }
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
      if (needsPageBreak(y, 5)) { doc.addPage(); y = PDF_LAYOUT.topMargin; }
      doc.text(line, margin, y);
      y += 4.2;
    }
    y += 4;
  }

  // Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Bilan thermique", reference, i - 1, totalPages - 1);
  }

  const safeName = batNom.replace(/[^a-zA-Z0-9-_]+/g, "_");
  const filename = `Bilan_thermique_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
