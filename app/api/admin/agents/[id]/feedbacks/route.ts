import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: agentId } = await params;

  // 1. Fetch feedbacks where the adaptation used a support whose agent_id matches
  const { data, error } = await supabase
    .from("feedbacks")
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      dismissed_from_evolution,
      adaptations!inner(
        adapted_content,
        support_id,
        supports!inner(
          name,
          agent_id
        ),
        question_id,
        questions!inner(
          content
        )
      )
    `
    )
    .eq("adaptations.supports.agent_id", agentId)
    .not("comment", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Fetch all agent_evolutions for this agent to determine which feedback IDs were already used
  const { data: evolutions } = await supabase
    .from("agent_evolutions")
    .select("feedback_ids")
    .eq("agent_id", agentId);

  const usedFeedbackIds = new Set<string>();
  for (const evo of evolutions ?? []) {
    const ids = evo.feedback_ids as string[] | null;
    if (ids) {
      for (const fid of ids) {
        usedFeedbackIds.add(fid);
      }
    }
  }

  // 3. Flatten the response for easier consumption
  const feedbacks = (data ?? []).map((f: Record<string, unknown>) => {
    const adaptation = f.adaptations as Record<string, unknown>;
    const question = adaptation.questions as Record<string, unknown>;
    const support = adaptation.supports as Record<string, unknown>;

    return {
      id: f.id as string,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.created_at,
      originalContent: question.content,
      adaptedContent: adaptation.adapted_content,
      supportName: support.name,
      dismissed: f.dismissed_from_evolution as boolean,
      usedInEvolution: usedFeedbackIds.has(f.id as string),
    };
  });

  return NextResponse.json(feedbacks);
}
