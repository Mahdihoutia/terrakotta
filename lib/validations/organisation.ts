import { z } from "zod";

const certificationSchema = z.object({
  nom: z.string().min(1),
  numero: z.string().optional().nullable(),
  validite: z.string().datetime({ offset: true }).optional().nullable(),
});

/** Payload d'écriture (PATCH) — tous les champs optionnels (upsert partiel). */
export const updateOrganisationSchema = z.object({
  raisonSociale: z.string().min(1).optional(),
  formeJuridique: z.string().optional().nullable(),
  siret: z
    .string()
    .regex(/^\d{14}$/, "SIRET = 14 chiffres")
    .optional()
    .nullable()
    .or(z.literal("")),
  codeApe: z.string().optional().nullable(),
  capital: z.number().nonnegative().optional().nullable(),
  adresse: z.string().optional().nullable(),
  codePostal: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  pays: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  telephone: z.string().optional().nullable(),
  siteWeb: z.string().url().optional().nullable().or(z.literal("")),
  regimeTVA: z.enum(["NORMAL", "FRANCHISE_BASE", "REEL_SIMPLIFIE", "REEL_NORMAL"]).optional().nullable(),
  mentionTVA: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  bic: z.string().optional().nullable(),
  banqueNom: z.string().optional().nullable(),
  rgeNumero: z.string().optional().nullable(),
  rgeValiditeJusqu: z.string().datetime({ offset: true }).optional().nullable(),
  decennaleCompagnie: z.string().optional().nullable(),
  decennalePolice: z.string().optional().nullable(),
  rcpCompagnie: z.string().optional().nullable(),
  rcpPolice: z.string().optional().nullable(),
  certifications: z.array(certificationSchema).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  couleurAccent: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format hex requis (#RRGGBB)")
    .optional()
    .nullable()
    .or(z.literal("")),
  conditionsPaiement: z.string().optional().nullable(),
  cgvUrl: z.string().url().optional().nullable().or(z.literal("")),
  // Préférences numérotation
  prefixDevis: z
    .string()
    .regex(/^[A-Z0-9]{1,6}$/, "1-6 lettres ou chiffres en majuscules")
    .optional()
    .nullable()
    .or(z.literal("")),
  prefixFacture: z
    .string()
    .regex(/^[A-Z0-9]{1,6}$/, "1-6 lettres ou chiffres en majuscules")
    .optional()
    .nullable()
    .or(z.literal("")),
  formatAnnee: z.enum(["ANNEE_4", "ANNEE_2"]).optional().nullable(),
  paddingNumero: z.number().int().min(2).max(6).optional().nullable(),
  // Défauts fiscaux
  tvaDefaut: z.number().min(0).max(100).optional().nullable(),
  delaiPaiementJours: z.number().int().min(0).max(365).optional().nullable(),
  penaliteRetardTaux: z.number().min(0).max(100).optional().nullable(),
});

export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
