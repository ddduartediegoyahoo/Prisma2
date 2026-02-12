import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:5',message:'Login callback started',data:{hasCode:!!code},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callback/route.ts:15',message:'Session exchange result',data:{hasError:!!error,errorMsg:error?.message},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
  // #endregion

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
