import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquareWarning,
} from "lucide-react";
import type { ExamWithJoins, ExamStatus } from "@/lib/types/exam";
import { getExamStatusDisplay, getExamRoute } from "@/lib/types/exam";

interface ExamCardProps {
  exam: ExamWithJoins;
}

function getStatusIcon(status: ExamStatus) {
  switch (status) {
    case "uploading":
    case "extracting":
    case "analyzing":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "awaiting_answers":
      return <MessageSquareWarning className="h-4 w-4 text-amber-500" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
}

export function ExamCard({ exam }: ExamCardProps) {
  const statusDisplay = getExamStatusDisplay(exam.status);
  const href = getExamRoute(exam.id, exam.status);
  const createdDate = new Date(exam.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/50 hover:bg-accent/30">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">
                {exam.subjects?.name ?? "—"} — {exam.grade_levels?.name ?? "—"}
              </CardTitle>
              <CardDescription>
                {exam.topic ? (
                  <span>{exam.topic}</span>
                ) : (
                  <span className="italic">Sem tema definido</span>
                )}
                <span className="mx-2">·</span>
                <span>{createdDate}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(exam.status)}
            <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
