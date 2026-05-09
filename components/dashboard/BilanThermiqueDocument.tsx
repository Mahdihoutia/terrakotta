"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  FileText,
  FileType,
  Plus,
  Trash2,
  Calculator,
  Sun,
  Snowflake,
  TrendingUp,
} from "lucide-react";
import { exportToWord, type WordSectionInput, type WordChart } from "@/lib/word-export";
import { useOrganisation } from "@/lib/hooks/use-organisation";
import { showApiError, showNetworkError } from "@/lib/api-errors";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ZONE_CLIMATIQUE_DATA } from "@/lib/thermal/zones";
import type { ParoiDto, ScenarioDto } from "./bilan-thermique/types";

// ─── Types ───────────────────────────────────────────────────────

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

// Light DTO for the Bilan PDF generator (subset of full BatimentDto).
interface BatimentLite {
  id: string;
  nom: string;
  zoneClimatique: string;
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

// ─── Form state ──────────────────────────────────────────────────

const ZONE_USAGES_FORM = [
  { value: "BUREAUX", label: "Bureau" },
  { value: "LOGEMENT", label: "Logement" },
  { value: "COMMERCE", label: "Commerce" },
  { value: "TECHNIQUE", label: "Industrie / Technique" },
  { value: "AUTRE", label: "Autre" },
] as const;

const ORIENTATIONS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO", "Horizontal"] as const;

interface ParoiRow {
  paroiId: string;
  surface: string;
  orientation: string;
}

interface ZoneRow {
  nom: string;
  usage: string;
  surface: string;
  hauteurSousPlafond: string;
  consigneChauffageOcc: string;
  consigneClimOcc: string;
  densiteOccupation: string;
  qVmcM3hM2: string;
  scenarioId: string;
  parois: ParoiRow[];
}

interface BilanForm {
  titre: string;
  reference: string;
  clientNom: string;
  batimentNom: string;
  zoneClimatique: string;
  altitude: string;
  orientation: string;
  zones: ZoneRow[];
}

const SECTION_TITLES = [
  "1. Informations générales",
  "2. Bâtiment",
  "3. Zones thermiques",
  "4. Enveloppe (parois par zone)",
  "5. Résultats",
] as const;

function emptyZone(): ZoneRow {
  return {
    nom: "",
    usage: "BUREAUX",
    surface: "",
    hauteurSousPlafond: "2.7",
    consigneChauffageOcc: "20",
    consigneClimOcc: "26",
    densiteOccupation: "0.1",
    qVmcM3hM2: "1.2",
    scenarioId: "",
    parois: [],
  };
}

function emptyForm(): BilanForm {
  return {
    titre: "",
    reference: "",
    clientNom: "",
    batimentNom: "",
    zoneClimatique: Object.keys(ZONE_CLIMATIQUE_DATA)[0] ?? "",
    altitude: "",
    orientation: "",
    zones: [emptyZone()],
  };
}

function generateReference(): string {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `BT-${year}-${suffix}`;
}

function safeNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return 0;
}

function parseNum(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Bar chart canvas rendant les besoins (chauffage + clim) par zone.
 * Retourne un PNG dataURL pour embarquage dans le Word.
 */
function renderBesoinsParZoneBarChart(
  zones: Array<{ nom: string; surface: number; result: { besoinChauffageMWh: number; besoinClimMWh: number } }>,
): string | null {
  if (zones.length === 0) return null;
  const data = zones.map((z) => {
    const surf = Math.max(z.surface, 1);
    return {
      nom: z.nom,
      chauffage: (z.result.besoinChauffageMWh * 1000) / surf,
      clim: (z.result.besoinClimMWh * 1000) / surf,
    };
  });

  const W = 1100;
  const H = 600;
  const padTop = 60;
  const padBottom = 90;
  const padLeft = 70;
  const padRight = 40;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  const max = Math.max(1, ...data.flatMap((d) => [d.chauffage, d.clim]));
  const niceMax = Math.ceil(max / 10) * 10;

  ctx.font = "16px -apple-system, Helvetica, Arial";
  ctx.fillStyle = "#171717";
  ctx.fillText("Besoins par zone (kWh/m²·an)", padLeft, 30);

  ctx.strokeStyle = "#E5E5E5";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(W - padRight, y);
    ctx.stroke();
    const value = niceMax * (1 - i / 4);
    ctx.fillStyle = "#737373";
    ctx.font = "12px -apple-system, Helvetica, Arial";
    ctx.fillText(value.toFixed(0), 10, y + 4);
  }

  const groupW = plotW / data.length;
  const barW = Math.min(60, groupW / 3);
  data.forEach((d, i) => {
    const groupX = padLeft + i * groupW + groupW / 2;
    const hChauf = (d.chauffage / niceMax) * plotH;
    const hClim = (d.clim / niceMax) * plotH;
    ctx.fillStyle = "#DC2626";
    ctx.fillRect(groupX - barW - 4, padTop + plotH - hChauf, barW, hChauf);
    ctx.fillStyle = "#0EA5E9";
    ctx.fillRect(groupX + 4, padTop + plotH - hClim, barW, hClim);

    ctx.fillStyle = "#404040";
    ctx.font = "13px -apple-system, Helvetica, Arial";
    ctx.textAlign = "center";
    ctx.fillText(d.nom.length > 16 ? d.nom.slice(0, 14) + "…" : d.nom, groupX, padTop + plotH + 18);
    ctx.textAlign = "start";
  });

  // Légende
  ctx.fillStyle = "#DC2626";
  ctx.fillRect(padLeft, H - 30, 14, 14);
  ctx.fillStyle = "#404040";
  ctx.font = "13px -apple-system, Helvetica, Arial";
  ctx.fillText("Chauffage", padLeft + 22, H - 18);
  ctx.fillStyle = "#0EA5E9";
  ctx.fillRect(padLeft + 130, H - 30, 14, 14);
  ctx.fillStyle = "#404040";
  ctx.fillText("Climatisation", padLeft + 152, H - 18);

  return canvas.toDataURL("image/png");
}

