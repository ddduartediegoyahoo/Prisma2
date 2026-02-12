"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  FileSearch,
  MessageSquare,
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import type { ExamStatus } from "@/lib/types/exam";

interface StatusResponse {
  status: ExamStatus;
  errorMessage: string | null;
  progress: {
    total: number;
    completed: number;
    questionsCount: number;
  };
}

interface ProcessingStatusProps {
  examId: string;
  initialStatus: ExamStatus;
}

const STEPS = [
  { key: "uploading", label: "Upload", icon: Upload },
  { key: "extracting", label: "Extração", icon: FileSearch },
  { key: "awaiting_answers", label: "Respostas", icon: MessageSquare },
  { key: "analyzing", label: "Adaptação", icon: BrainCircuit },
  { key: "completed", label: "Concluído", icon: CheckCircle2 },
] as const;

const STATUS_ORDER: Record<string, number> = {
  uploading: 0,
  extracting: 1,
  awaiting_answers: 2,
  analyzing: 3,
  completed: 4,
  error: -1,
};

export function ProcessingStatus({
  examId,
  initialStatus,
}: ProcessingStatusProps) {
  const router = useRouter();

  const { data } = useQuery<StatusResponse>({
    queryKey: ["exam-status", examId],
    queryFn: async () => {
      const res = await fetch(`/api/exams/${examId}/status`);
      if (!res.ok) throw new Error("Erro ao consultar status.");
      return res.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling on terminal states
      if (status === "completed" || status === "error" || status === "awaiting_answers") {
        return false;
      }
      return 4000; // 4 seconds
    },
    refetchIntervalInBackground: false,
    initialData: {
      status: initialStatus,
      errorMessage: null,
      progress: { total: 0, completed: 0, questionsCount: 0 },
    },
  });

  const currentStatus = data?.status ?? initialStatus;

  // Auto-redirect to extraction when awaiting_answers
  useEffect(() => {
    if (currentStatus === "awaiting_answers") {
      router.push(`/exams/${examId}/extraction`);
    }
  }, [currentStatus, examId, router]);

  const currentStepIndex = STATUS_ORDER[currentStatus] ?? -1;
  const isError = currentStatus === "error";
  const isCompleted = currentStatus === "completed";
  const isAnalyzing = currentStatus === "analyzing";

  const progressPercent =
    data?.progress.total > 0
      ? Math.round((data.progress.completed / data.progress.total) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso do Processamento</CardTitle>
          <CardDescription>
            {isError
              ? "Ocorreu um erro durante o processamento."
              : isCompleted
                ? "A adaptação foi concluída com sucesso!"
                : "Sua prova está sendo processada. Você pode sair e voltar depois."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = currentStepIndex === index;
              const isDone = currentStepIndex > index;
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isActive && !isCompleted ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isDone || isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        isDone ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Progress bar for analyzing phase */}
      {isAnalyzing && data && data.progress.total > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Adaptando questões...
                </span>
                <span className="font-medium">
                  {data.progress.completed}/{data.progress.total} adaptações
                </span>
              </div>
              <Progress value={progressPercent} />
              <p className="text-center text-xs text-muted-foreground">
                {progressPercent}% concluído
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {isError && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                Erro no processamento
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.errorMessage ?? "Ocorreu um erro inesperado."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.push("/dashboard")}
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed state */}
      {isCompleted && (
        <Card className="border-primary/50">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <div>
              <p className="text-lg font-medium">Adaptação concluída!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                As questões foram adaptadas com sucesso. Clique abaixo para ver
                o resultado.
              </p>
            </div>
            <Button size="lg" onClick={() => router.push(`/exams/${examId}/result`)}>
              Ver Resultado
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Polling indicator for non-terminal states */}
      {!isCompleted && !isError && currentStatus !== "awaiting_answers" && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verificando progresso...</span>
          <Badge variant="secondary" className="ml-2">
            Atualização automática
          </Badge>
        </div>
      )}
    </div>
  );
}
