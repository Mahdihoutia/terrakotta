/**
 * Helpers de sérialisation pour les matériaux et parois.
 * Extraits hors des fichiers route.ts car Next.js 15 App Router
 * n'autorise QUE les exports HTTP (GET, POST, …) dans `route.ts`.
 */

export interface MateriauRow {
  id: string;
  nom: string;
  categorie: string;
  marque: string | null;
  reference: string | null;
  conductivite: unknown;
  masseVolumique: unknown;
  capaciteThermique: unknown;
  resistanceVapeur: unknown;
  resistanceFixe: unknown;
  carboneACV: unknown;
  carboneFinDeVie: unknown;
  origineFdes: string | null;
  source: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function serializeMateriau(m: MateriauRow) {
  return {
    id: m.id,
    nom: m.nom,
    categorie: m.categorie,
    marque: m.marque,
    reference: m.reference,
    conductivite: num(m.conductivite) ?? 0,
    masseVolumique: num(m.masseVolumique) ?? 0,
    capaciteThermique: num(m.capaciteThermique) ?? 0,
    resistanceVapeur: num(m.resistanceVapeur),
    resistanceFixe: num(m.resistanceFixe),
    carboneACV: num(m.carboneACV),
    carboneFinDeVie: num(m.carboneFinDeVie),
    origineFdes: m.origineFdes,
    source: m.source,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}
