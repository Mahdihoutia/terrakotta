import { z } from "zod";

/** Demande de réinitialisation — POST /api/auth/forgot-password */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email invalide"),
});

/** Consommation du jeton — POST /api/auth/reset-password */
export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8, "8 caractères minimum"),
});
