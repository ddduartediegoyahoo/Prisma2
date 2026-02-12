"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";

interface Alternative {
  label: string;
  text: string;
}

interface Question {
  id: string;
  exam_id: string;
  order_num: number;
  content: string;
  question_type: "objective" | "essay";
  alternatives: Alternative[] | null;
  correct_answer: string | null;
  visual_elements: Array<{ type: string; description: string }> | null;
  extraction_warning: string | null;
}

interface ExtractionReviewProps {
  examId: string;
  questions: Question[];
}

export function ExtractionReview({ examId, questions }: ExtractionReviewProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const q of questions) {
      initial[q.id] = q.correct_answer ?? "";
    }
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    // Build answers payload (only non-empty)
    const payload = {
      answers: Object.entries(answers)
        .filter(([, value]) => value.trim() !== "")
        .map(([questionId, correctAnswer]) => ({
          questionId,
          correctAnswer,
        })),
    };

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/exams/${examId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Erro ao salvar respostas."
        );
      }

      toast.success("Respostas salvas! Iniciando adaptação...");
      router.push(`/exams/${examId}/processing`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar respostas."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhuma questão foi extraída do PDF.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Questão {question.order_num}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {question.question_type === "objective"
                    ? "Objetiva"
                    : "Dissertativa"}
                </Badge>
                {question.extraction_warning && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Aviso
                  </Badge>
                )}
              </div>
            </div>
            {question.extraction_warning && (
              <CardDescription className="flex items-start gap-2 text-amber-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {question.extraction_warning}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question content */}
            <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-4 text-sm">
              {question.content}
            </div>

            {/* Visual elements */}
            {question.visual_elements &&
              question.visual_elements.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Elementos visuais detectados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {question.visual_elements.map((ve, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {ve.type}: {ve.description}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Answer input */}
            {question.question_type === "objective" &&
            question.alternatives &&
            question.alternatives.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Alternativa correta
                </Label>
                <RadioGroup
                  value={answers[question.id] ?? ""}
                  onValueChange={(value) => updateAnswer(question.id, value)}
                >
                  {question.alternatives.map((alt) => (
                    <label
                      key={alt.label}
                      className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-accent/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5"
                    >
                      <RadioGroupItem
                        value={alt.label}
                        className="mt-0.5"
                      />
                      <span className="text-sm">
                        <span className="font-medium">{alt.label})</span>{" "}
                        {alt.text}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={`answer-${question.id}`} className="text-sm font-medium">
                  Resposta esperada{" "}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id={`answer-${question.id}`}
                  placeholder="Informe a resposta esperada..."
                  value={answers[question.id] ?? ""}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Submit */}
      <div className="flex justify-end pb-8">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Avançar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
