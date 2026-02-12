import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import { ExtractionReview } from "./_components/ExtractionReview";

interface Question {
  id: string;
  exam_id: string;
  order_num: number;
  content: string;
  question_type: "objective" | "essay";
  alternatives: Array<{ label: string; text: string }> | null;
  correct_answer: string | null;
  visual_elements: Array<{ type: string; description: string }> | null;
  extraction_warning: string | null;
}

export default async function ExtractionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, user_id, status")
    .eq("id", examId)
    .single();

  if (!exam || exam.user_id !== profile.id) {
    redirect("/dashboard");
  }

  if (exam.status !== "awaiting_answers") {
    redirect(`/exams/${examId}/processing`);
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("exam_id", examId)
    .order("order_num");

  // Safely parse JSONB fields that may have been double-serialized as strings
  const parsedQuestions: Question[] = (questions ?? []).map((q) => ({
    ...q,
    alternatives:
      typeof q.alternatives === "string"
        ? JSON.parse(q.alternatives)
        : (q.alternatives ?? null),
    visual_elements:
      typeof q.visual_elements === "string"
        ? JSON.parse(q.visual_elements)
        : (q.visual_elements ?? null),
  })) as Question[];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Revisão das Questões
        </h1>
        <p className="mt-2 text-muted-foreground">
          Revise as questões extraídas e informe a alternativa correta para cada
          uma. Para questões dissertativas, a resposta é opcional.
        </p>
      </div>

      <ExtractionReview
        examId={examId}
        questions={parsedQuestions}
      />
    </div>
  );
}
