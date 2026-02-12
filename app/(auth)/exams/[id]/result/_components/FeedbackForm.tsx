"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { StarRating } from "./StarRating";

interface ExistingFeedback {
  id: string;
  rating: number;
  comment: string | null;
}

interface FeedbackFormProps {
  examId: string;
  adaptationId: string;
  existingFeedback?: ExistingFeedback | null;
}

export function FeedbackForm({
  examId,
  adaptationId,
  existingFeedback,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(existingFeedback?.rating ?? 0);
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(existingFeedback));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/exams/${examId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adaptationId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string" ? err.error : "Erro ao salvar feedback."
        );
      }

      setIsSaved(true);
      toast.success("Feedback salvo com sucesso!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar feedback."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    rating !== (existingFeedback?.rating ?? 0) ||
    comment.trim() !== (existingFeedback?.comment ?? "");

  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Avalie esta adaptação
        </Label>
        <StarRating value={rating} onChange={(v) => { setRating(v); setIsSaved(false); }} />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor={`comment-${adaptationId}`}
          className="text-xs font-medium text-muted-foreground"
        >
          Comentário (opcional)
        </Label>
        <Textarea
          id={`comment-${adaptationId}`}
          placeholder="Compartilhe sua opinião sobre esta adaptação..."
          className="min-h-[80px] text-sm"
          value={comment}
          onChange={(e) => { setComment(e.target.value); setIsSaved(false); }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isSaved && !hasChanges ? "✓ Feedback salvo" : ""}
        </p>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || (rating === 0 && !comment.trim())}
        >
          {isSaving ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-3.5 w-3.5" />
          )}
          Salvar Feedback
        </Button>
      </div>
    </div>
  );
}
