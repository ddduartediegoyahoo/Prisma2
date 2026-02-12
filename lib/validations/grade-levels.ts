import { z } from "zod";

export const createGradeLevelSchema = z.object({
  name: z
    .string()
    .min(1, "O nome do ano/série é obrigatório.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
});

export const updateGradeLevelSchema = z.object({
  enabled: z.boolean(),
});

export type CreateGradeLevelInput = z.infer<typeof createGradeLevelSchema>;
export type UpdateGradeLevelInput = z.infer<typeof updateGradeLevelSchema>;
