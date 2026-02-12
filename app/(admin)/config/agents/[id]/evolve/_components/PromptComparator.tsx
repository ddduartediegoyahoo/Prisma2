"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, X, Loader2, MessageSquare } from "lucide-react";

interface PromptComparatorProps {
  agentId: string;
  evolutionId: string;
  originalPrompt: string;
  suggestedPrompt: string;
  commentary: string;
  onComplete: () => void;
}

export function PromptComparator({
  agentId,
  evolutionId,
  originalPrompt,
  suggestedPrompt,
  commentary,
  onComplete,
}: PromptComparatorProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDecision = async (accepted: boolean) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/evolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evolutionId,
          accepted,
          suggestedPrompt: accepted ? suggestedPrompt : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao processar decisão.");
      }

      toast.success(
        accepted
          ? "Prompt do agente atualizado com sucesso!"
          : "Sugestão descartada."
      );
      onComplete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao processar decisão."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Commentary */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="flex items-start gap-3 pt-5">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Análise da IA
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-blue-700 dark:text-blue-300">
              {commentary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Side by side comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Prompt Atual</CardTitle>
            <CardDescription>Versão em uso pelo agente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/50 p-4 font-mono text-xs leading-relaxed">
              {originalPrompt}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Prompt Sugerido</CardTitle>
            <CardDescription>Nova versão proposta pela IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-md bg-primary/5 p-4 font-mono text-xs leading-relaxed">
              {suggestedPrompt}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleDecision(false)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          Descartar
        </Button>
        <Button
          onClick={() => handleDecision(true)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Aceitar e Atualizar Prompt
        </Button>
      </div>
    </div>
  );
}
