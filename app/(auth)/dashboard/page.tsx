import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import { ExamList } from "../_components/ExamList";
import type { ExamWithJoins } from "@/lib/types/exam";

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: exams } = await supabase
    .from("exams")
    .select("*, subjects(name), grade_levels(name)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {profile.full_name?.split(" ")[0] ?? "Professor"}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Aqui estão suas provas adaptadas.
          </p>
        </div>
        <Button asChild>
          <Link href="/exams/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Adaptação
          </Link>
        </Button>
      </div>

      <ExamList exams={(exams as ExamWithJoins[]) ?? []} />
    </div>
  );
}
