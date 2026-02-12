import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createSupportSchema } from "@/lib/validations/supports";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("supports")
    .select("*, agents(name), ai_models(name, model_id)")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const body = await request.json();
  const parsed = createSupportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("supports")
    .insert({
      name: parsed.data.name,
      agent_id: parsed.data.agent_id,
      model_id: parsed.data.model_id,
    })
    .select("*, agents(name), ai_models(name, model_id)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
