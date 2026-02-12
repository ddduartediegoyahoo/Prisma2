import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createAgentSchema } from "@/lib/validations/agents";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const body = await request.json();
  const parsed = createAgentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({
      name: parsed.data.name,
      prompt: parsed.data.prompt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
