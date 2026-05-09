import { z } from "zod";

export const ROLES = ["ADMIN", "COLLABORATEUR", "LECTURE_SEULE"] as const;

export const roleSchema = z.enum(ROLES);

const optionalName = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) =>
    v === undefined || v === null ? null : v.trim() || null,
  );

export const createUserSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  name: optionalName,
  role: roleSchema,
});

export const updateUserSchema = z.object({
  email: z.string().trim().email("Email invalide").optional(),
  name: optionalName,
  role: roleSchema.optional(),
  password: z
    .string()
    .min(8, "8 caractères minimum")
    .optional(),
  /**
   * Mot de passe actuel — requis quand un utilisateur change SON propre mot
   * de passe (vérifié serveur via bcrypt.compare). Non requis pour un ADMIN
   * qui réinitialise le mdp d'un autre user.
   */
  currentPassword: z.string().min(1).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
