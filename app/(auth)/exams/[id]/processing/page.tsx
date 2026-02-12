import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import { ProcessingStatus } from "./_components/ProcessingStatus";
import type { ExamStatus } from "@/lib/types/exam";

export default async function ProcessingPage({
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

  // If already awaiting answers, redirect to extraction
  if (exam.status === "awaiting_answers") {
    redirect(`/exams/${examId}/extraction`);
  }

  // If completed, could redirect to result (but allow viewing processing page too)
  // The client component will show the "Ver Resultado" button

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Processamento da Prova
        </h1>
        <p className="mt-2 text-muted-foreground">
          Acompanhe o progresso da extração e adaptação da sua prova.
        </p>
      </div>

      <ProcessingStatus
        examId={examId}
        initialStatus={exam.status as ExamStatus}
      />
    </div>
  );
}
