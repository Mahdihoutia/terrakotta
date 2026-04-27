import { z } from "zod";

/**
 * Catégories suggérées pour la bibliothèque de postes.
 * Le champ reste libre côté DB pour permettre des catégories personnalisées,
 * mais ces valeurs cadrent les filtres et l'autocomplétion UI.
 */
export const POSTE_CATEGORIES = [
  "Audit",
  "Maîtrise d'œuvre",
  "Isolation",
  "Chauffage",
  "Ventilation",
  "Plomberie",
  "Électricité",
  "AMO",
  "Études",
  "Autre",
] as const;

export const createPosteCatalogueSchema = z.object({
  designation: z.string().trim().min(1, "La désignation est requise"),
  categorie: z.string().trim().nullable().optional(),
  unite: z.string().trim().min(1).default("U"),
  prixUnitHT: z.number().min(0, "Le prix unitaire doit être positif"),
  tauxTVA: z.number().min(0).max(100).default(20),
  description: z.string().trim().nullable().optional(),
  ordre: z.number().int().default(0),
});

export const updatePosteCatalogueSchema = z.object({
  designation: z.string().trim().min(1).optional(),
  categorie: z.string().trim().nullable().optional(),
  unite: z.string().trim().min(1).optional(),
  prixUnitHT: z.number().min(0).optional(),
  tauxTVA: z.number().min(0).max(100).optional(),
  description: z.string().trim().nullable().optional(),
  ordre: z.number().int().optional(),
});

export type CreatePosteCatalogueInput = z.infer<
  typeof createPosteCatalogueSchema
>;
export type UpdatePosteCatalogueInput = z.infer<
  typeof updatePosteCatalogueSchema
>;
