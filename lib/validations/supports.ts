import { z } from "zod";

export const createSupportSchema = z.object({
  name: z
    .string()
    .min(1, "O nome do apoio é obrigatório.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  agent_id: z
    .string()
    .uuid("Selecione um agente válido."),
  model_id: z
    .string()
    .uuid("Selecione um modelo válido."),
});

export const updateSupportSchema = z.object({
  enabled: z.boolean().optional(),
  name: z
    .string()
    .min(1, "O nome do apoio é obrigatório.")
    .max(100, "O nome deve ter no máximo 100 caracteres.")
    .optional(),
  agent_id: z
    .string()
    .uuid("Selecione um agente válido.")
    .optional(),
  model_id: z
    .string()
    .uuid("Selecione um modelo válido.")
    .nullable()
    .optional(),
});

export type CreateSupportInput = z.infer<typeof createSupportSchema>;
export type UpdateSupportInput = z.infer<typeof updateSupportSchema>;
