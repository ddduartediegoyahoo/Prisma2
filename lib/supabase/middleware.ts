import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Handles cookie reading/writing across the request/response cycle.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
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
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // CRITICAL: Filter out auth token cookies with empty values.
          // When getUser() refreshes the session and encounters issues,
          // Supabase SSR may call setAll with empty cookie values,
          // which would destroy the existing valid session cookies.
          const validCookies = cookiesToSet.filter(({ name, value }) => {
            if (name.includes('-auth-token') && !name.includes('code-verifier') && value === '') {
              return false;
            }
            return true;
          });

          validCookies.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          validCookies.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not use supabase.auth.getSession() in middleware.
  // Use getUser() which validates the JWT against the Supabase Auth server.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Debug logging for Vercel
  const allCookies = request.cookies.getAll();
  console.log('[Middleware Debug]', {
    pathname: request.nextUrl.pathname,
    hasUser: !!user,
    error: error?.message,
    cookieCount: allCookies.length,
    allCookieNames: allCookies.map(c => c.name),
    supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-')).map(c => ({ name: c.name, valueLength: c.value.length }))
  });

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
      .eq("id", user.id)
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
