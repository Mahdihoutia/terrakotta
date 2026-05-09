import { z } from "zod";

import { roleSchema } from "./user";

export const createInvitationSchema = z.object({
  email: z.string().trim().email("Email invalide"),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  role: roleSchema,
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8, "8 caractères minimum"),
});
