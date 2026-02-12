import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateModelSchema } from "@/lib/validations/models";

/** Masks an API key for display: "sk-abc...wxyz" */
function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 3)}...${key.slice(-4)}`;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const body = await request.json();
  const parsed = updateModelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // If setting this model as default, clear is_default on all other models first
  if (parsed.data.is_default === true) {
    const { error: clearError } = await supabase
      .from("ai_models")
      .update({ is_default: false })
      .neq("id", id);

    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }
  }

  // Build update payload with only provided fields
  const updateData: Record<string, unknown> = {};
  if (parsed.data.enabled !== undefined) updateData.enabled = parsed.data.enabled;
  if (parsed.data.is_default !== undefined) updateData.is_default = parsed.data.is_default;
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.base_url !== undefined) updateData.base_url = parsed.data.base_url;
  if (parsed.data.api_key !== undefined) updateData.api_key = parsed.data.api_key;
  if (parsed.data.model_id !== undefined) updateData.model_id = parsed.data.model_id;

  const { data, error } = await supabase
    .from("ai_models")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    api_key: maskApiKey(data.api_key),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Nullify model reference and disable linked supports
  // Supports are kept (disabled) for historical integrity via exam_supports
  const { data: updatedSupports, error: nullifyError } = await supabase
    .from("supports")
    .update({ model_id: null, enabled: false })
    .eq("model_id", id)
    .select("id");

  if (nullifyError) {
    return NextResponse.json(
      { error: nullifyError.message },
      { status: 500 }
    );
  }

  const disabledCount = updatedSupports?.length ?? 0;

  // 2. Delete the model
  const { error: deleteError } = await supabase
    .from("ai_models")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Modelo excluído com sucesso.",
    disabledSupports: disabledCount,
  });
}
