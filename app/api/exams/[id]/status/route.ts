import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: examId } = await params;

  // 1. Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // 2. Fetch exam status
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, user_id, status, error_message")
    .eq("id", examId)
    .single();

  if (examError || !exam) {
    return NextResponse.json(
      { error: "Exame não encontrado." },
      { status: 404 }
    );
  }

  if (exam.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  // 3. Count adaptations progress (via questions belonging to this exam)
  // First get question IDs for this exam
  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("exam_id", examId);

  const questionIds = questions?.map((q) => q.id) ?? [];

  let totalAdaptations = 0;
  let completedAdaptations = 0;

  if (questionIds.length > 0) {
    const { count: total } = await supabase
      .from("adaptations")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds);

    const { count: completed } = await supabase
      .from("adaptations")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds)
      .eq("status", "completed");

    totalAdaptations = total ?? 0;
    completedAdaptations = completed ?? 0;
  }

  return NextResponse.json({
    status: exam.status,
    errorMessage: exam.error_message,
    progress: {
      total: totalAdaptations,
      completed: completedAdaptations,
      questionsCount: questionIds.length,
    },
  });
}
