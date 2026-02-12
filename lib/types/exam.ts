export type ExamStatus =
  | "uploading"
  | "extracting"
  | "awaiting_answers"
  | "analyzing"
  | "completed"
  | "error";

export interface Exam {
  id: string;
  user_id: string;
  subject_id: string;
  grade_level_id: string;
  topic: string | null;
  pdf_path: string;
  status: ExamStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamWithJoins extends Exam {
  subjects: { name: string } | null;
  grade_levels: { name: string } | null;
}

/** Maps exam status to display info */
export function getExamStatusDisplay(status: ExamStatus): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  switch (status) {
    case "uploading":
    case "extracting":
      return { label: "Processando", variant: "secondary" };
    case "awaiting_answers":
      return { label: "Aguardando respostas", variant: "outline" };
    case "analyzing":
      return { label: "Adaptando", variant: "secondary" };
    case "completed":
      return { label: "Concluído", variant: "default" };
    case "error":
      return { label: "Erro", variant: "destructive" };
  }
}

/** Maps exam status to the correct page route */
export function getExamRoute(examId: string, status: ExamStatus): string {
  switch (status) {
    case "awaiting_answers":
      return `/exams/${examId}/extraction`;
    case "completed":
      return `/exams/${examId}/result`;
    case "uploading":
    case "extracting":
    case "analyzing":
    case "error":
    default:
      return `/exams/${examId}/processing`;
  }
}
