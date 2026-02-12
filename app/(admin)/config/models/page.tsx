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
import { Plus, Loader2, KeyRound, Pencil, Trash2, Star } from "lucide-react";
import type { AiModel } from "@/lib/types/admin";

const API_PATH = "/api/admin/models";
const QUERY_KEY = "admin-models";

interface FormErrors {
  name?: string;
  base_url?: string;
  api_key?: string;
  model_id?: string;
}

export default function ModelsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);
  const [deletingModel, setDeletingModel] = useState<AiModel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    base_url: "",
    api_key: "",
    model_id: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const queryClient = useQueryClient();

  const { data: models = [], isLoading } = useQuery<AiModel[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await fetch(API_PATH);
      if (!res.ok) throw new Error("Erro ao carregar modelos.");
      return res.json();
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
          typeof err.error === "string"
            ? err.error
            : "Erro ao criar modelo."
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Modelo criado com sucesso!");
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
            : "Erro ao atualizar modelo."
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_PATH}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Erro ao excluir modelo."
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["admin-supports"] });
      const disabledCount = data.disabledSupports ?? 0;
      if (disabledCount > 0) {
        toast.success(
          `Modelo excluído. ${disabledCount} apoio(s) vinculado(s) foram desabilitados.`
        );
      } else {
        toast.success("Modelo excluído com sucesso!");
      }
      setDeletingModel(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", base_url: "", api_key: "", model_id: "" });
    setFormErrors({});
  };

  const validateForm = (isEdit = false): boolean => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = "O nome é obrigatório.";
    if (!formData.base_url.trim()) {
      errors.base_url = "A URL base é obrigatória.";
    } else {
      try {
        new URL(formData.base_url);
      } catch {
        errors.base_url = "Informe uma URL válida.";
      }
    }
    if (!isEdit && !formData.api_key.trim())
      errors.api_key = "A API Key é obrigatória.";
    if (!formData.model_id.trim())
      errors.model_id = "O Model ID é obrigatório.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm()) return;
    createMutation.mutate({
      name: formData.name.trim(),
      base_url: formData.base_url.trim(),
      api_key: formData.api_key.trim(),
      model_id: formData.model_id.trim(),
    });
  };

  const handleEdit = () => {
    if (!editingModel || !validateForm(true)) return;

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      base_url: formData.base_url.trim(),
      model_id: formData.model_id.trim(),
    };

    // Only include api_key if user provided a new one
    if (formData.api_key.trim()) {
      payload.api_key = formData.api_key.trim();
    }

    updateMutation.mutate(
      { id: editingModel.id, data: payload },
      {
        onSuccess: () => {
          toast.success("Modelo atualizado com sucesso!");
          setEditingModel(null);
          resetForm();
        },
      }
    );
  };

  const handleSetDefault = (modelId: string) => {
    updateMutation.mutate(
      { id: modelId, data: { is_default: true } },
      {
        onSuccess: () => {
          toast.success("Modelo padrão atualizado!");
        },
      }
    );
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updateMutation.mutate({ id, data: { enabled } });
  };

  const openEditDialog = (model: AiModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      base_url: model.base_url,
      api_key: "",
      model_id: model.model_id,
    });
    setFormErrors({});
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modelos de IA</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie os modelos LLM configurados para o sistema.
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
              Criar Modelo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Modelo de IA</DialogTitle>
              <DialogDescription>
                Configure um novo modelo LLM para uso no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-model-name">Nome</Label>
                <Input
                  id="create-model-name"
                  placeholder="Ex: GPT-4o"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-model-url">URL Base da API</Label>
                <Input
                  id="create-model-url"
                  placeholder="https://api.openai.com/v1"
                  value={formData.base_url}
                  onChange={(e) => updateField("base_url", e.target.value)}
                />
                {formErrors.base_url && (
                  <p className="text-sm text-destructive">
                    {formErrors.base_url}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-model-key">API Key</Label>
                <Input
                  id="create-model-key"
                  type="password"
                  placeholder="sk-..."
                  value={formData.api_key}
                  onChange={(e) => updateField("api_key", e.target.value)}
                />
                {formErrors.api_key && (
                  <p className="text-sm text-destructive">
                    {formErrors.api_key}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-model-id">Model ID</Label>
                <Input
                  id="create-model-id"
                  placeholder="Ex: gpt-4o, claude-sonnet-4-20250514"
                  value={formData.model_id}
                  onChange={(e) => updateField("model_id", e.target.value)}
                />
                {formErrors.model_id && (
                  <p className="text-sm text-destructive">
                    {formErrors.model_id}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
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
        open={editingModel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingModel(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Modelo de IA</DialogTitle>
            <DialogDescription>
              Atualize as configurações do modelo. Deixe a API Key vazia para
              manter a atual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-model-name">Nome</Label>
              <Input
                id="edit-model-name"
                placeholder="Ex: GPT-4o"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model-url">URL Base da API</Label>
              <Input
                id="edit-model-url"
                placeholder="https://api.openai.com/v1"
                value={formData.base_url}
                onChange={(e) => updateField("base_url", e.target.value)}
              />
              {formErrors.base_url && (
                <p className="text-sm text-destructive">
                  {formErrors.base_url}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model-key">API Key</Label>
              <Input
                id="edit-model-key"
                type="password"
                placeholder="Deixe vazio para manter a chave atual"
                value={formData.api_key}
                onChange={(e) => updateField("api_key", e.target.value)}
              />
              {formErrors.api_key && (
                <p className="text-sm text-destructive">
                  {formErrors.api_key}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model-id">Model ID</Label>
              <Input
                id="edit-model-id"
                placeholder="Ex: gpt-4o, claude-sonnet-4-20250514"
                value={formData.model_id}
                onChange={(e) => updateField("model_id", e.target.value)}
              />
              {formErrors.model_id && (
                <p className="text-sm text-destructive">
                  {formErrors.model_id}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingModel(null);
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deletingModel !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingModel(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Modelo</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o modelo{" "}
              <strong>{deletingModel?.name}</strong>? Apoios vinculados a este
              modelo serão desabilitados. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingModel(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingModel) deleteMutation.mutate(deletingModel.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : models.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum modelo cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Padrão</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Model ID</TableHead>
                <TableHead>URL Base</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[160px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow
                  key={model.id}
                  className={!model.enabled ? "opacity-60" : ""}
                >
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSetDefault(model.id)}
                          disabled={model.is_default || isFormPending}
                          className="flex items-center justify-center"
                        >
                          <Star
                            className={`h-5 w-5 transition-colors ${
                              model.is_default
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/40 hover:text-yellow-400"
                            }`}
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {model.is_default
                          ? "Modelo padrão do sistema"
                          : "Definir como modelo padrão"}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="font-medium">
                    {model.name}
                    {model.is_default && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Padrão
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {model.model_id}
                    </code>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {model.base_url}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <KeyRound className="h-3 w-3" />
                      {model.api_key}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={model.enabled ? "default" : "secondary"}
                    >
                      {model.enabled ? "Habilitado" : "Desabilitado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={model.enabled}
                        onCheckedChange={(checked) =>
                          handleToggleEnabled(model.id, checked)
                        }
                        disabled={updateMutation.isPending}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(model)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingModel(model)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
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
