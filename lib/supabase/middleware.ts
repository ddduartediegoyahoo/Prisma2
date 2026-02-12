import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Handles cookie reading/writing across the request/response cycle.
 */
export async function updateSession(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:8',message:'Middleware started',data:{pathname:request.nextUrl.pathname,cookieCount:request.cookies.getAll().length},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:19',message:'Cookies retrieved',data:{cookieNames:cookies.map(c=>c.name),cookieCount:cookies.length},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          return cookies;
        },
        setAll(cookiesToSet) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:25',message:'Setting cookies',data:{cookiesToSet:cookiesToSet.map(c=>({name:c.name,hasValue:!!c.value,options:c.options}))},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          // Atualiza os cookies na requisição
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          
          // Atualiza os cookies na resposta ATUAL (não cria nova)
          cookiesToSet.forEach(({ name, value, options }) =>
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
  } = await supabase.auth.getUser();

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:49',message:'User fetched',data:{hasUser:!!user,userId:user?.id,userEmail:user?.email},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  const { pathname } = request.nextUrl;

  // Define route categories
  const isAuthRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/exams");
  const isAdminRoute =
    pathname.startsWith("/config") || pathname.startsWith("/users");
  const isProtectedRoute = isAuthRoute || isAdminRoute;

  // 1. No user on protected route → redirect to login
  if (!user && isProtectedRoute) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:61',message:'Redirecting to login - no user on protected route',data:{pathname,isAuthRoute,isAdminRoute},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:99',message:'Middleware completed successfully',data:{pathname,hasUser:!!user,cookiesInResponse:supabaseResponse.cookies.getAll().map(c=>c.name)},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  return supabaseResponse;
}
