import { z } from "zod";

export const PAROI_TYPES = [
  "MUR_EXT",
  "MUR_INT",
  "TOITURE",
  "PLANCHER_BAS",
  "PLANCHER_INTER",
  "VITRAGE",
  "PORTE",
] as const;

export const paroiTypeSchema = z.enum(PAROI_TYPES);

/**
 * Coef Rsi/Rse par défaut selon type (NF EN ISO 6946 §5.2 — flux horizontal,
 * vers le haut ou vers le bas). Valeurs en m²·K/W.
 */
export const RSI_RSE_DEFAULTS: Record<
  (typeof PAROI_TYPES)[number],
  { rsi: number; rse: number }
> = {
  MUR_EXT:        { rsi: 0.13, rse: 0.04 },
  MUR_INT:        { rsi: 0.13, rse: 0.13 },
  TOITURE:        { rsi: 0.10, rse: 0.04 },
  PLANCHER_BAS:   { rsi: 0.17, rse: 0.04 },
  PLANCHER_INTER: { rsi: 0.17, rse: 0.17 },
  VITRAGE:        { rsi: 0.13, rse: 0.04 },
  PORTE:          { rsi: 0.13, rse: 0.04 },
};

const decimalLike = z.union([
  z.number(),
  z.string().transform((v) => Number(v)),
]);

const optionalString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === undefined || v === null ? null : v.trim() || null));

export const coucheSchema = z.object({
  materiauId: z.string().min(1, "Matériau requis"),
  ordre: z.number().int().min(0),
  epaisseur: decimalLike.refine((v) => v > 0, "Épaisseur > 0 requise"),
});

export const createParoiSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis"),
  type: paroiTypeSchema,
  description: optionalString,
  rsi: decimalLike.refine((v) => v >= 0, "Rsi >= 0").optional(),
  rse: decimalLike.refine((v) => v >= 0, "Rse >= 0").optional(),
  couches: z.array(coucheSchema).default([]),
});

export const updateParoiSchema = createParoiSchema.partial();

export type CreateParoiInput = z.infer<typeof createParoiSchema>;
export type UpdateParoiInput = z.infer<typeof updateParoiSchema>;
export type CoucheInput = z.infer<typeof coucheSchema>;