// ─── Composant principal ─────────────────────────────────────────

export default function BilanThermiqueDocument({ onBack, onSaved, existingDoc }: Props) {
  const organisation = useOrganisation();
  const [form, setForm] = useState<BilanForm>(() => {
    const f = emptyForm();
    if (existingDoc) {
      f.titre = existingDoc.titre;
      f.reference = existingDoc.reference;
      f.clientNom = existingDoc.clientNom ?? "";
    }
    return f;
  });

  const [activeSection, setActiveSection] = useState(0);
  const [parois, setParois] = useState<ParoiDto[]>([]);
  const [paroisLoading, setParoisLoading] = useState(true);
  const [scenarios, setScenarios] = useState<ScenarioDto[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [seedingScenarios, setSeedingScenarios] = useState(false);

  const [bilan, setBilan] = useState<BilanResult | null>(null);
  const [batimentId, setBatimentId] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);

  const [docId, setDocId] = useState<string | null>(existingDoc?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);
  const [saved, setSaved] = useState(false);

  // ─── Charge la bibliothèque de parois ────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/parois", { cache: "no-store" });
        if (!res.ok) {
          setParois([]);
          return;
        }
        const data = (await res.json()) as ParoiDto[];
        if (!cancelled) setParois(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setParois([]);
      } finally {
        if (!cancelled) setParoisLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Charge la bibliothèque de scénarios d'occupation ────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/scenarios", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setScenarios([]);
          return;
        }
        const data = (await res.json()) as ScenarioDto[];
        if (!cancelled) setScenarios(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setScenarios([]);
      } finally {
        if (!cancelled) setScenariosLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function seedScenarios() {
    setSeedingScenarios(true);
    try {
      const res = await fetch("/api/admin/seed-scenarios", { method: "POST" });
      if (!res.ok) {
        await showApiError(res, "Initialisation des scénarios impossible");
        return;
      }
      const j = (await res.json()) as { created: number; skipped: number };
      toast.success(`Presets ajoutés — ${j.created} scénarios (${j.skipped} déjà présents)`);
      const refresh = await fetch("/api/scenarios", { cache: "no-store" });
      if (refresh.ok) {
        const data = (await refresh.json()) as ScenarioDto[];
        setScenarios(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSeedingScenarios(false);
    }
  }

  // ─── Pré-remplissage à l'édition ─────────────────────────────
  useEffect(() => {
    if (!existingDoc?.donnees) return;
    try {
      const parsed = JSON.parse(existingDoc.donnees) as {
        form?: Partial<BilanForm>;
        batimentId?: string;
        bilan?: BilanResult;
      };
      if (parsed.form) {
        setForm((prev) => ({
          ...prev,
          ...parsed.form,
          zones:
            parsed.form?.zones && parsed.form.zones.length > 0
              ? parsed.form.zones
              : prev.zones,
        }));
      }
      if (parsed.batimentId) setBatimentId(parsed.batimentId);
      if (parsed.bilan && parsed.bilan.total) {
        setBilan(parsed.bilan);
        setActiveSection(SECTION_TITLES.length - 1);
      }
    } catch {
      /* ignore */
    }
  }, [existingDoc]);

  // ─── Helpers de mise à jour ──────────────────────────────────
  function updateField<K extends keyof BilanForm>(key: K, value: BilanForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function updateZone(idx: number, patch: Partial<ZoneRow>) {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.map((z, i) => (i === idx ? { ...z, ...patch } : z)),
    }));
    setSaved(false);
  }

  function addZone() {
    setForm((prev) => ({ ...prev, zones: [...prev.zones, emptyZone()] }));
    setSaved(false);
  }

  function removeZone(idx: number) {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.length > 1 ? prev.zones.filter((_, i) => i !== idx) : prev.zones,
    }));
    setSaved(false);
  }

  function updateParoi(zoneIdx: number, paroiIdx: number, patch: Partial<ParoiRow>) {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.map((z, i) =>
        i === zoneIdx
          ? {
              ...z,
              parois: z.parois.map((p, j) => (j === paroiIdx ? { ...p, ...patch } : p)),
            }
          : z,
      ),
    }));
    setSaved(false);
  }

  function addParoi(zoneIdx: number) {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.map((z, i) =>
        i === zoneIdx
          ? {
              ...z,
              parois: [
                ...z.parois,
                { paroiId: "", surface: "", orientation: "S" },
              ],
            }
          : z,
      ),
    }));
    setSaved(false);
  }

  function removeParoi(zoneIdx: number, paroiIdx: number) {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.map((z, i) =>
        i === zoneIdx
          ? { ...z, parois: z.parois.filter((_, j) => j !== paroiIdx) }
          : z,
      ),
    }));
    setSaved(false);
  }

  // ─── Validation par section ──────────────────────────────────
  const sectionStatus = useMemo(() => {
    const s: Array<"empty" | "partial" | "complete"> = [];
    // 1. Infos générales — titre obligatoire
    s.push(form.titre.trim() ? "complete" : "empty");
    // 2. Bâtiment — nom + zone climatique
    const hasBat = form.batimentNom.trim() && form.zoneClimatique.trim();
    s.push(hasBat ? "complete" : form.batimentNom.trim() ? "partial" : "empty");
    // 3. Zones — toutes les zones avec nom, surface > 0, hsp > 0
    const zonesOk =
      form.zones.length > 0 &&
      form.zones.every(
        (z) =>
          z.nom.trim() &&
          parseNum(z.surface) !== null &&
          (parseNum(z.surface) ?? 0) > 0 &&
          parseNum(z.hauteurSousPlafond) !== null &&
          (parseNum(z.hauteurSousPlafond) ?? 0) > 0,
      );
    s.push(
      zonesOk
        ? "complete"
        : form.zones.some((z) => z.nom.trim())
        ? "partial"
        : "empty",
    );
    // 4. Enveloppe — chaque zone a au moins une paroi valide
    const envOk =
      form.zones.length > 0 &&
      form.zones.every(
        (z) =>
          z.parois.length > 0 &&
          z.parois.every(
            (p) =>
              p.paroiId &&
              parseNum(p.surface) !== null &&
              (parseNum(p.surface) ?? 0) > 0,
          ),
      );
    s.push(
      envOk
        ? "complete"
        : form.zones.some((z) => z.parois.length > 0)
        ? "partial"
        : "empty",
    );
    // 5. Résultats — calculé ?
    s.push(bilan ? "complete" : "empty");
    return s;
  }, [form, bilan]);

  // ─── Calcul ──────────────────────────────────────────────────
  async function handleCalculer() {
    // Validation
    if (!form.batimentNom.trim()) {
      toast.error("Le nom du bâtiment est requis (section 2)");
      setActiveSection(1);
      return;
    }
    if (!form.zoneClimatique) {
      toast.error("La zone climatique est requise");
      setActiveSection(1);
      return;
    }
    if (form.zones.length === 0) {
      toast.error("Au moins une zone thermique est requise");
      setActiveSection(2);
      return;
    }
    for (let i = 0; i < form.zones.length; i++) {
      const z = form.zones[i];
      if (!z.nom.trim()) {
        toast.error(`Zone ${i + 1} : nom requis`);
        setActiveSection(2);
        return;
      }
      const surface = parseNum(z.surface);
      if (surface === null || surface <= 0) {
        toast.error(`Zone ${i + 1} : surface > 0 requise`);
        setActiveSection(2);
        return;
      }
      const hsp = parseNum(z.hauteurSousPlafond);
      if (hsp === null || hsp <= 0) {
        toast.error(`Zone ${i + 1} : hauteur sous plafond > 0 requise`);
        setActiveSection(2);
        return;
      }
      if (z.parois.length === 0) {
        toast.error(`Zone "${z.nom}" : au moins une paroi est requise`);
        setActiveSection(3);
        return;
      }
      for (let j = 0; j < z.parois.length; j++) {
        const p = z.parois[j];
        if (!p.paroiId) {
          toast.error(`Zone "${z.nom}" — paroi ${j + 1} : sélection requise`);
          setActiveSection(3);
          return;
        }
        const ps = parseNum(p.surface);
        if (ps === null || ps <= 0) {
          toast.error(`Zone "${z.nom}" — paroi ${j + 1} : surface > 0 requise`);
          setActiveSection(3);
          return;
        }
      }
    }

    setComputing(true);
    setBilan(null);
    try {
      // 1. Crée le bâtiment si pas déjà créé.
      let batId = batimentId;
      if (!batId) {
        const altNum = parseNum(form.altitude);
        const batPayload = {
          nom: form.batimentNom.trim(),
          description: null,
          zoneClimatique: form.zoneClimatique,
          altitude: altNum,
          orientation: form.orientation.trim() || null,
        };
        const res = await fetch("/api/batiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batPayload),
        });
        if (!res.ok) {
          await showApiError(res, "Création du bâtiment impossible");
          return;
        }
        const created = (await res.json()) as { id: string };
        batId = created.id;
        setBatimentId(batId);

        // 2. Crée les zones et leurs parois.
        for (const z of form.zones) {
          const zonePayload = {
            batimentId: batId,
            nom: z.nom.trim(),
            usage: z.usage,
            surface: parseNum(z.surface) ?? 0,
            hauteurSousPlafond: parseNum(z.hauteurSousPlafond) ?? 2.7,
            consigneChauffageOcc: parseNum(z.consigneChauffageOcc) ?? undefined,
            consigneClimOcc: parseNum(z.consigneClimOcc) ?? undefined,
            densiteOccupation: parseNum(z.densiteOccupation) ?? undefined,
            qVmcM3hM2: parseNum(z.qVmcM3hM2) ?? undefined,
            ...(z.scenarioId ? { scenarioId: z.scenarioId } : {}),
          };
          const zRes = await fetch("/api/zones", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(zonePayload),
          });
          if (!zRes.ok) {
            await showApiError(zRes, `Création de la zone "${z.nom}" impossible`);
            return;
          }
          const zCreated = (await zRes.json()) as { id: string };
          const zoneId = zCreated.id;

          // 3. Ajoute les parois à la zone.
          for (const p of z.parois) {
            const orient =
              p.orientation && p.orientation !== "Horizontal" ? p.orientation : null;
            const incl = p.orientation === "Horizontal" ? 0 : null;
            const paroiPayload = {
              paroiId: p.paroiId,
              surface: parseNum(p.surface) ?? 0,
              orientation: orient,
              inclinaison: incl,
            };
            const pRes = await fetch(`/api/zones/${zoneId}/parois`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paroiPayload),
            });
            if (!pRes.ok) {
              await showApiError(pRes, `Ajout d'une paroi à "${z.nom}" impossible`);
              return;
            }
          }
        }
      }

      // 4. Lance le calcul.
      const calcRes = await fetch(`/api/batiments/${batId}/calculer`, {
        method: "POST",
        cache: "no-store",
      });
      if (!calcRes.ok) {
        await showApiError(calcRes, "Calcul du bilan impossible");
        return;
      }
      const data = (await calcRes.json()) as BilanResult;
      setBilan(data);

      // Auto-fill titre/référence si vides
      setForm((prev) => ({
        ...prev,
        titre: prev.titre || `Bilan thermique — ${form.batimentNom.trim()}`,
        reference: prev.reference || generateReference(),
      }));
      setActiveSection(SECTION_TITLES.length - 1);
      toast.success("Bilan calculé");
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setComputing(false);
    }
  }

  // ─── Sauvegarde ──────────────────────────────────────────────
  async function handleSave() {
    if (!form.titre.trim()) {
      toast.error("Le titre est requis");
      setActiveSection(0);
      return;
    }
    setSaving(true);
    try {
      const ref = form.reference.trim() || generateReference();
      if (!form.reference.trim()) {
        setForm((prev) => ({ ...prev, reference: ref }));
      }
      const donnees = JSON.stringify({
        form: { ...form, reference: ref },
        batimentId,
        bilan,
        savedAt: new Date().toISOString(),
      });
      const url = docId ? `/api/documents/${docId}` : "/api/documents";
      const method = docId ? "PATCH" : "POST";
      const statut = bilan ? "TERMINE" : "BROUILLON";
      const body = docId
        ? JSON.stringify({
            titre: form.titre,
            reference: ref,
            statut,
            clientNom: form.clientNom.trim() || null,
            donnees,
          })
        : JSON.stringify({
            titre: form.titre,
            reference: ref,
            type: "BILAN_THERMIQUE",
            statut,
            clientNom: form.clientNom.trim() || null,
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
        const created = (await res.json()) as { id: string };
        setDocId(created.id);
      }
      setSaved(true);
      toast.success("Bilan enregistré");
      onSaved?.();
    } catch (err) {
      showNetworkError(err, "Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  // ─── Word ────────────────────────────────────────────────────
  async function handleGenerateWord() {
    if (!bilan) {
      toast.error("Calculez d'abord le bilan");
      return;
    }
    setGeneratingWord(true);
    try {
      const ref = form.reference.trim() || generateReference();
      const fmt1 = (n: number | null | undefined) =>
        Number.isFinite(n)
          ? (n as number).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
          : "—";
      const fmt0 = (n: number | null | undefined) =>
        Number.isFinite(n) ? (n as number).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : "—";

      const sections: WordSectionInput[] = [];

      // Section 1 — Informations générales
      sections.push({
        titre: "1. Informations générales",
        rows: [
          { label: "Titre", value: form.titre || "—" },
          { label: "Référence", value: ref },
          { label: "Client", value: form.clientNom || "—" },
        ],
      });

      // Section 2 — Bâtiment
      sections.push({
        titre: "2. Bâtiment",
        rows: [
          { label: "Nom du bâtiment", value: form.batimentNom || "—" },
          { label: "Zone climatique", value: form.zoneClimatique || "—" },
          { label: "Altitude (m)", value: form.altitude || "—" },
          { label: "Orientation principale", value: form.orientation || "—" },
        ],
      });

      // Section 3 — Bilan annuel global
      const t = bilan.total;
      sections.push({
        titre: "3. Bilan annuel global",
        description: "Méthode 5R1C — simulation horaire 8760h",
        rows: [
          { label: "Surface totale (m²)", value: fmt1(t.surface) },
          { label: "Besoin chauffage (MWh/an)", value: fmt1(t.besoinChauffageMWh) },
          { label: "Besoin chauffage (kWh/m²·an)", value: fmt1(t.besoinChauffageKWhM2) },
          { label: "Besoin climatisation (MWh/an)", value: fmt1(t.besoinClimMWh) },
          { label: "Besoin climatisation (kWh/m²·an)", value: fmt1(t.besoinClimKWhM2) },
          { label: "Apports solaires (MWh/an)", value: fmt1(t.apportsSolairesMWh) },
          { label: "Apports internes (MWh/an)", value: fmt1(t.apportsInternesMWh) },
          { label: "Pertes enveloppe (MWh/an)", value: fmt1(t.pertesEnveloppeMWh) },
          { label: "Pertes ventilation (MWh/an)", value: fmt1(t.pertesVentilationMWh) },
        ],
      });

      // Chart : besoins par zone (bar chart canvas natif)
      const zoneCharts: WordChart[] = [];
      try {
        const png = renderBesoinsParZoneBarChart(bilan.zones);
        if (png) zoneCharts.push({ title: "Besoins de chauffage et climatisation par zone (kWh/m²·an)", dataUrl: png });
      } catch { /* skip */ }

      // Section 4 — Détail par zone
      sections.push({
        titre: "4. Détail par zone",
        charts: zoneCharts,
        tables: [{
          headers: ["Zone", "Usage", "Surface (m²)", "Chauf. (MWh)", "Clim. (MWh)", "P. crête chauf. (kW)", "P. crête clim. (kW)"],
          rows: bilan.zones.map((z) => [
            z.nom,
            z.usage || "—",
            fmt1(z.surface),
            fmt1(z.result.besoinChauffageMWh),
            fmt1(z.result.besoinClimMWh),
            z.result.puissanceCreteChauffage != null ? fmt1(z.result.puissanceCreteChauffage) : "—",
            z.result.puissanceCreteClim != null ? fmt1(z.result.puissanceCreteClim) : "—",
          ]),
        }],
      });

      // Section 5 — Apports gratuits
      sections.push({
        titre: "5. Apports gratuits par zone",
        tables: [{
          headers: ["Zone", "Solaires (MWh)", "Internes (MWh)", "Total (MWh)"],
          rows: bilan.zones.map((z) => {
            const sol = safeNum(z.result.apportsSolairesMWh);
            const int = safeNum(z.result.apportsInternesMWh);
            return [
              z.nom,
              fmt1(sol),
              fmt1(int),
              fmt1(sol + int),
            ];
          }),
        }],
      });

      // Section 6 — Enveloppe (parois par zone)
      const paroiById = new Map(parois.map((p) => [p.id, p]));
      const enveloppeRows: string[][] = [];
      for (const z of form.zones) {
        for (const p of z.parois) {
          if (!p.paroiId) continue;
          const ref = paroiById.get(p.paroiId);
          enveloppeRows.push([
            z.nom || "—",
            ref?.nom ?? "—",
            ref?.type ?? "—",
            p.orientation || "—",
            fmt1(safeNum(p.surface)),
            ref?.uCache != null ? ref.uCache.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—",
          ]);
        }
      }
      if (enveloppeRows.length > 0) {
        sections.push({
          titre: "6. Enveloppe — détail des parois",
          description: "Surfaces et coefficients U (W/m²·K) par paroi",
          tables: [{
            headers: ["Zone", "Paroi", "Type", "Orientation", "Surface (m²)", "U (W/m²·K)"],
            rows: enveloppeRows,
          }],
        });
      }

      // Section 7 — Heures de surchauffe (si dispo)
      const surchaufZones = bilan.zones.filter((z) => z.result.heuresSurchauffe != null);
      if (surchaufZones.length > 0) {
        sections.push({
          titre: `${enveloppeRows.length > 0 ? "7" : "6"}. Heures de surchauffe`,
          description: "Heures > 28 °C en occupation — indicateur de risque inconfort estival",
          tables: [{
            headers: ["Zone", "Heures > 28 °C"],
            rows: surchaufZones.map((z) => [z.nom, fmt0(z.result.heuresSurchauffe ?? 0)]),
          }],
        });
      }

      await exportToWord({
        organisation: organisation ?? undefined,
        title: "Bilan thermique",
        subtitle: "Simulation horaire 8760h — méthode 5R1C ISO 13790",
        reference: ref,
        meta: [
          { label: "Référence", value: ref },
          { label: "Client", value: form.clientNom || "—" },
          { label: "Bâtiment", value: form.batimentNom || "—" },
          { label: "Zone climatique", value: form.zoneClimatique || "—" },
          { label: "Surface totale", value: `${fmt1(t.surface)} m²` },
        ],
        sections,
        filename: `Bilan_Thermique_${ref}_${new Date().toISOString().slice(0, 10)}.docx`,
      });
      toast.success("Word téléchargé");
    } catch (err) {
      showNetworkError(err, "Erreur lors de la génération Word");
    } finally {
      setGeneratingWord(false);
    }
  }

  // ─── PDF ─────────────────────────────────────────────────────
  async function handleGeneratePDF() {
    if (!bilan) {
      toast.error("Calculez d'abord le bilan");
      return;
    }
    setGeneratingPDF(true);
    try {
      let detail: BatimentDetail | null = null;
      if (batimentId) {
        try {
          const r = await fetch(`/api/batiments/${batimentId}`, { cache: "no-store" });
          if (r.ok) detail = (await r.json()) as BatimentDetail;
        } catch {
          /* ignore */
        }
      }
      const lite: BatimentLite = {
        id: batimentId ?? "",
        nom: form.batimentNom.trim() || "Bâtiment",
        zoneClimatique: form.zoneClimatique,
      };
      const ref = form.reference.trim() || generateReference();
      await generateBilanPDF(bilan, lite, detail, ref);
      toast.success("PDF téléchargé");
    } catch (err) {
      showNetworkError(err, "Erreur lors de la génération du PDF");
    } finally {
      setGeneratingPDF(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────

  const completedCount = sectionStatus.filter((s) => s === "complete").length;
  const completionPct = Math.round((completedCount / SECTION_TITLES.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <div className="rounded-lg p-2 bg-orange-500/10 text-orange-700 dark:text-orange-300">
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {existingDoc ? "Modifier le bilan thermique" : "Bilan thermique"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {completionPct}% complété — {completedCount}/{SECTION_TITLES.length} sections
              {bilan ? " — bilan calculé" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWord}
            disabled={generatingWord || generatingPDF || !bilan}
          >
            {generatingWord ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileType className="mr-2 h-4 w-4" />
            )}
            {generatingWord ? "Word..." : "Word"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePDF}
            disabled={generatingPDF || generatingWord || !bilan}
          >
            {generatingPDF ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {generatingPDF ? "Génération..." : "Générer le PDF"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Sauvegarde..." : saved ? "Sauvegardé" : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${completionPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Left navigation */}
        <div className="space-y-1">
          {SECTION_TITLES.map((title, i) => {
            const status = sectionStatus[i];
            return (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  activeSection === i
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {status === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : status === "partial" ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]">
                    {i + 1}
                  </span>
                )}
                <span className="truncate">{title}</span>
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeSection === 0 && (
              <SectionInfos form={form} updateField={updateField} />
            )}
            {activeSection === 1 && (
              <SectionBatiment form={form} updateField={updateField} />
            )}
            {activeSection === 2 && (
              <SectionZones
                zones={form.zones}
                addZone={addZone}
                removeZone={removeZone}
                updateZone={updateZone}
                scenarios={scenarios}
                scenariosLoading={scenariosLoading}
                seedingScenarios={seedingScenarios}
                onSeedScenarios={seedScenarios}
              />
            )}
            {activeSection === 3 && (
              <SectionEnveloppe
                zones={form.zones}
                parois={parois}
                paroisLoading={paroisLoading}
                addParoi={addParoi}
                removeParoi={removeParoi}
                updateParoi={updateParoi}
              />
            )}
            {activeSection === 4 && (
              <SectionResultats
                bilan={bilan}
                computing={computing}
                onCalculer={handleCalculer}
              />
            )}

            {/* Nav buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                disabled={activeSection === 0}
              >
                ← Précédent
              </Button>
              {activeSection < SECTION_TITLES.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setActiveSection(activeSection + 1)}
                >
                  Suivant →
                </Button>
              ) : (
                <Button size="sm" onClick={handleSave} disabled={saving || !bilan}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Sections ────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

function FieldLabel({
  children,
  required,
  unit,
}: {
  children: React.ReactNode;
  required?: boolean;
  unit?: string;
}) {
  return (
    <label className="text-sm font-medium flex items-center gap-1">
      {children}
      {required && <span className="text-destructive">*</span>}
      {unit && (
        <span className="text-xs text-muted-foreground font-normal">({unit})</span>
      )}
    </label>
  );
}

function SectionInfos({
  form,
  updateField,
}: {
  form: BilanForm;
  updateField: <K extends keyof BilanForm>(k: K, v: BilanForm[K]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{SECTION_TITLES[0]}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Identification du bilan thermique et du commanditaire.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel required>Titre du bilan</FieldLabel>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => updateField("titre", e.target.value)}
              placeholder="Ex : Bilan thermique — Hôtel Le Manoir"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Référence</FieldLabel>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => updateField("reference", e.target.value)}
              placeholder="BT-2026-XXXX (auto si vide)"
              className={inputCls}
            />
            <p className="text-[11px] text-muted-foreground">
              Laissez vide pour générer automatiquement (BT-AAAA-XXXX).
            </p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Client / Bénéficiaire</FieldLabel>
            <input
              type="text"
              value={form.clientNom}
              onChange={(e) => updateField("clientNom", e.target.value)}
              placeholder="Nom du client"
              className={inputCls}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionBatiment({
  form,
  updateField,
}: {
  form: BilanForm;
  updateField: <K extends keyof BilanForm>(k: K, v: BilanForm[K]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{SECTION_TITLES[1]}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Caractéristiques générales du bâtiment étudié.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel required>Nom du bâtiment</FieldLabel>
            <input
              type="text"
              value={form.batimentNom}
              onChange={(e) => updateField("batimentNom", e.target.value)}
              placeholder="Ex : Bureau Lyon Part-Dieu"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel required>Zone climatique</FieldLabel>
            <select
              value={form.zoneClimatique}
              onChange={(e) => updateField("zoneClimatique", e.target.value)}
              className={inputCls}
            >
              {Object.keys(ZONE_CLIMATIQUE_DATA).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel unit="m">Altitude</FieldLabel>
            <input
              type="number"
              value={form.altitude}
              onChange={(e) => updateField("altitude", e.target.value)}
              placeholder="Ex : 200"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>Orientation principale</FieldLabel>
            <input
              type="text"
              value={form.orientation}
              onChange={(e) => updateField("orientation", e.target.value)}
              placeholder="Ex : Sud / Façades principales N-S"
              className={inputCls}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionZones({
  zones,
  addZone,
  removeZone,
  updateZone,
  scenarios,
  scenariosLoading,
  seedingScenarios,
  onSeedScenarios,
}: {
  zones: ZoneRow[];
  addZone: () => void;
  removeZone: (idx: number) => void;
  updateZone: (idx: number, patch: Partial<ZoneRow>) => void;
  scenarios: ScenarioDto[];
  scenariosLoading: boolean;
  seedingScenarios: boolean;
  onSeedScenarios: () => void;
}) {
  const noScenarios = !scenariosLoading && scenarios.length === 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{SECTION_TITLES[2]}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Découpez votre bâtiment en zones thermiques homogènes (usage / consignes).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {noScenarios && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex items-center justify-between gap-3">
            <span>
              Aucun scénario d&apos;occupation en bibliothèque. Initialisez les presets pour
              attribuer un rythme hebdomadaire à chaque zone.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onSeedScenarios}
              disabled={seedingScenarios}
            >
              {seedingScenarios ? "Initialisation…" : "Initialiser les presets"}
            </Button>
          </div>
        )}
        {zones.map((z, idx) => (
          <div key={idx} className="rounded-lg border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Zone {idx + 1}</Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => removeZone(idx)}
                disabled={zones.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <FieldLabel required>Nom de la zone</FieldLabel>
                <input
                  type="text"
                  value={z.nom}
                  onChange={(e) => updateZone(idx, { nom: e.target.value })}
                  placeholder="Ex : Plateau bureaux R+1"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Usage</FieldLabel>
                <select
                  value={z.usage}
                  onChange={(e) => updateZone(idx, { usage: e.target.value })}
                  className={inputCls}
                >
                  {ZONE_USAGES_FORM.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel required unit="m²">
                  Surface
                </FieldLabel>
                <input
                  type="number"
                  step="any"
                  value={z.surface}
                  onChange={(e) => updateZone(idx, { surface: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel required unit="m">
                  Hauteur sous plafond
                </FieldLabel>
                <input
                  type="number"
                  step="any"
                  value={z.hauteurSousPlafond}
                  onChange={(e) =>
                    updateZone(idx, { hauteurSousPlafond: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel unit="°C">Consigne chauffage (occ.)</FieldLabel>
                <input
                  type="number"
                  step="any"
                  value={z.consigneChauffageOcc}
                  onChange={(e) =>
                    updateZone(idx, { consigneChauffageOcc: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel unit="°C">Consigne clim (occ.)</FieldLabel>
                <input
                  type="number"
                  step="any"
                  value={z.consigneClimOcc}
                  onChange={(e) =>
                    updateZone(idx, { consigneClimOcc: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel unit="pers./m²">Densité d&apos;occupation</FieldLabel>
                <input
                  type="number"
                  step="any"
                  value={z.densiteOccupation}
                  onChange={(e) =>
                    updateZone(idx, { densiteOccupation: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel unit="m³/h·m²">Débit VMC</FieldLabel>
                <input
                  type="number"
                  step="any"
                  value={z.qVmcM3hM2}
                  onChange={(e) => updateZone(idx, { qVmcM3hM2: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <FieldLabel>Scénario d&apos;occupation</FieldLabel>
                <select
                  value={z.scenarioId}
                  onChange={(e) => updateZone(idx, { scenarioId: e.target.value })}
                  className={inputCls}
                  disabled={scenariosLoading || scenarios.length === 0}
                >
                  <option value="">
                    {scenariosLoading
                      ? "Chargement…"
                      : scenarios.length === 0
                      ? "Aucun scénario disponible"
                      : "— Profil par défaut (occ. en continu) —"}
                  </option>
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.preset ? "★ " : ""}
                      {s.nom}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Pattern hebdomadaire 7×24h appliqué aux apports internes, à la VMC
                  et aux consignes (mode réduit hors occupation).
                </p>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addZone}>
          <Plus className="mr-1 h-4 w-4" />
          Ajouter une zone
        </Button>
      </CardContent>
    </Card>
  );
}

function SectionEnveloppe({
  zones,
  parois,
  paroisLoading,
  addParoi,
  removeParoi,
  updateParoi,
}: {
  zones: ZoneRow[];
  parois: ParoiDto[];
  paroisLoading: boolean;
  addParoi: (zoneIdx: number) => void;
  removeParoi: (zoneIdx: number, paroiIdx: number) => void;
  updateParoi: (zoneIdx: number, paroiIdx: number, patch: Partial<ParoiRow>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{SECTION_TITLES[3]}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pour chaque zone, listez les parois (mur, toiture, vitrage…) et leur surface.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {paroisLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement de la bibliothèque de parois…
          </div>
        ) : parois.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
            <AlertCircle className="mx-auto mb-2 h-5 w-5 text-amber-500" />
            <p className="text-sm font-medium">Aucune paroi en bibliothèque</p>
            <p className="text-xs text-muted-foreground mt-1">
              Créez d&apos;abord des parois dans la bibliothèque pour les associer aux zones.
            </p>
          </div>
        ) : (
          zones.map((z, zi) => (
            <div key={zi} className="rounded-lg border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary">Zone {zi + 1}</Badge>
                  <span className="ml-2 text-sm font-medium">
                    {z.nom || <span className="text-muted-foreground">(sans nom)</span>}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => addParoi(zi)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter une paroi
                </Button>
              </div>
              {z.parois.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Aucune paroi pour cette zone.
                </p>
              ) : (
                <div className="space-y-2">
                  {z.parois.map((p, pi) => (
                    <div
                      key={pi}
                      className="grid gap-2 sm:grid-cols-[1fr_120px_120px_auto] items-end"
                    >
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Paroi
                        </label>
                        <select
                          value={p.paroiId}
                          onChange={(e) =>
                            updateParoi(zi, pi, { paroiId: e.target.value })
                          }
                          className={inputCls}
                        >
                          <option value="">— Sélectionner —</option>
                          {parois.map((pp) => (
                            <option key={pp.id} value={pp.id}>
                              {pp.nom} ({pp.type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Surface (m²)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={p.surface}
                          onChange={(e) =>
                            updateParoi(zi, pi, { surface: e.target.value })
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Orientation
                        </label>
                        <select
                          value={p.orientation}
                          onChange={(e) =>
                            updateParoi(zi, pi, { orientation: e.target.value })
                          }
                          className={inputCls}
                        >
                          {ORIENTATIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeParoi(zi, pi)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SectionResultats({
  bilan,
  computing,
  onCalculer,
}: {
  bilan: BilanResult | null;
  computing: boolean;
  onCalculer: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{SECTION_TITLES[4]}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Lancez le calcul horaire 8760h (ISO 13790 — 5R1C) pour obtenir les besoins.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onCalculer} disabled={computing} size="sm">
          {computing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="mr-2 h-4 w-4" />
          )}
          {computing ? "Calcul en cours..." : "Calculer le bilan thermique"}
        </Button>

        {!bilan && !computing && (
          <p className="text-sm text-muted-foreground">
            Aucun calcul lancé pour l&apos;instant. Vérifiez les sections précédentes puis cliquez
            sur le bouton ci-dessus.
          </p>
        )}

        {bilan && <BilanResultsView bilan={bilan} />}
      </CardContent>
    </Card>
  );
}

function BilanResultsView({ bilan }: { bilan: BilanResult }) {
  const t = bilan.total;
  const fmt1 = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt0 = (n: number) =>
    n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

  const kpis = [
    {
      label: "Besoin chauffage",
      value: `${fmt1(safeNum(t?.besoinChauffageMWh))} MWh/an`,
      sub: `${fmt0(safeNum(t?.besoinChauffageKWhM2))} kWh/m²·an`,
      icon: <Thermometer className="h-4 w-4 text-orange-600" />,
    },
    {
      label: "Besoin clim",
      value: `${fmt1(safeNum(t?.besoinClimMWh))} MWh/an`,
      sub: `${fmt0(safeNum(t?.besoinClimKWhM2))} kWh/m²·an`,
      icon: <Snowflake className="h-4 w-4 text-blue-600" />,
    },
    {
      label: "Apports solaires",
      value: `${fmt1(safeNum(t?.apportsSolairesMWh))} MWh/an`,
      sub: "Gratuits (vitrages)",
      icon: <Sun className="h-4 w-4 text-amber-600" />,
    },
    {
      label: "Apports internes",
      value: `${fmt1(safeNum(t?.apportsInternesMWh))} MWh/an`,
      sub: "Occupants + équipements",
      icon: <TrendingUp className="h-4 w-4 text-violet-600" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-lg border bg-background p-4 space-y-1"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
              {k.icon}
              {k.label}
            </div>
            <div className="text-xl font-semibold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      {bilan.zones.length > 0 && (
        <div className="rounded-lg border bg-background overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/50">
            <h4 className="text-sm font-semibold">Détail par zone</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2 font-medium">Zone</th>
                  <th className="text-right px-4 py-2 font-medium">Surface</th>
                  <th className="text-right px-4 py-2 font-medium">Chauffage</th>
                  <th className="text-right px-4 py-2 font-medium">Clim</th>
                  <th className="text-right px-4 py-2 font-medium">P. crête</th>
                </tr>
              </thead>
              <tbody>
                {bilan.zones.map((z) => (
                  <tr key={z.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{z.nom}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {fmt0(safeNum(z.surface))} m²
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmt1(safeNum(z.result?.besoinChauffageMWh))} MWh
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmt1(safeNum(z.result?.besoinClimMWh))} MWh
                    </td>
                    <td className="px-4 py-2 text-right">
                      {fmt1(safeNum(z.result?.puissanceCreteChauffage))} kW
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PDF Generation (inchangé par rapport à la version d'origine) ──

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

  drawCoverPage(
    doc,
    "Bilan thermique",
    `${batNom} — Zone climatique ${zoneClim}`,
    [
      ["Référence", reference],
      [
        "Date",
        new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ],
      ["Surface totale", `${fmt0(totalSurface)} m²`],
      ["Zones thermiques", `${nbZones}`],
      ["Méthode", "ISO 13790 — 5R1C — 8760h"],
    ],
    reference,
  );

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
      color: [234, 88, 12],
    },
    {
      label: "Besoin clim",
      value: `${fmt1(safeNum(bilan.total?.besoinClimMWh))} MWh/an`,
      sub: `${fmt0(safeNum(bilan.total?.besoinClimKWhM2))} kWh/m²·an`,
      color: [37, 99, 235],
    },
    {
      label: "Apports solaires",
      value: `${fmt1(safeNum(bilan.total?.apportsSolairesMWh))} MWh/an`,
      sub: "Gratuits (vitrages)",
      color: [217, 119, 6],
    },
    {
      label: "Apports internes",
      value: `${fmt1(safeNum(bilan.total?.apportsInternesMWh))} MWh/an`,
      sub: "Occupants + équipements",
      color: [124, 58, 237],
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
  const besoinTotal =
    safeNum(t?.besoinChauffageMWh) + safeNum(t?.besoinClimMWh);
  const pertesTotal =
    safeNum(t?.pertesEnveloppeMWh) + safeNum(t?.pertesVentilationMWh);
  const apportsTotal =
    safeNum(t?.apportsSolairesMWh) + safeNum(t?.apportsInternesMWh);

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
      0: {
        cellWidth: contentWidth - 80,
        fontStyle: "bold",
        textColor: PDF_COLORS.heading,
      },
      1: { cellWidth: 45, halign: "right" },
      2: { cellWidth: 35, halign: "right" },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;
  resetTextState(doc);

  if (bilan.zones.length > 0) {
    if (needsPageBreak(y, 60)) {
      doc.addPage();
      y = PDF_LAYOUT.topMargin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.heading);
    doc.text(
      sanitizePdfText("Répartition des besoins de chauffage par zone"),
      margin,
      y,
    );
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
      const truncated =
        doc.getTextWidth(label) > 60 ? label.slice(0, 22) + "…" : label;
      doc.text(truncated, margin, y + 3.5);
      doc.setFillColor(...PDF_COLORS.surface);
      doc.rect(margin + 65, y, barMaxW, 5, "F");
      doc.setFillColor(234, 88, 12);
      doc.rect(margin + 65, y, w, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.heading);
      doc.text(`${fmt1(v)} MWh`, pageWidth - margin, y + 3.5, {
        align: "right",
      });
      y += 7;
      if (needsPageBreak(y, 10)) {
        doc.addPage();
        y = PDF_LAYOUT.topMargin;
      }
    }
    y += 4;
  }

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
      {
        kicker: `ZONE ${String(zi + 1).padStart(2, "0")} / ${String(
          bilan.zones.length,
        ).padStart(2, "0")}`,
      },
    );
    y += 2;

    const recap: string[][] = [
      ["Surface", `${fmt0(safeNum(z.surface))} m²`],
      ["Besoin chauffage", `${fmt1(safeNum(r.besoinChauffageMWh))} MWh/an`],
      ["Besoin clim", `${fmt1(safeNum(r.besoinClimMWh))} MWh/an`],
      [
        "Puissance crête chauffage",
        `${fmt1(safeNum(r.puissanceCreteChauffage))} kW`,
      ],
      ["Puissance crête clim", `${fmt1(safeNum(r.puissanceCreteClim))} kW`],
      ["Heures de surchauffe", `${fmt0(safeNum(r.heuresSurchauffe))} h`],
      ["Apports solaires", `${fmt1(safeNum(r.apportsSolairesMWh))} MWh/an`],
      ["Apports internes", `${fmt1(safeNum(r.apportsInternesMWh))} MWh/an`],
      ["Pertes enveloppe", `${fmt1(safeNum(r.pertesEnveloppeMWh))} MWh/an`],
      [
        "Pertes ventilation",
        `${fmt1(safeNum(r.pertesVentilationMWh))} MWh/an`,
      ],
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
        0: {
          fontStyle: "bold",
          cellWidth: 70,
          textColor: PDF_COLORS.heading,
        },
        1: { halign: "right", cellWidth: contentWidth - 70 },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6;

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
        const pertes = u * surface;
        return [
          txt(zp.paroi?.nom) || "—",
          txt(zp.paroi?.type) || "—",
          txt(zp.orientation) || "—",
          `${fmt0(surface)} m²`,
          u > 0
            ? formatNumberPdf(u, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—",
          `${fmt1(pertes)} W/K`,
        ];
      });
      autoTable(doc, {
        startY: y,
        head: [
          [
            "Paroi",
            "Type",
            "Orientation",
            "Surface",
            "U (W/m²·K)",
            "Pertes (W/K)",
          ],
        ],
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
          0: {
            cellWidth: 50,
            fontStyle: "bold",
            textColor: PDF_COLORS.heading,
          },
          1: { cellWidth: 28 },
          2: { cellWidth: 24 },
          3: { cellWidth: 20, halign: "right" },
          4: { cellWidth: 24, halign: "right" },
          5: {
            cellWidth: contentWidth - 50 - 28 - 24 - 20 - 24,
            halign: "right",
          },
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
      "Le bilan repose sur le modèle 5R1C de la norme ISO 13790, simplifié à un nœud capacitif par zone.",
    ],
    [
      "Pas de temps",
      "La simulation est effectuée au pas horaire sur l'année entière (8760 heures).",
    ],
    [
      "Météo",
      `Météo synthétique générée pour la zone climatique ${zoneClim}.`,
    ],
    [
      "Apports gratuits",
      "Apports solaires calculés par orientation des vitrages.",
    ],
    ["Ventilation", "Débit constant en m³/h·m² (paramétré par zone)."],
    [
      "Limites du modèle",
      "Les ponts thermiques linéiques ne sont pas modélisés explicitement.",
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
    const lines = doc.splitTextToSize(
      sanitizePdfText(body),
      contentWidth,
    ) as string[];
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

  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, "Bilan thermique", reference, i - 1, totalPages - 1);
  }

  const safeName = batNom.replace(/[^a-zA-Z0-9-_]+/g, "_");
  const filename = `Bilan_thermique_${safeName}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}
