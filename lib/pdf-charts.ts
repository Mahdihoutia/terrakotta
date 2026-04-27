/**
 * Canvas-based chart rendering for embedding in jsPDF documents.
 *
 * Each function renders a chart on an offscreen 2D canvas and returns a PNG
 * data URL ready for `doc.addImage(...)`. Charts are designed to be embedded
 * at ~170mm width in the PDF — source resolution 1200px wide gives crisp
 * print quality.
 *
 * Style targets: Linear / Stripe — sober palette, generous whitespace,
 * minimal chartjunk, single emphasis level per chart.
 */

import {
  DJU_MENSUEL_RATIO,
  MOIS_LABELS_FR,
  ZONE_CLIMATIQUE_DATA,
  parseZone,
} from "./thermal/zones";

// ─── Couleurs (inspirées de PDF_COLORS, valeurs hex pour canvas) ─────

const COLORS = {
  navy:        "#0D1B35",
  navyMuted:   "#3A4B6B",
  body:        "#6B5B50",
  bodyLight:   "#96887E",
  border:      "#E0E4EA",
  borderSoft:  "#EEF1F5",
  surface:     "#FCFCFD",
  blue:        "#3B82F6",
  blueDark:    "#2563EB",
  blueLight:   "#93C5FD",
  amber:       "#F59E0B",
  emerald:     "#10B981",
  rose:        "#E11D48",
  violet:      "#8B5CF6",
  sky:         "#0EA5E9",
} as const;

// Palette catégorielle pour le camembert (postes).
const CATEGORICAL = [
  COLORS.blueDark,
  COLORS.sky,
  COLORS.violet,
  COLORS.amber,
  COLORS.body,
] as const;

interface CanvasBundle {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

function createCanvas(width: number, height: number): CanvasBundle {
  // OffscreenCanvas not available in older Safari — fallback to DOM.
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("OffscreenCanvas 2D context unavailable");
    return { canvas, ctx };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  return { canvas, ctx };
}

async function toPngDataUrl(bundle: CanvasBundle): Promise<string> {
  if (bundle.canvas instanceof OffscreenCanvas) {
    const blob = await bundle.canvas.convertToBlob({ type: "image/png" });
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  return bundle.canvas.toDataURL("image/png");
}

/**
 * Variante synchrone pour les contextes où on ne peut pas await (le pipeline
 * jsPDF actuel est synchrone). Utilise un canvas DOM et `toDataURL`.
 */
function createDomCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  // Anti-aliasing par défaut sur tous les navigateurs ; smoothing désactivé
  // explicitement pour les remplissages de barres pour des bords nets, mais
  // on laisse activé pour les textes et lignes.
  return { canvas, ctx };
}

// Typed helpers ───────────────────────────────────────────────────────

function setupBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = COLORS.surface;
  ctx.fillRect(0, 0, width, height);
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 22,
): void {
  ctx.fillStyle = COLORS.navy;
  ctx.font = `600 ${size}px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 14,
): void {
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `400 ${size}px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}

// ─── 1. Histogramme déperditions (barres horizontales, %) ────────────

export interface DeperditionsChartInput {
  murs: number;
  toiture: number;
  plancher: number;
  menuiseries: number;
  pontsThermiques: number;
  ventilation: number;
  infiltrations: number;
}

/**
 * Histogramme horizontal des déperditions par paroi (en %).
 * Dimensions cibles : 1200 × 600.
 */
