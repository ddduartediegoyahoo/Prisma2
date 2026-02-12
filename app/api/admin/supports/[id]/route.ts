import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateSupportSchema } from "@/lib/validations/supports";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const body = await request.json();
  const parsed = updateSupportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Determine the agent_id and model_id to validate against
  // If they're being updated, use new values; otherwise fetch current support data
  let agentIdToValidate: string | undefined;
  let modelIdToValidate: string | undefined;

  if (parsed.data.enabled === true) {
    // When enabling, we need to validate agent and model existence/enablement
    if (parsed.data.agent_id || parsed.data.model_id) {
      agentIdToValidate = parsed.data.agent_id;
      modelIdToValidate = parsed.data.model_id;
    }

    // If not all IDs provided in payload, fetch current support to get existing references
    if (!agentIdToValidate || !modelIdToValidate) {
      const { data: currentSupport, error: fetchError } = await supabase
        .from("supports")
        .select("agent_id, model_id")
        .eq("id", id)
        .single();

      if (fetchError || !currentSupport) {
        return NextResponse.json(
          { error: "Apoio não encontrado." },
          { status: 404 }
        );
      }

      agentIdToValidate = agentIdToValidate ?? currentSupport.agent_id;
      modelIdToValidate = modelIdToValidate ?? currentSupport.model_id;
    }

    // Block enabling if model_id is null (model was deleted)
    if (!modelIdToValidate) {
      return NextResponse.json(
        {
          error:
            "Este apoio não possui um modelo vinculado. Edite-o para vincular um modelo antes de habilitar.",
        },
        { status: 400 }
      );
    }

    // Validate agent exists and is enabled
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, enabled")
      .eq("id", agentIdToValidate)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "O agente vinculado não foi encontrado." },
        { status: 400 }
      );
    }

    if (!agent.enabled) {
      return NextResponse.json(
        { error: "O agente vinculado está desabilitado. Habilite-o antes de ativar este apoio." },
        { status: 400 }
      );
    }

    // Validate model exists and is enabled
    const { data: model, error: modelError } = await supabase
      .from("ai_models")
      .select("id, enabled")
      .eq("id", modelIdToValidate)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "O modelo vinculado não foi encontrado." },
        { status: 400 }
      );
    }

    if (!model.enabled) {
      return NextResponse.json(
        { error: "O modelo vinculado está desabilitado. Habilite-o antes de ativar este apoio." },
        { status: 400 }
      );
    }
  }

  // Build update payload with only provided fields
  const updateData: Record<string, unknown> = {};
  if (parsed.data.enabled !== undefined) updateData.enabled = parsed.data.enabled;
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.agent_id !== undefined) updateData.agent_id = parsed.data.agent_id;
  if (parsed.data.model_id !== undefined) updateData.model_id = parsed.data.model_id;

  const { data, error } = await supabase
    .from("supports")
    .update(updateData)
    .eq("id", id)
    .select("*, agents(name), ai_models(name, model_id)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
