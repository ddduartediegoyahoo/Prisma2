import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createModelSchema } from "@/lib/validations/models";

/** Masks an API key for display: "sk-abc...wxyz" */
function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 3)}...${key.slice(-4)}`;
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_models")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask API keys in the response
  const masked = data.map((model) => ({
    ...model,
    api_key: maskApiKey(model.api_key),
  }));

  return NextResponse.json(masked);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const body = await request.json();
  const parsed = createModelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("ai_models")
    .insert({
      name: parsed.data.name,
      base_url: parsed.data.base_url,
      api_key: parsed.data.api_key,
      model_id: parsed.data.model_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask API key in response
  return NextResponse.json(
    { ...data, api_key: maskApiKey(data.api_key) },
    { status: 201 }
  );
}
