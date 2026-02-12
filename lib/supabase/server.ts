import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // CRITICAL: Never set auth token cookies with empty values.
              // When getUser() triggers a token refresh that fails
              // (e.g. due to concurrent requests), Supabase SSR calls
              // setAll with empty cookie values, destroying the session.
              if (name.includes('-auth-token') && !name.includes('code-verifier') && value === '') {
                // #region agent log
                console.error(`[DEBUG-SERVER] setAll_blocked_empty: name=${name}`);
                fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:setAll',message:'blocked_empty_cookie',data:{name},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
                // #endregion
                return;
              }
              cookieStore.set(name, value, options);
            });
          } catch (e) {
            // #region agent log
            // DEBUG: Log when setAll fails (Server Component context) (H-A)
            console.error(`[DEBUG-SERVER] setAll_catch: error=${e instanceof Error ? e.message : String(e)}, cookies=${JSON.stringify(cookiesToSet.map(c => ({ name: c.name, valueLen: c.value.length })))}`);
            fetch('http://127.0.0.1:7242/ingest/c491e1b0-b474-424a-8796-672ad319e0e9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:setAll',message:'setAll_catch',data:{error:e instanceof Error?e.message:String(e),cookies:cookiesToSet.map(c=>({name:c.name,valueLen:c.value.length}))},timestamp:Date.now(),hypothesisId:'H-A'})}).catch(()=>{});
            // #endregion
          }
        },
      },
    }
  );
}
