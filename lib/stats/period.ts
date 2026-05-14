import type { CategorieCible } from "@prisma/client";

export type PeriodKey = "YTD" | "12M" | "N-1" | "T1" | "T2" | "T3" | "T4";
export type TabKey = "projets" | "leads" | "revenus" | "aides";

export interface PeriodRange {
  key: PeriodKey;
  start: Date;
  end: Date;
  label: string;
}

const ALL_PERIODS: PeriodKey[] = ["YTD", "12M", "N-1", "T1", "T2", "T3", "T4"];
const ALL_TABS: TabKey[] = ["projets", "leads", "revenus", "aides"];
const ALL_CATEGORIES: CategorieCible[] = [
  "PARTICULIER",
  "RESIDENTIEL_COLLECTIF",
  "TERTIAIRE",
  "INDUSTRIE",
  "AGRICULTURE",
];

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  YTD: "Année en cours",
  "12M": "12 mois glissants",
  "N-1": "Année précédente",
  T1: "T1 (jan–mar)",
  T2: "T2 (avr–juin)",
  T3: "T3 (juil–sep)",
  T4: "T4 (oct–déc)",
};

export const CATEGORIE_LABELS: Record<CategorieCible, string> = {
  PARTICULIER: "Particulier",
  RESIDENTIEL_COLLECTIF: "Résidentiel collectif",
  TERTIAIRE: "Tertiaire",
  INDUSTRIE: "Industrie",
  AGRICULTURE: "Agriculture",
};

export function parsePeriod(input: string | undefined, now: Date = new Date()): PeriodRange {
  const key: PeriodKey = (ALL_PERIODS as string[]).includes(input ?? "")
    ? (input as PeriodKey)
    : "YTD";
  const year = now.getFullYear();
  switch (key) {
    case "YTD": {
      const start = new Date(year, 0, 1);
      const end = endOfDay(now);
      return { key, start, end, label: PERIOD_LABELS[key] };
    }
    case "12M": {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 12);
      start.setHours(0, 0, 0, 0);
      return { key, start, end: endOfDay(now), label: PERIOD_LABELS[key] };
    }
    case "N-1": {
      const start = new Date(year - 1, 0, 1);
      const end = new Date(year - 1, 11, 31, 23, 59, 59, 999);
      return { key, start, end, label: PERIOD_LABELS[key] };
    }
    case "T1":
      return { key, start: new Date(year, 0, 1), end: new Date(year, 2, 31, 23, 59, 59, 999), label: PERIOD_LABELS[key] };
    case "T2":
      return { key, start: new Date(year, 3, 1), end: new Date(year, 5, 30, 23, 59, 59, 999), label: PERIOD_LABELS[key] };
    case "T3":
      return { key, start: new Date(year, 6, 1), end: new Date(year, 8, 30, 23, 59, 59, 999), label: PERIOD_LABELS[key] };
    case "T4":
      return { key, start: new Date(year, 9, 1), end: new Date(year, 11, 31, 23, 59, 59, 999), label: PERIOD_LABELS[key] };
  }
}

export function parseTab(input: string | undefined): TabKey {
  return (ALL_TABS as string[]).includes(input ?? "") ? (input as TabKey) : "projets";
}

export function parseCategories(input: string | string[] | undefined): CategorieCible[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input.join(",") : input;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.filter((p): p is CategorieCible =>
    (ALL_CATEGORIES as string[]).includes(p),
  );
}

export function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

export { ALL_CATEGORIES, ALL_PERIODS, ALL_TABS };
