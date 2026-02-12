import { z } from "zod";

export const createModelSchema = z.object({
  name: z
    .string()
    .min(1, "O nome do modelo é obrigatório.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  base_url: z
    .string()
    .min(1, "A URL base é obrigatória.")
    .url("Informe uma URL válida."),
  api_key: z
    .string()
    .min(1, "A API Key é obrigatória."),
  model_id: z
    .string()
    .min(1, "O Model ID é obrigatório.")
    .max(100, "O Model ID deve ter no máximo 100 caracteres."),
});

export const updateModelSchema = z.object({
  enabled: z.boolean().optional(),
  is_default: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  base_url: z.string().url().optional(),
  api_key: z.string().min(1).optional(),
  model_id: z.string().min(1).max(100).optional(),
});

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
