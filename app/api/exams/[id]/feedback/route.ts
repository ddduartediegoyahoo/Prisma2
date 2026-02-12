import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { saveFeedbackSchema } from "@/lib/validations/feedback";

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

  // 2. Verify exam ownership
  const { data: exam } = await supabase
    .from("exams")
    .select("id, user_id")
    .eq("id", examId)
    .single();

  if (!exam || exam.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  // 3. Parse and validate
  const body = await request.json();
  const parsed = saveFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 4. Check if feedback already exists for this adaptation (upsert logic)
  const { data: existingFeedback } = await supabase
    .from("feedbacks")
    .select("id")
    .eq("adaptation_id", parsed.data.adaptationId)
    .maybeSingle();

  if (existingFeedback) {
    // Update existing feedback
    const { data, error } = await supabase
      .from("feedbacks")
      .update({
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      })
      .eq("id", existingFeedback.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // 5. Create new feedback
  const { data, error } = await supabase
    .from("feedbacks")
    .insert({
      adaptation_id: parsed.data.adaptationId,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
