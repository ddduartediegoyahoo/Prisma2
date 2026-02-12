"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FeedbackSelector } from "./_components/FeedbackSelector";
import { PromptComparator } from "./_components/PromptComparator";
import type { Agent } from "@/lib/types/admin";

interface EvolutionResult {
  evolutionId: string;
  suggestedPrompt: string;
  commentary: string;
  originalPrompt: string;
}

export default function EvolveAgentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionResult, setEvolutionResult] =
    useState<EvolutionResult | null>(null);

  const { data: agent, isLoading: isLoadingAgent } = useQuery<Agent>({
    queryKey: ["admin-agent", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/agents/${id}`);
      if (!res.ok) throw new Error("Erro ao carregar agente.");
      return res.json();
    },
  });

  const handleEvolve = async (feedbackIds: string[]) => {
    setIsEvolving(true);
    try {
      const res = await fetch(`/api/admin/agents/${id}/evolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackIds }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Erro ao evoluir agente."
        );
      }

      const result: EvolutionResult = await res.json();
      setEvolutionResult(result);
      toast.success("Sugestão de evolução gerada!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao evoluir agente."
      );
    } finally {
      setIsEvolving(false);
    }
  };

  const handleComplete = () => {
    setEvolutionResult(null);
    router.push(`/config/agents/${id}/edit`);
  };

  if (isLoadingAgent) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/config/agents/${id}/edit`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Edição
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Evoluir Agente</h1>
        <p className="mt-2 text-muted-foreground">
          {agent?.name ?? "Agente"} — Selecione feedbacks de professores para
          gerar uma sugestão de melhoria do prompt.
        </p>
      </div>

      {evolutionResult ? (
        <PromptComparator
          agentId={id}
          evolutionId={evolutionResult.evolutionId}
          originalPrompt={evolutionResult.originalPrompt}
          suggestedPrompt={evolutionResult.suggestedPrompt}
          commentary={evolutionResult.commentary}
          onComplete={handleComplete}
        />
      ) : (
        <FeedbackSelector
          agentId={id}
          onEvolve={handleEvolve}
          isEvolving={isEvolving}
        />
      )}
    </div>
  );
}
