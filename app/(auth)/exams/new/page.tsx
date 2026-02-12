import { createClient } from "@/lib/supabase/server";
import { NewExamForm } from "./_components/NewExamForm";

interface SelectOption {
  id: string;
  name: string;
}

export default async function NewExamPage() {
  const supabase = await createClient();

  const [subjectsRes, gradeLevelsRes, supportsRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("enabled", true)
      .order("name"),
    supabase
      .from("grade_levels")
      .select("id, name")
      .eq("enabled", true)
      .order("name"),
    supabase
      .from("supports")
      .select("id, name")
      .eq("enabled", true)
      .order("name"),
  ]);

  const subjects: SelectOption[] = subjectsRes.data ?? [];
  const gradeLevels: SelectOption[] = gradeLevelsRes.data ?? [];
  const supports: SelectOption[] = supportsRes.data ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nova Adaptação</h1>
        <p className="mt-2 text-muted-foreground">
          Preencha as informações da prova e faça upload do PDF para iniciar a
          adaptação.
        </p>
      </div>

      <NewExamForm
        subjects={subjects}
        gradeLevels={gradeLevels}
        supports={supports}
      />
    </div>
  );
}
