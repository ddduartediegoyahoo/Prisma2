import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const evolveSchema = z.object({
  feedbackIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um feedback."),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: agentId } = await params;

  const body = await request.json();
  const parsed = evolveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // 1. Fetch agent
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, name, prompt")
    .eq("id", agentId)
    .single();

  if (agentError || !agent) {
    return NextResponse.json(
      { error: "Agente não encontrado." },
      { status: 404 }
    );
  }

  // 2. Invoke Edge Function
  try {
    const { data: result, error: fnError } = await supabase.functions.invoke(
      "evolve-agent",
      {
        body: {
          agentId,
          agentPrompt: agent.prompt,
          feedbackIds: parsed.data.feedbackIds,
        },
      }
    );

    if (fnError) {
      throw fnError;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Evolve agent error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao evoluir agente.",
      },
      { status: 500 }
    );
  }
}

/** Accept or discard the evolution */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: agentId } = await params;

  const body = await request.json();
  const { evolutionId, accepted, suggestedPrompt } = body as {
    evolutionId: string;
    accepted: boolean;
    suggestedPrompt?: string;
  };

  if (!evolutionId) {
    return NextResponse.json(
      { error: "evolutionId é obrigatório." },
      { status: 400 }
    );
  }

  // Update agent_evolutions record
  await supabase
    .from("agent_evolutions")
    .update({ accepted })
    .eq("id", evolutionId);

  // If accepted, update the agent's prompt
  if (accepted && suggestedPrompt) {
    await supabase
      .from("agents")
      .update({ prompt: suggestedPrompt })
      .eq("id", agentId);
  }

  return NextResponse.json({ success: true });
}
