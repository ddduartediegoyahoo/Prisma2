import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Check if user is blocked
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, blocked")
      .eq("id", user.id)
      .single();

    if (profile?.blocked) {
      return NextResponse.redirect(`${origin}/blocked`);
    }

    // Redirect admin to config, teacher to dashboard
    if (profile?.role === "admin") {
      return NextResponse.redirect(`${origin}/config`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
