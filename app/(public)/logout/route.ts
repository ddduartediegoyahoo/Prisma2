import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Manually clear auth cookies since the setAll filter may block empty values
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.includes("-auth-token")) {
      cookieStore.delete(cookie.name);
    }
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 302 });
}
