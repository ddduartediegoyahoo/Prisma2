import { NextResponse, type NextRequest } from "next/server";

/**
 * Checks if the user has Supabase auth cookies present.
 */
function hasAuthSession(request: NextRequest): boolean {
  const allCookies = request.cookies.getAll();
  const authTokenChunks = allCookies.filter(
    (c) => c.name.match(/-auth-token\.\d+$/) && c.value.length > 0
  );
  return authTokenChunks.length > 0;
}

export async function updateSession(request: NextRequest) {
  const isAuthenticated = hasAuthSession(request);
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/blocked", "/logout"];
  const isPublicRoute =
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname === "/";

  // Not authenticated and not on public route → redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Do NOT redirect authenticated users from /login to /dashboard here.
  // The middleware cannot validate if the token is still valid,
  // only that cookies exist. Redirecting here causes an infinite loop
  // when tokens are expired (middleware redirects to /dashboard,
  // layout's getUser() fails and redirects back to /login).

  return NextResponse.next();
}
