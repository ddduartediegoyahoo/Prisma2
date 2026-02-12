"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AgentForm } from "../../_components/AgentForm";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Agent } from "@/lib/types/admin";

export default function EditAgentPage() {
  const { id } = useParams<{ id: string }>();

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ["admin-agent", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/agents/${id}`);
      if (!res.ok) throw new Error("Erro ao carregar agente.");
      return res.json();
    },
  });

  const handleSubmit = async (data: { name: string; prompt: string }) => {
    const res = await fetch(`/api/admin/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(
        typeof err.error === "string"
          ? err.error
          : "Erro ao atualizar agente."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">Agente não encontrado.</p>
      </div>
    );
  }

  return (
    <div>
      <AgentForm
        defaultValues={{ name: agent.name, prompt: agent.prompt }}
        onSubmit={handleSubmit}
        isEditing
      />

      <div className="mx-auto mt-6 max-w-3xl">
        <Button variant="outline" asChild className="w-full">
          <Link href={`/config/agents/${id}/evolve`}>
            <Sparkles className="mr-2 h-4 w-4" />
            Evoluir Agente
          </Link>
        </Button>
      </div>
    </div>
  );
}
