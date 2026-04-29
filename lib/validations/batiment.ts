import { z } from "zod";
import { ZONE_CLIMATIQUE_DATA } from "@/lib/thermal/zones";

const ZONE_CLIMATIQUES = Object.keys(ZONE_CLIMATIQUE_DATA) as [
  string,
  ...string[],
];

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

export const createBatimentSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis"),
  description: optionalString,
  zoneClimatique: z.enum(ZONE_CLIMATIQUES).or(z.string().min(1)),
  altitude: optionalDecimal,
  orientation: optionalString,
  projetId: optionalString,
  auditDocumentId: optionalString,
});

export const updateBatimentSchema = createBatimentSchema.partial();

export type CreateBatimentInput = z.infer<typeof createBatimentSchema>;
export type UpdateBatimentInput = z.infer<typeof updateBatimentSchema>;