export function renderDeperditionsChart(input: DeperditionsChartInput): string {
  const W = 1200;
  const H = 600;
  const { canvas, ctx } = createDomCanvas(W, H);

  setupBackground(ctx, W, H);

  drawTitle(ctx, "Répartition des déperditions par paroi", 60, 36);
  drawSubtitle(ctx, "Part en pourcentage du total des déperditions thermiques", 60, 70);

  const items: Array<{ label: string; value: number; color: string }> = [
    { label: "Toiture / combles",  value: input.toiture,         color: COLORS.rose },
    { label: "Murs extérieurs",    value: input.murs,            color: COLORS.amber },
    { label: "Menuiseries",        value: input.menuiseries,     color: COLORS.violet },
    { label: "Ponts thermiques",   value: input.pontsThermiques, color: COLORS.sky },
    { label: "Ventilation (VMC)",  value: input.ventilation,     color: COLORS.blueDark },
    { label: "Plancher bas",       value: input.plancher,        color: COLORS.body },
    { label: "Infiltrations",      value: input.infiltrations,   color: COLORS.emerald },
  ];

  // Ordre décroissant pour la lisibilité.
  items.sort((a, b) => b.value - a.value);

  const chartLeft = 280;
  const chartTop = 130;
  const chartRight = W - 80;
  const chartBottom = H - 60;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const rowH = chartHeight / items.length;
  const barH = Math.min(28, rowH * 0.55);

  const maxValue = Math.max(35, Math.ceil((Math.max(...items.map((i) => i.value)) + 5) / 5) * 5);

  // Grille verticale (par paliers de 10 %)
  ctx.strokeStyle = COLORS.borderSoft;
  ctx.lineWidth = 1;
  ctx.font = `400 12px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = COLORS.bodyLight;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const step = 10;
  for (let v = 0; v <= maxValue; v += step) {
    const x = chartLeft + (v / maxValue) * chartWidth;
    ctx.beginPath();
    ctx.moveTo(x, chartTop);
    ctx.lineTo(x, chartBottom);
    ctx.stroke();
    ctx.fillText(`${v}%`, x, chartBottom + 8);
  }

  // Barres
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const cy = chartTop + rowH * i + rowH / 2;
    const yTop = cy - barH / 2;
    const w = (Math.max(0, item.value) / maxValue) * chartWidth;

    // Label à gauche
    ctx.fillStyle = COLORS.navy;
    ctx.font = `500 14px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(item.label, chartLeft - 16, cy);

    // Barre
    ctx.fillStyle = item.color;
    roundedRect(ctx, chartLeft, yTop, w, barH, 4);
    ctx.fill();

    // Valeur
    if (item.value > 0) {
      ctx.fillStyle = w > 60 ? "#ffffff" : COLORS.navy;
      ctx.font = `600 13px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
      ctx.textAlign = w > 60 ? "right" : "left";
      ctx.textBaseline = "middle";
      const tx = w > 60 ? chartLeft + w - 8 : chartLeft + w + 8;
      ctx.fillText(`${item.value.toFixed(0)} %`, tx, cy);
    }
  }

  // Axe vertical gauche
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartBottom);
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

// ─── 2. Camembert répartition postes ─────────────────────────────────

export interface PostesChartInput {
  chauffage: number;
  ecs: number;
  refroidissement: number;
  eclairage: number;
  auxiliaires: number;
}

/**
 * Camembert (donut) de la répartition des consommations par poste.
 * Dimensions cibles : 1200 × 800.
 */
export function renderPostesChart(input: PostesChartInput): string {
  const W = 1200;
  const H = 800;
  const { canvas, ctx } = createDomCanvas(W, H);

  setupBackground(ctx, W, H);

  drawTitle(ctx, "Répartition des consommations par poste", 60, 36);
  drawSubtitle(ctx, "Part de chaque usage dans la consommation totale (kWh)", 60, 70);

  const data: Array<{ label: string; value: number; color: string }> = [
    { label: "Chauffage",       value: input.chauffage,       color: CATEGORICAL[0] },
    { label: "ECS",             value: input.ecs,             color: CATEGORICAL[1] },
    { label: "Refroidissement", value: input.refroidissement, color: CATEGORICAL[2] },
    { label: "Éclairage",       value: input.eclairage,       color: CATEGORICAL[3] },
    { label: "Auxiliaires",     value: input.auxiliaires,     color: CATEGORICAL[4] },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const cx = W * 0.36;
  const cy = H * 0.55;
  const rOuter = 220;
  const rInner = 130;

  // Donut
  let startAngle = -Math.PI / 2;
  for (const slice of data) {
    const sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rOuter, startAngle, startAngle + sweep);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    startAngle += sweep;
  }

  // Trou central
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.surface;
  ctx.fill();

  // Total au centre
  ctx.fillStyle = COLORS.navy;
  ctx.font = `700 28px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(total).toLocaleString("fr-FR")}`, cx, cy - 10);
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `500 14px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.fillText("kWh / an", cx, cy + 22);

  // Légende à droite
  const legendX = cx + rOuter + 90;
  let legendY = cy - (data.length * 38) / 2;
  for (const slice of data) {
    ctx.fillStyle = slice.color;
    roundedRect(ctx, legendX, legendY, 22, 22, 4);
    ctx.fill();

    ctx.fillStyle = COLORS.navy;
    ctx.font = `600 16px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(slice.label, legendX + 36, legendY + 6);

    ctx.fillStyle = COLORS.bodyLight;
    ctx.font = `400 13px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    const pct = ((slice.value / total) * 100).toFixed(1);
    ctx.fillText(
      `${Math.round(slice.value).toLocaleString("fr-FR")} kWh · ${pct} %`,
      legendX + 36,
      legendY + 26,
    );

    legendY += 50;
  }

  return canvas.toDataURL("image/png");
}

