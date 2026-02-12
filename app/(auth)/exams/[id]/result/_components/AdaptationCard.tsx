import { CopyButton } from "./CopyButton";
import { FeedbackForm } from "./FeedbackForm";
import { Separator } from "@/components/ui/separator";

interface ExistingFeedback {
  id: string;
  rating: number;
  comment: string | null;
}

interface AdaptationCardProps {
  examId: string;
  adaptationId: string;
  adaptedContent: string | null;
  supportName: string;
  existingFeedback?: ExistingFeedback | null;
}

export function AdaptationCard({
  examId,
  adaptationId,
  adaptedContent,
  supportName,
  existingFeedback,
}: AdaptationCardProps) {
  if (!adaptedContent) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        Adaptação não disponível para {supportName}.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="whitespace-pre-wrap rounded-md bg-muted/40 p-4 text-sm leading-relaxed">
        {adaptedContent}
      </div>
      <div className="flex justify-end">
        <CopyButton text={adaptedContent} />
      </div>

      <Separator />

      <FeedbackForm
        examId={examId}
        adaptationId={adaptationId}
        existingFeedback={existingFeedback}
      />
    </div>
  );
}
