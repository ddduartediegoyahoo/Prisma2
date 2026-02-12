"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Sparkles,
  Star,
  EyeOff,
  Eye,
  Search,
  CheckCircle2,
} from "lucide-react";

interface AgentFeedback {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  originalContent: string;
  adaptedContent: string;
  supportName: string;
  dismissed: boolean;
  usedInEvolution: boolean;
}

type StatusFilter = "all" | "available" | "used" | "dismissed";

const RATING_OPTIONS = ["all", "1", "2", "3", "4", "5"] as const;

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  available: "Disponíveis",
  used: "Já utilizados",
  dismissed: "Descartados",
};

interface FeedbackSelectorProps {
  agentId: string;
  onEvolve: (feedbackIds: string[]) => void;
  isEvolving: boolean;
}

export function FeedbackSelector({
  agentId,
  onEvolve,
  isEvolving,
}: FeedbackSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [supportFilter, setSupportFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const queryClient = useQueryClient();

  const queryKey = ["agent-feedbacks", agentId];

  const { data: feedbacks = [], isLoading } = useQuery<AgentFeedback[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/admin/agents/${agentId}/feedbacks`);
      if (!res.ok) throw new Error("Erro ao carregar feedbacks.");
      return res.json();
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async ({
      feedbackId,
      dismissed,
    }: {
      feedbackId: string;
      dismissed: boolean;
    }) => {
      const res = await fetch(
        `/api/admin/agents/${agentId}/feedbacks/${feedbackId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dismissed_from_evolution: dismissed }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao atualizar feedback.");
      }
      return { feedbackId, dismissed };
    },
    onSuccess: ({ feedbackId, dismissed }) => {
      queryClient.setQueryData<AgentFeedback[]>(queryKey, (old) =>
        (old ?? []).map((f) =>
          f.id === feedbackId ? { ...f, dismissed } : f
        )
      );
      // Remove from selection if dismissed
      if (dismissed) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(feedbackId);
          return next;
        });
      }
      toast.success(
        dismissed
          ? "Feedback descartado da evolução."
          : "Feedback restaurado para evolução."
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Derive unique support names for filter dropdown
  const supportNames = useMemo(() => {
    const names = new Set(feedbacks.map((f) => f.supportName));
    return Array.from(names).sort();
  }, [feedbacks]);

  // Apply filters
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesComment = f.comment?.toLowerCase().includes(query);
        const matchesOriginal = f.originalContent
          ?.toLowerCase()
          .includes(query);
        const matchesAdapted = f.adaptedContent?.toLowerCase().includes(query);
        if (!matchesComment && !matchesOriginal && !matchesAdapted) {
          return false;
        }
      }

      // Rating filter
      if (ratingFilter !== "all" && f.rating !== Number(ratingFilter)) {
        return false;
      }

      // Support filter
      if (supportFilter !== "all" && f.supportName !== supportFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "available" && (f.dismissed || f.usedInEvolution)) {
        return false;
      }
      if (statusFilter === "used" && !f.usedInEvolution) {
        return false;
      }
      if (statusFilter === "dismissed" && !f.dismissed) {
        return false;
      }

      return true;
    });
  }, [feedbacks, searchQuery, ratingFilter, supportFilter, statusFilter]);

  // Selectable feedbacks: not dismissed and not already used
  const isSelectable = (f: AgentFeedback) =>
    !f.dismissed && !f.usedInEvolution;

  const selectableFeedbacks = filteredFeedbacks.filter(isSelectable);

  const toggleFeedback = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (
      selectableFeedbacks.length > 0 &&
      selectableFeedbacks.every((f) => selectedIds.has(f.id))
    ) {
      // Deselect all visible selectable
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const f of selectableFeedbacks) next.delete(f.id);
        return next;
      });
    } else {
      // Select all visible selectable
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const f of selectableFeedbacks) next.add(f.id);
        return next;
      });
    }
  };

  const allSelectableChecked =
    selectableFeedbacks.length > 0 &&
    selectableFeedbacks.every((f) => selectedIds.has(f.id));

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    ratingFilter !== "all" ||
    supportFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setRatingFilter("all");
    setSupportFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-12 text-center">
        <p className="text-muted-foreground">
          Nenhum feedback com comentário encontrado para este agente.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Os professores precisam avaliar e comentar as adaptações antes de
          evoluir o agente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por texto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Nota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas notas</SelectItem>
            {RATING_OPTIONS.filter((r) => r !== "all").map((r) => (
              <SelectItem key={r} value={r}>
                {r} estrela{Number(r) > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={supportFilter} onValueChange={setSupportFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Apoio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos apoios</SelectItem>
            {supportNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(STATUS_LABELS) as [StatusFilter, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-xs"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Selection info + evolve button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedIds.size > 0
            ? `${selectedIds.size} feedback(s) selecionado(s)`
            : `${filteredFeedbacks.length} feedback(s) exibidos`}
        </p>
        <Button
          onClick={() => onEvolve(Array.from(selectedIds))}
          disabled={selectedIds.size === 0 || isEvolving}
        >
          {isEvolving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Evoluir
        </Button>
      </div>

      {/* Table */}
      {filteredFeedbacks.length === 0 ? (
        <div className="rounded-md border border-dashed py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum feedback corresponde aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelectableChecked}
                    onCheckedChange={toggleAll}
                    disabled={selectableFeedbacks.length === 0}
                  />
                </TableHead>
                <TableHead>Questão Original</TableHead>
                <TableHead>Questão Adaptada</TableHead>
                <TableHead className="w-[80px]">Nota</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead className="w-[100px]">Apoio</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[60px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedbacks.map((feedback) => {
                const canSelect = isSelectable(feedback);
                const isUsed = feedback.usedInEvolution;
                const isDismissed = feedback.dismissed;

                return (
                  <TableRow
                    key={feedback.id}
                    className={
                      isDismissed
                        ? "opacity-50"
                        : isUsed
                          ? "opacity-70"
                          : ""
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(feedback.id)}
                        onCheckedChange={() => toggleFeedback(feedback.id)}
                        disabled={!canSelect}
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px] text-xs">
                      <p
                        className={`line-clamp-3 ${isDismissed ? "line-through" : ""}`}
                      >
                        {feedback.originalContent}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[200px] text-xs">
                      <p
                        className={`line-clamp-3 ${isDismissed ? "line-through" : ""}`}
                      >
                        {feedback.adaptedContent}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {feedback.rating}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] text-xs">
                      <p
                        className={`line-clamp-3 ${isDismissed ? "line-through" : ""}`}
                      >
                        {feedback.comment}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {feedback.supportName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isDismissed ? (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          Descartado
                        </Badge>
                      ) : isUsed ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Utilizado
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={dismissMutation.isPending}
                            onClick={() =>
                              dismissMutation.mutate({
                                feedbackId: feedback.id,
                                dismissed: !isDismissed,
                              })
                            }
                          >
                            {isDismissed ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isDismissed
                            ? "Restaurar para evolução"
                            : "Descartar da evolução"}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
