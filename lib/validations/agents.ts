import { z } from "zod";

export const createAgentSchema = z.object({
  name: z
    .string()
    .min(1, "O nome do agente é obrigatório.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  prompt: z
    .string()
    .min(1, "O prompt é obrigatório.")
    .max(50000, "O prompt deve ter no máximo 50.000 caracteres."),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1).max(50000).optional(),
  enabled: z.boolean().optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
