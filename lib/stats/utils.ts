export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function diffDays(later: Date, earlier: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / 86_400_000);
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)} %`;
}

export function formatJours(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)} j`;
}

export function formatDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

/** Génère une liste contiguë de mois entre start et end (bornes incluses), clé YYYY-MM. */
export function monthlyBuckets(start: Date, end: Date): { key: string; label: string; start: Date; end: Date }[] {
  const buckets: { key: string; label: string; start: Date; end: Date }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const stop = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= stop) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const bStart = new Date(y, m, 1);
    const bEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
    buckets.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: `${MONTHS_FR[m]} ${String(y).slice(2)}`,
      start: bStart,
      end: bEnd,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

/** Renvoie la clé YYYY-MM d'une date. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** 12 derniers mois glissants finissant au mois courant. */
export function rollingTwelveMonths(now: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return { start, end };
}
