"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Pencil } from "lucide-react";
import type { Agent } from "@/lib/types/admin";

const API_PATH = "/api/admin/agents";
const QUERY_KEY = "admin-agents";

export default function AgentsPage() {
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await fetch(API_PATH);
      if (!res.ok) throw new Error("Erro ao carregar agentes.");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await fetch(`${API_PATH}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao atualizar agente.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie os agentes de IA e seus prompts de adaptação.
          </p>
        </div>
        <Button asChild>
          <Link href="/config/agents/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agente
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum agente cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow
                  key={agent.id}
                  className={!agent.enabled ? "opacity-60" : ""}
                >
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                    {agent.prompt.slice(0, 120)}
                    {agent.prompt.length > 120 ? "..." : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={agent.enabled ? "default" : "secondary"}>
                      {agent.enabled ? "Habilitado" : "Desabilitado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/config/agents/${agent.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({
                            id: agent.id,
                            enabled: checked,
                          })
                        }
                        disabled={toggleMutation.isPending}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
