import { z } from "zod";

export const MATERIAU_CATEGORIES = [
  "STRUCTURE",
  "ISOLANT",
  "FINITION",
  "VITRAGE",
  "LAME_AIR",
  "MEMBRANE",
  "AUTRE",
] as const;

export const materiauCategorieSchema = z.enum(MATERIAU_CATEGORIES);

const decimalLike = z.union([
  z.number(),
  z.string().transform((v) => Number(v)),
]);

const optionalDecimal = z
  .union([decimalLike, z.null()])
  .optional()
  .transform((v) => (v === undefined || v === null ? null : v));

const optionalString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === undefined || v === null ? null : v.trim() || null));

export const createMateriauSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis"),
  categorie: materiauCategorieSchema,
  marque: optionalString,
  reference: optionalString,
  conductivite: decimalLike.refine((v) => v >= 0, "λ doit être positif"),
  masseVolumique: decimalLike.refine((v) => v > 0, "ρ doit être > 0"),
  capaciteThermique: decimalLike.refine((v) => v >= 0, "c doit être positif"),
  resistanceVapeur: optionalDecimal,
  resistanceFixe: optionalDecimal,
  carboneACV: optionalDecimal,
  carboneFinDeVie: optionalDecimal,
  origineFdes: optionalString,
  source: optionalString,
  notes: optionalString,
});

export const updateMateriauSchema = createMateriauSchema.partial();

export type CreateMateriauInput = z.infer<typeof createMateriauSchema>;
export type UpdateMateriauInput = z.infer<typeof updateMateriauSchema>;
