"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Loader2, Pencil } from "lucide-react";

interface SupportWithJoins {
  id: string;
  name: string;
  agent_id: string;
  model_id: string | null;
  enabled: boolean;
  created_at: string;
  agents: { name: string } | null;
  ai_models: { name: string; model_id: string } | null;
}

interface SelectOption {
  id: string;
  name: string;
}

const API_PATH = "/api/admin/supports";
const QUERY_KEY = "admin-supports";

interface FormErrors {
  name?: string;
  agent_id?: string;
  model_id?: string;
}

export default function SupportsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupport, setEditingSupport] = useState<SupportWithJoins | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    agent_id: "",
    model_id: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const queryClient = useQueryClient();

  // Fetch supports with joins
  const { data: supports = [], isLoading } = useQuery<SupportWithJoins[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await fetch(API_PATH);
      if (!res.ok) throw new Error("Erro ao carregar apoios.");
      return res.json();
    },
  });

  // Fetch enabled agents for select
  const { data: agents = [] } = useQuery<SelectOption[]>({
    queryKey: ["admin-agents-enabled"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agents");
      if (!res.ok) throw new Error("Erro ao carregar agentes.");
      const data = await res.json();
      return data.filter((a: { enabled: boolean }) => a.enabled);
    },
  });

  // Fetch enabled models for select
  const { data: models = [] } = useQuery<SelectOption[]>({
    queryKey: ["admin-models-enabled"],
    queryFn: async () => {
      const res = await fetch("/api/admin/models");
      if (!res.ok) throw new Error("Erro ao carregar modelos.");
      const data = await res.json();
      return data.filter((m: { enabled: boolean }) => m.enabled);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string" ? err.error : "Erro ao criar apoio."
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Apoio criado com sucesso!");
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`${API_PATH}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Erro ao atualizar apoio."
        );
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

  const resetForm = () => {
    setFormData({ name: "", agent_id: "", model_id: "" });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = "O nome é obrigatório.";
    if (!formData.agent_id) errors.agent_id = "Selecione um agente.";
    if (!formData.model_id) errors.model_id = "Selecione um modelo.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) return;
    createMutation.mutate({
      name: formData.name.trim(),
      agent_id: formData.agent_id,
      model_id: formData.model_id,
    });
  };

  const handleEdit = () => {
    if (!editingSupport || !validateForm()) return;
    updateMutation.mutate(
      {
        id: editingSupport.id,
        data: {
          name: formData.name.trim(),
          agent_id: formData.agent_id,
          model_id: formData.model_id,
        },
      },
      {
        onSuccess: () => {
          toast.success("Apoio atualizado com sucesso!");
          setEditingSupport(null);
          resetForm();
        },
      }
    );
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updateMutation.mutate(
      { id, data: { enabled } },
      {
        onSuccess: () => {
          if (enabled) {
            toast.success("Apoio habilitado com sucesso!");
          }
        },
      }
    );
  };

  const openEditDialog = (support: SupportWithJoins) => {
    setEditingSupport(support);
    setFormData({
      name: support.name,
      agent_id: support.agent_id,
      model_id: support.model_id ?? "",
    });
    setFormErrors({});
  };

  const renderFormFields = (idPrefix: string) => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-support-name`}>Nome do Apoio</Label>
        <Input
          id={`${idPrefix}-support-name`}
          placeholder="Ex: Deficiência Intelectual (DI)"
          value={formData.name}
          onChange={(e) => {
            setFormData((p) => ({ ...p, name: e.target.value }));
            if (formErrors.name)
              setFormErrors((p) => ({ ...p, name: undefined }));
          }}
        />
        {formErrors.name && (
          <p className="text-sm text-destructive">{formErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Agente</Label>
        <Select
          value={formData.agent_id}
          onValueChange={(value) => {
            setFormData((p) => ({ ...p, agent_id: value }));
            if (formErrors.agent_id)
              setFormErrors((p) => ({ ...p, agent_id: undefined }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um agente" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.agent_id && (
          <p className="text-sm text-destructive">{formErrors.agent_id}</p>
        )}
        {agents.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum agente habilitado disponível. Crie um agente primeiro.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Modelo de IA</Label>
        <Select
          value={formData.model_id}
          onValueChange={(value) => {
            setFormData((p) => ({ ...p, model_id: value }));
            if (formErrors.model_id)
              setFormErrors((p) => ({ ...p, model_id: undefined }));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.model_id && (
          <p className="text-sm text-destructive">{formErrors.model_id}</p>
        )}
        {models.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum modelo habilitado disponível. Crie um modelo primeiro.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apoios</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie as necessidades educacionais disponíveis para os
            professores.
          </p>
        </div>

        {/* Create Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Apoio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Apoio</DialogTitle>
              <DialogDescription>
                Vincule uma necessidade educacional a um agente e modelo de IA.
              </DialogDescription>
            </DialogHeader>
            {renderFormFields("create")}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editingSupport !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSupport(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Apoio</DialogTitle>
            <DialogDescription>
              Atualize o nome, agente ou modelo vinculado a este apoio.
            </DialogDescription>
          </DialogHeader>
          {renderFormFields("edit")}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingSupport(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : supports.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum apoio cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supports.map((support) => (
                <TableRow
                  key={support.id}
                  className={!support.enabled ? "opacity-60" : ""}
                >
                  <TableCell className="font-medium">{support.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {support.agents?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {support.model_id === null ? (
                      <Badge variant="destructive" className="text-xs">
                        Modelo removido
                      </Badge>
                    ) : support.ai_models ? (
                      `${support.ai_models.name} (${support.ai_models.model_id})`
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={support.enabled ? "default" : "secondary"}
                    >
                      {support.enabled ? "Habilitado" : "Desabilitado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={support.enabled}
                        onCheckedChange={(checked) =>
                          handleToggleEnabled(support.id, checked)
                        }
                        disabled={updateMutation.isPending}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(support)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
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
