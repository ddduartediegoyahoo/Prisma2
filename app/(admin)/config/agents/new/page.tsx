"use client";

import { AgentForm } from "../_components/AgentForm";

export default function NewAgentPage() {
  const handleSubmit = async (data: { name: string; prompt: string }) => {
    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(
        typeof err.error === "string" ? err.error : "Erro ao criar agente."
      );
    }
  };

  return <AgentForm onSubmit={handleSubmit} />;
}
