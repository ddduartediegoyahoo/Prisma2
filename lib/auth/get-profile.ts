import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/auth";

/**
 * Fetches the authenticated user's profile from Supabase.
 * Returns null if user is not authenticated or profile doesn't exist.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

/**
 * Fetches the authenticated user's profile, throwing a redirect if not found.
 * For use in Server Components where authentication is required.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    throw new Error("Profile not found — user is not authenticated");
  }

  return profile;
}
