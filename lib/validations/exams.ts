import { z } from "zod";

const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25 MB

export const createExamSchema = z.object({
  subjectId: z.string().uuid("Selecione uma disciplina válida."),
  gradeLevelId: z.string().uuid("Selecione um ano/série válido."),
  topic: z.string().max(500, "O tema deve ter no máximo 500 caracteres.").optional(),
  supportIds: z
    .array(z.string().uuid())
    .min(1, "Selecione ao menos um apoio."),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

/** Client-side PDF validation */
export function validatePdfFile(file: File | null): string | null {
  if (!file) return "Selecione um arquivo PDF.";
  if (file.type !== "application/pdf") return "O arquivo deve ser um PDF.";
  if (file.size > MAX_PDF_SIZE) return "O arquivo deve ter no máximo 25 MB.";
  return null;
}
