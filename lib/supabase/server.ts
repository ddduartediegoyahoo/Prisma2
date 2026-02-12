import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Creates a Supabase client for Server Components.
 * Note: Server Components cannot set cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            console.error('[Supabase] Failed to set cookies:', error);
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client for Route Handlers that need to set cookies.
 * Returns both the client and a function to apply cookies to a response.
 */
export async function createRouteHandlerClient() {
  const cookieStore = await cookies();
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(newCookies: { name: string; value: string; options: CookieOptions }[]) {
          // Store cookies to be set later on the response
          cookiesToSet.push(...newCookies);
          
          // Try to set on request cookies (for immediate reads)
          try {
            newCookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route Handler context - will set on response instead
          }
        },
      },
    }
  );

  /**
   * Applies the stored cookies to a NextResponse.
   * Must be called before returning the response.
   */
  const applyCookies = (response: NextResponse) => {
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  };

  return { client, applyCookies };
}
