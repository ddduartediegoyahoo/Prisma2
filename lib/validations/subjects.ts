import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(1, "O nome da disciplina é obrigatório.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
});

export const updateSubjectSchema = z.object({
  enabled: z.boolean(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
