import { z } from "zod";

export const FACTURE_STATUTS = [
  "BROUILLON",
  "EMISE",
  "PAYEE_PARTIELLEMENT",
  "PAYEE",
  "EN_RETARD",
  "ANNULEE",
] as const;

export const ligneFactureSchema = z.object({
  designation: z.string().min(1, "La désignation est requise"),
  unite: z.string().default("U"),
  quantite: z.number().default(1),
  prixUnitHT: z.number().min(0, "Le prix unitaire doit être positif"),
  tauxTVA: z.number().default(20),
  ordre: z.number().int().default(0),
});

export const createFactureSchema = z.object({
  objet: z.string().optional(),
  statut: z.enum(FACTURE_STATUTS).default("BROUILLON"),
  montantHT: z.number().min(0, "Le montant HT doit être positif"),
  tauxTVA: z.number().default(20),
  dateEcheance: z.string().datetime({ offset: true }).nullable().optional(),
  datePaiement: z.string().datetime({ offset: true }).nullable().optional(),
  modePaiement: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  clientId: z.string().min(1, "Le client est requis"),
  projetId: z.string().nullable().optional(),
  lignes: z.array(ligneFactureSchema).optional(),
});

export const updateFactureSchema = z.object({
  objet: z.string().nullable().optional(),
  statut: z.enum(FACTURE_STATUTS).optional(),
  montantHT: z.number().min(0).optional(),
  tauxTVA: z.number().optional(),
  dateEcheance: z.string().datetime({ offset: true }).nullable().optional(),
  datePaiement: z.string().datetime({ offset: true }).nullable().optional(),
  modePaiement: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  clientId: z.string().min(1).optional(),
  projetId: z.string().nullable().optional(),
  lignes: z.array(ligneFactureSchema).optional(),
});

export type CreateFactureInput = z.infer<typeof createFactureSchema>;
export type UpdateFactureInput = z.infer<typeof updateFactureSchema>;
