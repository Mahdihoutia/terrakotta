import { z } from "zod";

/** Normalise une cellule brute (string, number, null) en string trim ou null. */
function cellToString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = typeof v === "string" ? v : String(v);
  const t = s.trim();
  return t.length === 0 ? null : t;
}

const optionalString = z
  .unknown()
  .transform(cellToString)
  .pipe(z.string().nullable());

const optionalEmail = z
  .unknown()
  .transform(cellToString)
  .pipe(z.string().email("Adresse email invalide").nullable());

export const ContactImportRow = z.object({
  nom: z
    .unknown()
    .transform(cellToString)
    .pipe(z.string().min(1, "Le nom est requis")),
  prenom: optionalString,
  email: optionalEmail,
  telephone: optionalString,
  raisonSociale: optionalString,
  fonction: optionalString,
  notes: optionalString,
});

export type ContactImportRow = z.infer<typeof ContactImportRow>;
