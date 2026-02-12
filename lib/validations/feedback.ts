import { z } from "zod";

export const saveFeedbackSchema = z.object({
  adaptationId: z.string().uuid("ID da adaptação inválido."),
  rating: z
    .number()
    .int()
    .min(0, "A nota deve ser no mínimo 0.")
    .max(5, "A nota deve ser no máximo 5."),
  comment: z
    .string()
    .max(5000, "O comentário deve ter no máximo 5.000 caracteres.")
    .optional(),
});

export type SaveFeedbackInput = z.infer<typeof saveFeedbackSchema>;
