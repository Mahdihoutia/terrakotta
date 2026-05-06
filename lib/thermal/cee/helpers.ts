/**
 * Helpers partagés entre toutes les fiches CEE.
 * Pas de React, pas de DOM. Ré-exporte les types/fonctions des fiches.
 */
import { FACTEUR_CO2, RENDEMENTS_GENERATEURS } from "../constants";

export function zoneToHKey(zone: string | undefined): "H1" | "H2" | "H3" {
  if (!zone) return "H2";
  if (zone.startsWith("H1")) return "H1";
  if (zone.startsWith("H3")) return "H3";
  return "H2";
}

export function rendementGenerateur(type: string | undefined): number {
  if (!type) return 0.85;
  return RENDEMENTS_GENERATEURS[type] ?? 0.85;
}

export function rendementEmetteursFrom(type: string | undefined): number {
  if (!type) return 0.90;
  const t = type.toLowerCase();
  if (t.includes("plancher chauffant")) return 0.98;
  if (t.includes("basse temp")) return 0.95;
  if (t.includes("moyenne temp")) return 0.92;
  if (t.includes("haute temp")) return 0.88;
  if (t.includes("ventilo")) return 0.93;
  return 0.90;
}

export function facteurCo2Lookup(energie: string | undefined): number {
  if (!energie) return 0.200;
  return FACTEUR_CO2[energie] ?? 0.200;
}

/** Parse safe d'un nombre, retourne `fallback` si invalide ou ≤ 0. */
export function num(input: unknown, fallback = 0): number {
  const v = typeof input === "number" ? input : parseFloat(String(input ?? ""));
  return Number.isFinite(v) ? v : fallback;
}
