import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
        setAll(cookiesToSet) {
          // Filter out auth token cookies with empty values to prevent
          // session corruption from failed concurrent token refreshes.
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

  // Refresh the session - this is critical for keeping tokens alive.
  // getClaims() validates the JWT locally without network call.
  // If the token needs refresh, the Supabase client will handle it
  // via setAll (which now filters empty cookies).
  await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/blocked", "/logout"];
  const isPublicRoute =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname === "/";

  // Check if user has valid auth cookies
  const hasAuth = request.cookies.getAll().some(
    (c) => c.name.match(/-auth-token\.\d+$/) && c.value.length > 0
  );

  // Not authenticated and not on public route → redirect to login
  if (!hasAuth && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
