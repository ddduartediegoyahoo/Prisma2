import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Uses a read-only cookie approach to prevent session corruption.
 * 
 * IMPORTANT: The setAll callback intentionally does NOT propagate
 * empty cookies back to the response. When getUser/getClaims triggers
 * a session refresh that fails (e.g., due to network issues or race
 * conditions with concurrent requests), Supabase SSR calls setAll 
 * with empty cookie values, which would destroy the browser's valid 
 * session cookies. By skipping the response cookie propagation,
 * we preserve the existing valid session.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // Intentionally empty: we do NOT write cookies back from middleware.
          // Session tokens are set by the login callback route handler.
          // The middleware only reads cookies to check authentication.
          // Writing cookies here causes session corruption on Vercel
          // when concurrent RSC requests trigger token refresh failures.
        },
      },
    }
  );

  // Validate JWT locally without network call
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;

  // Define route categories
  const isAuthRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/exams");
  const isAdminRoute =
    pathname.startsWith("/config") || pathname.startsWith("/users");
  const isProtectedRoute = isAuthRoute || isAdminRoute;

  // 1. No user on protected route → redirect to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. If user exists and on protected route, check profile
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, blocked")
      .eq("id", user.sub)
      .single();

    // 2a. Blocked user → redirect to /blocked
    if (profile?.blocked) {
      const url = request.nextUrl.clone();
      url.pathname = "/blocked";
      return NextResponse.redirect(url);
    }

    // 2b. Non-admin on admin route → redirect to /dashboard
    if (isAdminRoute && profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // 3. Logged-in user visiting login page → redirect to dashboard
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
