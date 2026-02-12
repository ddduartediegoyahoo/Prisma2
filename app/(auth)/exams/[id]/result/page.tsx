import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/get-profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ArrowLeft, MessageSquareHeart } from "lucide-react";
import { ExamResultHeader } from "./_components/ExamResultHeader";
import { QuestionResult } from "./_components/QuestionResult";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examId } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Deep query including feedbacks
  const { data: exam } = await supabase
    .from("exams")
    .select(
      `
      *,
      subjects(name),
      grade_levels(name),
      exam_supports(supports(name)),
      questions(
        *,
        adaptations(
          *,
          supports(name),
          feedbacks(*)
        )
      )
    `
    )
    .eq("id", examId)
    .single();

  if (!exam || exam.user_id !== profile.id) {
    redirect("/dashboard");
  }

  if (exam.status !== "completed") {
    redirect(`/exams/${examId}/processing`);
  }

  const supportNames: string[] = (
    exam.exam_supports as Array<{ supports: { name: string } | null }>
  )
    .map((es) => es.supports?.name)
    .filter((name): name is string => Boolean(name));

  const questions = (
    exam.questions as Array<{
      id: string;
      order_num: number;
      content: string;
      question_type: string;
      adaptations: Array<{
        id: string;
        support_id: string;
        adapted_content: string | null;
        bncc_skills: string[] | null;
        bloom_level: string | null;
        bncc_analysis: string | null;
        bloom_analysis: string | null;
        status: string;
        supports: { name: string } | null;
        feedbacks: Array<{
          id: string;
          rating: number;
          comment: string | null;
        }>;
      }>;
    }>
  ).sort((a, b) => a.order_num - b.order_num);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <ExamResultHeader
          subjectName={exam.subjects?.name ?? "—"}
          gradeLevelName={exam.grade_levels?.name ?? "—"}
          topic={exam.topic}
          supportNames={supportNames}
          createdAt={exam.created_at}
        />

        {/* Info message about feedback */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="flex items-start gap-3 pt-5">
            <MessageSquareHeart className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Seus comentários e avaliações ajudam nosso sistema a melhorar
              futuras adaptações. Avalie cada questão adaptada abaixo!
            </p>
          </CardContent>
        </Card>

        {questions.map((question) => (
          <QuestionResult
            key={question.id}
            examId={examId}
            orderNum={question.order_num}
            questionType={question.question_type}
            content={question.content}
            adaptations={question.adaptations}
          />
        ))}
      </div>
    </div>
  );
}
