import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileSearch } from "lucide-react";
import { ExamCard } from "./ExamCard";
import type { ExamWithJoins } from "@/lib/types/exam";

interface ExamListProps {
  exams: ExamWithJoins[];
}

export function ExamList({ exams }: ExamListProps) {
  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <FileSearch className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">Nenhuma prova adaptada ainda</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Comece enviando sua primeira prova para adaptação.
        </p>
        <Button asChild className="mt-6">
          <Link href="/exams/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Adaptação
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} />
      ))}
    </div>
  );
}
