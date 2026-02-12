import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const saveAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      correctAnswer: z.string(),
    })
  ),
});

export async function POST(
  request: Request,
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

  // 2. Verify exam ownership and status
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .select("id, user_id, status")
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

  if (exam.status !== "awaiting_answers") {
    return NextResponse.json(
      { error: "Este exame não está aguardando respostas." },
      { status: 400 }
    );
  }

  // 3. Parse and validate body
  const body = await request.json();
  const parsed = saveAnswersSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 4. Update correct_answer for each question
  for (const answer of parsed.data.answers) {
    if (!answer.correctAnswer.trim()) continue;

    const { error: updateError } = await supabase
      .from("questions")
      .update({ correct_answer: answer.correctAnswer })
      .eq("id", answer.questionId)
      .eq("exam_id", examId);

    if (updateError) {
      console.error(
        `Failed to update question ${answer.questionId}:`,
        updateError
      );
    }
  }

  // 5. Update exam status to 'analyzing'
  await supabase
    .from("exams")
    .update({ status: "analyzing" })
    .eq("id", examId);

  // 6. Invoke Edge Function (non-blocking, graceful failure)
  try {
    await supabase.functions.invoke("analyze-and-adapt", {
      body: { examId },
    });
  } catch (error) {
    console.error("Edge Function invoke error:", error);
  }

  return NextResponse.json({ success: true });
}
