import { createRouteHandlerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const { client: supabase, applyCookies } = await createRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[Login Callback] Exchange code error:', error);
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
      const response = NextResponse.redirect(`${origin}/blocked`);
      return applyCookies(response);
    }

    // Redirect admin to config, teacher to dashboard
    if (profile?.role === "admin") {
      const response = NextResponse.redirect(`${origin}/config`);
      return applyCookies(response);
    }
  }

  // Redirect to dashboard
  const response = NextResponse.redirect(`${origin}/dashboard`);
  return applyCookies(response);
}
