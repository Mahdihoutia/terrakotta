import { z } from "zod";

export const OCCUPATION_CODES = ["OCC", "RED", "INOCC"] as const;
export const occupationCodeSchema = z.enum(OCCUPATION_CODES);

/** Pattern 7 jours × 24 heures de codes d'occupation. */
export const patternSchema = z
  .array(z.array(occupationCodeSchema).length(24))
  .length(7);

const optionalString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === undefined || v === null ? null : v.trim() || null));

export const createScenarioSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis"),
  description: optionalString,
  pattern: patternSchema,
});

export const updateScenarioSchema = createScenarioSchema.partial();

export type OccupationCode = z.infer<typeof occupationCodeSchema>;
export type OccupationPattern = z.infer<typeof patternSchema>;
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;

/** Parse safe d'un patternJson stocké en base. Retourne null si invalide. */
export function parsePatternJson(raw: string): OccupationPattern | null {
  try {
    const v = JSON.parse(raw);
    const parsed = patternSchema.safeParse(v);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
