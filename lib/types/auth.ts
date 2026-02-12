export type UserRole = "teacher" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  blocked: boolean;
  created_at: string;
}
