import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BookOpen, BrainCircuit } from "lucide-react";
import { AdaptationCard } from "./AdaptationCard";

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
}

interface Adaptation {
  id: string;
  support_id: string;
  adapted_content: string | null;
  bncc_skills: string[] | null;
  bloom_level: string | null;
  bncc_analysis: string | null;
  bloom_analysis: string | null;
  status: string;
  supports: { name: string } | null;
  feedbacks: Feedback[];
}

interface QuestionResultProps {
  examId: string;
  orderNum: number;
  questionType: string;
  content: string;
  adaptations: Adaptation[];
}

export function QuestionResult({
  examId,
  orderNum,
  questionType,
  content,
  adaptations,
}: QuestionResultProps) {
  const firstCompleted = adaptations.find((a) => a.status === "completed");
  const rawSkills = firstCompleted?.bncc_skills;
  const bnccSkills: string[] = Array.isArray(rawSkills)
    ? rawSkills
    : typeof rawSkills === "string"
      ? JSON.parse(rawSkills)
      : [];
  const bnccAnalysis = firstCompleted?.bncc_analysis;
  const bloomLevel = firstCompleted?.bloom_level;
  const bloomAnalysis = firstCompleted?.bloom_analysis;

  const completedAdaptations = adaptations.filter(
    (a) => a.status === "completed" && a.adapted_content
  );

  const getExistingFeedback = (adaptation: Adaptation) => {
    const fb = adaptation.feedbacks?.[0];
    return fb ?? null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Questão {orderNum}</CardTitle>
          <Badge variant="secondary">
            {questionType === "objective" ? "Objetiva" : "Dissertativa"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Original question */}
        <div className="whitespace-pre-wrap rounded-md border bg-card p-4 text-sm">
          {content}
        </div>

        {/* BNCC + Bloom analysis */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-md bg-blue-50 p-4 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Habilidades BNCC
            </div>
            {bnccSkills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {bnccSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-blue-200 bg-blue-100 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Não identificadas</p>
            )}
            {bnccAnalysis && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {bnccAnalysis}
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-md bg-purple-50 p-4 dark:bg-purple-950/20">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BrainCircuit className="h-4 w-4 text-purple-600" />
              Nível Bloom
            </div>
            {bloomLevel ? (
              <Badge
                variant="outline"
                className="border-purple-200 bg-purple-100 text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-900/50 dark:text-purple-200"
              >
                {bloomLevel}
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground">Não identificado</p>
            )}
            {bloomAnalysis && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {bloomAnalysis}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Adaptations by support */}
        {completedAdaptations.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma adaptação disponível para esta questão.
          </div>
        ) : completedAdaptations.length === 1 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Adaptação — {completedAdaptations[0].supports?.name}
            </p>
            <AdaptationCard
              examId={examId}
              adaptationId={completedAdaptations[0].id}
              adaptedContent={completedAdaptations[0].adapted_content}
              supportName={completedAdaptations[0].supports?.name ?? ""}
              existingFeedback={getExistingFeedback(completedAdaptations[0])}
            />
          </div>
        ) : (
          <Tabs
            defaultValue={completedAdaptations[0]?.support_id}
            className="w-full"
          >
            <TabsList className="w-full justify-start">
              {completedAdaptations.map((adaptation) => (
                <TabsTrigger
                  key={adaptation.support_id}
                  value={adaptation.support_id}
                >
                  {adaptation.supports?.name ?? "Apoio"}
                </TabsTrigger>
              ))}
            </TabsList>
            {completedAdaptations.map((adaptation) => (
              <TabsContent
                key={adaptation.support_id}
                value={adaptation.support_id}
              >
                <AdaptationCard
                  examId={examId}
                  adaptationId={adaptation.id}
                  adaptedContent={adaptation.adapted_content}
                  supportName={adaptation.supports?.name ?? ""}
                  existingFeedback={getExistingFeedback(adaptation)}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
