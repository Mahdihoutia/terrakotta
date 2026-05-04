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
  const H = 640;
  const { canvas, ctx } = createDomCanvas(W, H);

  setupBackground(ctx, W, H);

  // Kicker premium
  ctx.fillStyle = COLORS.rose;
  ctx.font = `700 11px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const kicker = "PRIORITÉ TRAVAUX";
  ctx.fillText(kicker, 60, 32);
  const kickerW = ctx.measureText(kicker).width;
  ctx.fillRect(60, 49, kickerW, 2);

  drawTitle(ctx, "Répartition des déperditions par paroi", 60, 56);
  drawSubtitle(
    ctx,
    "Postes classés par poids dans le bilan thermique — codage couleur par criticité",
    60, 90,
  );

  const items: Array<{ label: string; value: number }> = [
    { label: "Toiture / combles",  value: input.toiture },
    { label: "Murs extérieurs",    value: input.murs },
    { label: "Menuiseries",        value: input.menuiseries },
    { label: "Ponts thermiques",   value: input.pontsThermiques },
    { label: "Ventilation (VMC)",  value: input.ventilation },
    { label: "Plancher bas",       value: input.plancher },
    { label: "Infiltrations",      value: input.infiltrations },
  ];
  items.sort((a, b) => b.value - a.value);

  // Couleur sémantique par criticité (≥ 25 % rouge, ≥ 15 % ambre, sinon neutre)
  function priorityColor(v: number): string {
    if (v >= 25) return COLORS.rose;
    if (v >= 15) return COLORS.amber;
    return COLORS.blueDark;
  }
  function priorityLabel(v: number): string {
    if (v >= 25) return "Critique";
    if (v >= 15) return "Élevé";
    if (v >= 5)  return "Modéré";
    return "Faible";
  }

  const chartLeft = 270;
  const chartTop = 140;
  const chartRight = W - 200;
  const chartBottom = H - 70;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;
  const rowH = chartHeight / items.length;
  const barH = Math.min(32, rowH * 0.58);

  const maxValue = Math.max(35, Math.ceil((Math.max(...items.map((i) => i.value)) + 5) / 5) * 5);

  // Grille verticale (paliers 10 %)
  ctx.strokeStyle = COLORS.borderSoft;
  ctx.lineWidth = 1;
  ctx.font = `400 11px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = COLORS.bodyLight;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let v = 0; v <= maxValue; v += 10) {
    const x = chartLeft + (v / maxValue) * chartWidth;
    ctx.beginPath();
    ctx.moveTo(x, chartTop);
    ctx.lineTo(x, chartBottom);
    ctx.stroke();
    ctx.fillText(`${v}%`, x, chartBottom + 10);
  }

  // Barres avec rang + label + valeur + criticité
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const color = priorityColor(item.value);
    const cy = chartTop + rowH * i + rowH / 2;
    const yTop = cy - barH / 2;
    const w = (Math.max(0, item.value) / maxValue) * chartWidth;

    // Numéro de rang dans un cercle
    ctx.fillStyle = i === 0 ? COLORS.navy : COLORS.borderSoft;
    ctx.beginPath();
    ctx.arc(60, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i === 0 ? "#ffffff" : COLORS.bodyLight;
    ctx.font = `700 12px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${i + 1}`, 60, cy);

    // Label
    ctx.fillStyle = COLORS.navy;
    ctx.font = `600 14px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(item.label, 84, cy);

    // Track de fond (gris clair)
    ctx.fillStyle = COLORS.borderSoft;
    roundedRect(ctx, chartLeft, yTop, chartWidth, barH, 6);
    ctx.fill();

    // Barre colorée — gradient horizontal léger
    if (w > 0) {
      const grad = ctx.createLinearGradient(chartLeft, 0, chartLeft + w, 0);
      grad.addColorStop(0, mixColor(color, "#ffffff", 0.05));
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      roundedRect(ctx, chartLeft, yTop, w, barH, 6);
      ctx.fill();
    }

    // Valeur en %
    if (item.value > 0) {
      ctx.fillStyle = w > 70 ? "#ffffff" : COLORS.navy;
      ctx.font = `700 14px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
      ctx.textAlign = w > 70 ? "right" : "left";
      ctx.textBaseline = "middle";
      const tx = w > 70 ? chartLeft + w - 10 : chartLeft + w + 8;
      ctx.fillText(`${item.value.toFixed(0)} %`, tx, cy);
    }

    // Badge criticité à droite
    const badgeX = chartRight + 18;
    const badgeY = cy - 10;
    ctx.fillStyle = mixColor(color, "#ffffff", 0.85);
    roundedRect(ctx, badgeX, badgeY, 110, 20, 10);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = `700 10px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(priorityLabel(item.value).toUpperCase(), badgeX + 55, badgeY + 10);
  }

  // Axe vertical gauche (filet plein)
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(chartLeft, chartTop);
  ctx.lineTo(chartLeft, chartBottom);
  ctx.stroke();

  // Annotation pédagogique
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `400 11px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText(
    "Lecture : les postes en rouge représentent ≥ 25 % du bilan — priorité de traitement.",
    60, H - 28,
  );

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

  // Kicker + titre + sous-titre (hiérarchie premium)
  ctx.fillStyle = COLORS.blueDark;
  ctx.font = `700 11px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const kicker = "RÉPARTITION ANNUELLE";
  ctx.fillText(kicker, 60, 32);
  // Souligné kicker
  const kickerW = ctx.measureText(kicker).width;
  ctx.fillRect(60, 49, kickerW, 2);

  drawTitle(ctx, "Consommations par usage", 60, 56);
  drawSubtitle(ctx, "Décomposition de la consommation finale (kWh EF / an)", 60, 90);

  const data: Array<{ label: string; value: number; color: string }> = [
    { label: "Chauffage",       value: input.chauffage,       color: CATEGORICAL[0] },
    { label: "ECS",             value: input.ecs,             color: CATEGORICAL[1] },
    { label: "Refroidissement", value: input.refroidissement, color: CATEGORICAL[2] },
    { label: "Éclairage",       value: input.eclairage,       color: CATEGORICAL[3] },
    { label: "Auxiliaires",     value: input.auxiliaires,     color: CATEGORICAL[4] },
  ].filter((d) => d.value > 0);

  // Tri descendant pour mettre le poste dominant en premier (à 12h)
  data.sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const cx = W * 0.34;
  const cy = H * 0.56;
  const rOuter = 230;
  const rInner = 148;
  const gap = 0.012; // espacement angulaire entre tranches (radians)

  // Drop shadow subtil sous le donut
  ctx.save();
  ctx.shadowColor = "rgba(13, 27, 53, 0.12)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.surface;
  ctx.fill();
  ctx.restore();

  // Donut avec tranches espacées + gradient radial pour profondeur
  let startAngle = -Math.PI / 2;
  for (const slice of data) {
    const sweep = (slice.value / total) * Math.PI * 2;
    const a0 = startAngle + gap / 2;
    const a1 = startAngle + sweep - gap / 2;
    if (a1 <= a0) { startAngle += sweep; continue; }

    // Gradient radial : centre légèrement plus clair, bord plus saturé
    const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    grad.addColorStop(0, mixColor(slice.color, "#ffffff", 0.18));
    grad.addColorStop(1, slice.color);

    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, a0, a1);
    ctx.arc(cx, cy, rInner, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Étiquette % à l'intérieur de la tranche si > 8%
    const pct = (slice.value / total) * 100;
    if (pct > 8) {
      const mid = (a0 + a1) / 2;
      const lr = (rOuter + rInner) / 2;
      const lx = cx + Math.cos(mid) * lr;
      const ly = cy + Math.sin(mid) * lr;
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 16px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${pct.toFixed(0)}%`, lx, ly);
    }

    startAngle += sweep;
  }

  // Total au centre (typographie hiérarchisée)
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `600 11px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TOTAL ANNUEL", cx, cy - 34);

  ctx.fillStyle = COLORS.navy;
  ctx.font = `700 36px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.fillText(`${Math.round(total).toLocaleString("fr-FR")}`, cx, cy);

  ctx.fillStyle = COLORS.body;
  ctx.font = `500 13px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.fillText("kWh EF / an", cx, cy + 28);

  // Légende structurée à droite (carrés, libellé, valeur, %)
  const legendX = cx + rOuter + 90;
  const rowGap = 56;
  let legendY = cy - (data.length * rowGap) / 2;

  // Filet vertical séparateur
  ctx.strokeStyle = COLORS.borderSoft;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(legendX - 40, legendY - 10);
  ctx.lineTo(legendX - 40, legendY + data.length * rowGap - 30);
  ctx.stroke();

  for (const slice of data) {
    // Pastille colorée arrondie
    ctx.fillStyle = slice.color;
    roundedRect(ctx, legendX, legendY, 18, 18, 3);
    ctx.fill();

    // Libellé
    ctx.fillStyle = COLORS.navy;
    ctx.font = `600 15px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(slice.label, legendX + 32, legendY + 4);

    // Valeur (mono pour alignement)
    ctx.fillStyle = COLORS.body;
    ctx.font = `500 13px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    const pct = ((slice.value / total) * 100).toFixed(1);
    const valueText = `${Math.round(slice.value).toLocaleString("fr-FR")} kWh`;
    ctx.fillText(valueText, legendX + 32, legendY + 26);

    // Badge % à droite
    ctx.fillStyle = COLORS.bodyLight;
    ctx.font = `600 13px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(`${pct} %`, W - 80, legendY + 14);

    legendY += rowGap;
  }

  // Annotation poste dominant en bas
  const dominant = data[0];
  if (dominant) {
    const pctDom = ((dominant.value / total) * 100).toFixed(0);
    ctx.fillStyle = COLORS.bodyLight;
    ctx.font = `400 12px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `Le poste « ${dominant.label} » représente ${pctDom} % de la consommation totale`,
      cx,
      H - 36,
    );
  }

  return canvas.toDataURL("image/png");
}

/** Mélange deux couleurs hex en proportion (0=a, 1=b). */
function mixColor(a: string, b: string, t: number): string {
  const ah = a.replace("#", "");
  const bh = b.replace("#", "");
  const ar = parseInt(ah.slice(0, 2), 16);
  const ag = parseInt(ah.slice(2, 4), 16);
  const ab = parseInt(ah.slice(4, 6), 16);
  const br = parseInt(bh.slice(0, 2), 16);
  const bg = parseInt(bh.slice(2, 4), 16);
  const bb = parseInt(bh.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
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
  const H = 640;
  const { canvas, ctx } = createDomCanvas(W, H);

  setupBackground(ctx, W, H);

  // Kicker
  ctx.fillStyle = COLORS.blueDark;
  ctx.font = `700 11px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const kicker = "SAISON DE CHAUFFE";
  ctx.fillText(kicker, 60, 32);
  const kickerW = ctx.measureText(kicker).width;
  ctx.fillRect(60, 49, kickerW, 2);

  drawTitle(ctx, "Profil mensuel du besoin chauffage", 60, 56);
  drawSubtitle(
    ctx,
    `Méthode DJU mensuels — zone ${input.zone} · G = ${input.coefG.toFixed(2)} W/m³·K · V = ${input.volumeChauffe.toFixed(0)} m³`,
    60,
    90,
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
  const chartTop = 145;
  const chartRight = W - 60;
  const chartBottom = H - 80;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Bandeaux saisonniers (saison chauffe : OCT→AVR = mois 9-3)
  // OCT=9, NOV=10, DEC=11, JAN=0, FEV=1, MAR=2, AVR=3
  const stepXprep = chartWidth / 11;
  const winterMonths = [0, 1, 2, 3, 9, 10, 11];
  const isWinter = (i: number) => winterMonths.includes(i);
  for (let i = 0; i < 12; i++) {
    if (!isWinter(i)) continue;
    const x = chartLeft + (i - 0.5) * stepXprep;
    const w = stepXprep;
    ctx.fillStyle = "rgba(59, 130, 246, 0.04)";
    ctx.fillRect(Math.max(chartLeft, x), chartTop, Math.min(w, chartRight - x), chartHeight);
  }

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

  // Courbe lissée (Bezier) — points
  const pts: Array<{ x: number; y: number; v: number }> = [];
  for (let i = 0; i < 12; i++) {
    const x = chartLeft + i * stepX;
    const y = chartBottom - (besoinsKwh[i] / niceMax) * chartHeight;
    pts.push({ x, y, v: besoinsKwh[i] });
  }

  // Aire sous courbe avec gradient soft
  ctx.beginPath();
  ctx.moveTo(pts[0].x, chartBottom);
  ctx.lineTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const xc = (pts[i - 1].x + pts[i].x) / 2;
    const yc = (pts[i - 1].y + pts[i].y) / 2;
    ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.lineTo(pts[pts.length - 1].x, chartBottom);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
  grad.addColorStop(0, "rgba(37, 99, 235, 0.32)");
  grad.addColorStop(1, "rgba(37, 99, 235, 0.02)");
  ctx.fillStyle = grad;
  ctx.fill();

  // Courbe lissée
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const xc = (pts[i - 1].x + pts[i].x) / 2;
    const yc = (pts[i - 1].y + pts[i].y) / 2;
    ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.strokeStyle = COLORS.blueDark;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  // Points + valeur sur le pic
  let maxIdx = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].v > pts[maxIdx].v) maxIdx = i;
  for (let i = 0; i < pts.length; i++) {
    const isMax = i === maxIdx;
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, isMax ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = isMax ? COLORS.rose : COLORS.blueDark;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  // Annotation pic
  if (pts[maxIdx]) {
    const labelX = pts[maxIdx].x;
    const labelY = pts[maxIdx].y - 14;
    const text = `Pic ${Math.round(pts[maxIdx].v).toLocaleString("fr-FR")} kWh`;
    ctx.font = `700 12px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
    const tw = ctx.measureText(text).width + 14;
    ctx.fillStyle = COLORS.rose;
    roundedRect(ctx, labelX - tw / 2, labelY - 10, tw, 18, 9);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, labelX, labelY);
  }

  // Total saison de chauffe
  const totalSaisonChauffe = winterMonths.reduce((s, i) => s + besoinsKwh[i], 0);
  ctx.fillStyle = COLORS.bodyLight;
  ctx.font = `400 11px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `Saison de chauffe (oct → avr) : ${Math.round(totalSaisonChauffe).toLocaleString("fr-FR")} kWh — soit ${((totalSaisonChauffe / besoinsKwh.reduce((s, v) => s + v, 0)) * 100).toFixed(0)} % du besoin annuel`,
    chartLeft, H - 40,
  );

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