// ─── 3. Courbe besoins mensuels chauffage ────────────────────────────

export interface BesoinsMensuelsInput {
  zone: string;          // "H1a — Nord"
  coefG: number;         // W/m³·K
  volumeChauffe: number; // m³
}

/**
 * Courbe des besoins de chauffage mensuels (12 mois).
 *
 * Calcul : besoin_mois (kWh) = G × V × DJU_mois × 24 / 1000
 * où DJU_mois = DJU_annuel × ratio_mensuel.
 *
 * Dimensions : 1200 × 600.
 */
export function renderBesoinsMensuelsChart(input: BesoinsMensuelsInput): string {
  const W = 1200;
  const H = 600;
  const { canvas, ctx } = createDomCanvas(W, H);

  setupBackground(ctx, W, H);

  drawTitle(ctx, "Besoins de chauffage mensuels", 60, 36);
  drawSubtitle(
    ctx,
    `Estimation à partir des DJU mensuels (zone ${input.zone}) — G = ${input.coefG.toFixed(2)} W/m³·K, V = ${input.volumeChauffe.toFixed(0)} m³`,
    60,
    70,
  );

  // Récupère DJU annuel pour la zone.
  const zoneCode = parseZone(input.zone);
  const zoneEntry = Object.entries(ZONE_CLIMATIQUE_DATA).find(
    ([key]) => parseZone(key) === zoneCode,
  );
  const djuAnnuel = zoneEntry ? zoneEntry[1].dju : 2500;

  const besoinsKwh = DJU_MENSUEL_RATIO.map((ratio) => {
    const djuMois = djuAnnuel * ratio;
    return (input.coefG * input.volumeChauffe * djuMois * 24) / 1000;
  });

  const maxBesoin = Math.max(...besoinsKwh, 1);
  // Échelle arrondie au millier supérieur pour des valeurs lisibles.
  const niceMax = Math.ceil(maxBesoin / 500) * 500;

  const chartLeft = 100;
  const chartTop = 130;
  const chartRight = W - 60;
  const chartBottom = H - 70;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Grille horizontale
  ctx.strokeStyle = COLORS.borderSoft;
  ctx.lineWidth = 1;
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `400 12px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const ySteps = 5;
  for (let s = 0; s <= ySteps; s++) {
    const v = (niceMax * s) / ySteps;
    const y = chartBottom - (s / ySteps) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
    ctx.fillText(`${Math.round(v).toLocaleString("fr-FR")}`, chartLeft - 10, y);
  }

  // Axe X labels
  const stepX = chartWidth / 11;
  ctx.fillStyle = COLORS.bodyLight;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < 12; i++) {
    const x = chartLeft + i * stepX;
    ctx.fillText(MOIS_LABELS_FR[i], x, chartBottom + 12);
  }

  // Aire sous courbe
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartBottom);
  for (let i = 0; i < 12; i++) {
    const x = chartLeft + i * stepX;
    const y = chartBottom - (besoinsKwh[i] / niceMax) * chartHeight;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(chartRight, chartBottom);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
  grad.addColorStop(0, "rgba(59,130,246,0.28)");
  grad.addColorStop(1, "rgba(59,130,246,0.02)");
  ctx.fillStyle = grad;
  ctx.fill();

  // Courbe
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const x = chartLeft + i * stepX;
    const y = chartBottom - (besoinsKwh[i] / niceMax) * chartHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = COLORS.blueDark;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Points + valeurs
  for (let i = 0; i < 12; i++) {
    const x = chartLeft + i * stepX;
    const y = chartBottom - (besoinsKwh[i] / niceMax) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.blueDark;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartBottom);
  ctx.lineTo(chartRight, chartBottom);
  ctx.stroke();

  // Label Y
  ctx.save();
  ctx.translate(36, chartTop + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `500 13px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("kWh / mois", 0, 0);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

// ─── 4. Comparatif scénarios (barres empilées) ───────────────────────

export interface ComparatifScenarioInput {
  consoActuelle: number; // kWh EP/m²/an
  scenario1: { gain: number; nom: string }; // gain en %
  scenario2: { gain: number; nom: string };
}

/**
 * Comparatif barres : conso actuelle vs projection après chaque scénario.
 * Dimensions : 1200 × 700.
 */
export function renderComparatifScenarioChart(input: ComparatifScenarioInput): string {
  const W = 1200;
  const H = 700;
  const { canvas, ctx } = createDomCanvas(W, H);

  setupBackground(ctx, W, H);

  drawTitle(ctx, "Comparatif des scénarios — consommation projetée", 60, 36);
  drawSubtitle(ctx, "Énergie primaire (kWh EP/m²·an) — situation actuelle vs après travaux", 60, 70);

  const conso1 = Math.max(0, input.consoActuelle * (1 - input.scenario1.gain / 100));
  const conso2 = Math.max(0, input.consoActuelle * (1 - input.scenario2.gain / 100));

  const bars: Array<{ label: string; sub?: string; value: number; color: string; gainLabel?: string }> = [
    { label: "Situation actuelle", value: input.consoActuelle, color: COLORS.rose },
    {
      label: input.scenario1.nom,
      sub: "Après travaux",
      value: conso1,
      color: COLORS.amber,
      gainLabel: `−${input.scenario1.gain.toFixed(0)} %`,
    },
    {
      label: input.scenario2.nom,
      sub: "Après travaux",
      value: conso2,
      color: COLORS.emerald,
      gainLabel: `−${input.scenario2.gain.toFixed(0)} %`,
    },
  ];

  const chartLeft = 120;
  const chartTop = 140;
  const chartRight = W - 80;
  const chartBottom = H - 100;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const niceMax = Math.ceil(input.consoActuelle / 50) * 50 || 100;
  const barWidth = 140;
  const slotWidth = chartWidth / bars.length;

  // Grille horizontale
  ctx.strokeStyle = COLORS.borderSoft;
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `400 12px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const ySteps = 5;
  for (let s = 0; s <= ySteps; s++) {
    const v = (niceMax * s) / ySteps;
    const y = chartBottom - (s / ySteps) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();
    ctx.fillText(`${Math.round(v)}`, chartLeft - 10, y);
  }

  // Barres
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const cx = chartLeft + slotWidth * i + slotWidth / 2;
    const x = cx - barWidth / 2;
    const h = (bar.value / niceMax) * chartHeight;
    const y = chartBottom - h;

    // Ombre subtile
    ctx.fillStyle = "rgba(13,27,53,0.06)";
    roundedRect(ctx, x + 2, y + 4, barWidth, h, 6);
    ctx.fill();

    ctx.fillStyle = bar.color;
    roundedRect(ctx, x, y, barWidth, h, 6);
    ctx.fill();

    // Valeur au-dessus
    ctx.fillStyle = COLORS.navy;
    ctx.font = `700 18px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${Math.round(bar.value)} kWh`, cx, y - 10);

    if (bar.gainLabel) {
      ctx.fillStyle = COLORS.emerald;
      ctx.font = `600 14px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
      ctx.fillText(bar.gainLabel, cx, y - 32);
    }

    // Label en bas
    ctx.fillStyle = COLORS.navy;
    ctx.font = `600 14px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(bar.label, cx, chartBottom + 14);
    if (bar.sub) {
      ctx.fillStyle = COLORS.bodyLight;
      ctx.font = `400 12px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
      ctx.fillText(bar.sub, cx, chartBottom + 34);
    }
  }

  // Axes
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartBottom);
  ctx.lineTo(chartRight, chartBottom);
  ctx.stroke();

  // Label Y
  ctx.save();
  ctx.translate(40, chartTop + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `500 13px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("kWh EP / m²·an", 0, 0);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

// ─── Helper: rounded rect ────────────────────────────────────────────

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Garde l'export de `toPngDataUrl` / `createCanvas` pour usages futurs (tests).
export const _internal = { createCanvas, toPngDataUrl };
