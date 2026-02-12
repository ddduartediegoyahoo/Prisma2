import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Reads the Supabase session from chunked cookies without triggering
 * any cookie writes. Supabase SSR splits large JWTs across multiple
 * cookies (e.g., sb-xxx-auth-token.0, sb-xxx-auth-token.1).
 * This function reassembles them and decodes the JWT payload.
 */
function getSessionFromCookies(request: NextRequest): { sub: string; role: string } | null {
  const allCookies = request.cookies.getAll();

  // Find auth token chunks (sb-*-auth-token.0, sb-*-auth-token.1, etc.)
  const authTokenChunks = allCookies
    .filter(c => c.name.match(/-auth-token\.\d+$/))
    .sort((a, b) => {
      const numA = parseInt(a.name.split('.').pop() || '0');
      const numB = parseInt(b.name.split('.').pop() || '0');
      return numA - numB;
    });

  if (authTokenChunks.length === 0) {
    return null;
  }

  // Check all chunks have values
  if (authTokenChunks.some(c => !c.value || c.value.length === 0)) {
    return null;
  }

  // Reassemble the full cookie value
  const fullValue = authTokenChunks.map(c => c.value).join('');

  try {
    // The cookie value is a base64url-encoded JSON containing access_token
    const sessionData = JSON.parse(fullValue);
    const accessToken = sessionData?.access_token;

    if (!accessToken) {
      return null;
    }

    // Decode JWT payload (middle part)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload));

    return {
      sub: decoded.sub,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Uses direct cookie reading to prevent session corruption.
 *
 * IMPORTANT: Authentication is checked by directly reading and decoding
 * the JWT from cookies, NOT via supabase.auth.getUser/getClaims.
 * This prevents the Supabase SSR library from calling setAll with
 * empty cookies, which destroys the session on Vercel.
 *
 * The Supabase client is only used for database queries (profiles).
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  // Read session directly from cookies (no Supabase SSR involvement)
  const user = getSessionFromCookies(request);

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
    // Create a read-only Supabase client just for database queries
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op: we never write cookies from middleware
          },
        },
      }
    );

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
