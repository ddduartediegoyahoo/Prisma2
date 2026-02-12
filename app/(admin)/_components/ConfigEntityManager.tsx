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
import { Plus, Loader2 } from "lucide-react";

interface ConfigEntity {
  id: string;
  name: string;
  enabled: boolean;
  created_at: string;
}

interface ConfigEntityManagerProps {
  /** Display title for the entity type */
  title: string;
  /** Description shown below the title */
  description: string;
  /** API endpoint base path (e.g. "/api/admin/subjects") */
  apiPath: string;
  /** TanStack Query key */
  queryKey: string;
  /** Label for the name input in the create dialog */
  nameLabel: string;
  /** Placeholder for the name input */
  namePlaceholder: string;
  /** Error message shown when name is empty */
  nameRequiredMessage: string;
  /** Success message when item is created */
  createSuccessMessage: string;
}

export function ConfigEntityManager({
  title,
  description,
  apiPath,
  queryKey,
  nameLabel,
  namePlaceholder,
  nameRequiredMessage,
  createSuccessMessage,
}: ConfigEntityManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const queryClient = useQueryClient();

  // Fetch entities
  const { data: entities = [], isLoading } = useQuery<ConfigEntity[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await fetch(apiPath);
      if (!res.ok) throw new Error("Erro ao carregar dados.");
      return res.json();
    },
  });

  // Create entity
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao criar.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success(createSuccessMessage);
      setNewName("");
      setNameError("");
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Toggle enabled
  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      enabled,
    }: {
      id: string;
      enabled: boolean;
    }) => {
      const res = await fetch(`${apiPath}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao atualizar.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNameError(nameRequiredMessage);
      return;
    }
    setNameError("");
    createMutation.mutate(trimmed);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar {title.toLowerCase()}</DialogTitle>
              <DialogDescription>
                Preencha o nome para criar um novo item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="entity-name">{nameLabel}</Label>
                <Input
                  id="entity-name"
                  placeholder={namePlaceholder}
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                />
                {nameError && (
                  <p className="text-sm text-destructive">{nameError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : entities.length === 0 ? (
        <div className="rounded-md border py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum item cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow
                  key={entity.id}
                  className={!entity.enabled ? "opacity-60" : ""}
                >
                  <TableCell className="font-medium">
                    {entity.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entity.enabled ? "default" : "secondary"}>
                      {entity.enabled ? "Habilitado" : "Desabilitado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={entity.enabled}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: entity.id,
                          enabled: checked,
                        })
                      }
                      disabled={toggleMutation.isPending}
                    />
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
