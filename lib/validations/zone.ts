import { z } from "zod";

export const ZONE_USAGES = [
  "BUREAUX",
  "OPEN_SPACE",
  "CIRCULATION",
  "ARCHIVES",
  "SALLE_REUNION",
  "SALLE_SERVEUR",
  "COMMERCE",
  "RESTAURATION",
  "LOGEMENT",
  "HALL_ACCUEIL",
  "TECHNIQUE",
  "AUTRE",
] as const;

export const zoneUsageSchema = z.enum(ZONE_USAGES);

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

export const createZoneSchema = z.object({
  batimentId: z.string().min(1, "Bâtiment requis"),
  nom: z.string().trim().min(1, "Le nom est requis"),
  usage: zoneUsageSchema,
  surface: decimalLike.refine((v) => v > 0, "Surface > 0 requise"),
  hauteurSousPlafond: decimalLike.refine((v) => v > 0, "HSP > 0 requise"),
  consigneChauffageOcc: decimalLike.optional(),
  consigneChauffageRed: decimalLike.optional(),
  consigneClimOcc: decimalLike.optional(),
  consigneClimRed: decimalLike.optional(),
  densiteOccupation: decimalLike.optional(),
  apportsParPersonne: decimalLike.optional(),
  apportsEquipements: decimalLike.optional(),
  apportsEclairage: decimalLike.optional(),
  qVmcM3hM2: decimalLike.optional(),
  efficaciteDoubleFlux: decimalLike.optional(),
  scenarioId: optionalString,
});

export const updateZoneSchema = createZoneSchema.partial();

const ORIENTATIONS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;

export const createZoneParoiSchema = z.object({
  paroiId: z.string().min(1, "Paroi requise"),
  surface: decimalLike.refine((v) => v > 0, "Surface > 0"),
  orientation: z
    .union([z.enum(ORIENTATIONS), z.null()])
    .optional()
    .transform((v) => v ?? null),
  inclinaison: optionalDecimal,
  cotePaire: z.boolean().optional().default(false),
});

export const updateZoneParoiSchema = createZoneParoiSchema
  .partial()
  .omit({ paroiId: true });

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type CreateZoneParoiInput = z.infer<typeof createZoneParoiSchema>;
export type UpdateZoneParoiInput = z.infer<typeof updateZoneParoiSchema>;
