import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateFeedbackSchema = z.object({
  dismissed_from_evolution: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  const supabase = await createClient();
  const { feedbackId } = await params;

  const body = await request.json();
  const parsed = updateFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("feedbacks")
    .update({
      dismissed_from_evolution: parsed.data.dismissed_from_evolution,
    })
    .eq("id", feedbackId)
    .select("id, dismissed_from_evolution")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
