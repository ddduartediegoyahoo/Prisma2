import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createGradeLevelSchema } from "@/lib/validations/grade-levels";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("grade_levels")
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
  const parsed = createGradeLevelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("grade_levels")
    .insert({ name: parsed.data.name })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Já existe um ano/série com este nome." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
