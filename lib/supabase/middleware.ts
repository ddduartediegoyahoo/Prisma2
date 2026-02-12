import { NextResponse, type NextRequest } from "next/server";

/**
 * Checks if the user has valid Supabase auth cookies.
 * Does NOT use Supabase SSR client at all to prevent cookie corruption.
 * Simply verifies that auth token cookies exist with non-empty values.
 */
function hasAuthSession(request: NextRequest): boolean {
  const allCookies = request.cookies.getAll();

  // Look for Supabase auth token chunks (sb-*-auth-token.0, etc.)
  const authTokenChunks = allCookies.filter(
    (c) => c.name.match(/-auth-token\.\d+$/) && c.value.length > 0
  );

  return authTokenChunks.length > 0;
}

export async function updateSession(request: NextRequest) {
  const isAuthenticated = hasAuthSession(request);

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/blocked"];
  const isPublicRoute =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname === "/";

  // Not authenticated and not on public route → redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated user visiting login page → redirect to dashboard
  if (isAuthenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
