"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";

interface AgentFormProps {
  defaultValues?: { name: string; prompt: string };
  onSubmit: (data: { name: string; prompt: string }) => Promise<void>;
  isEditing?: boolean;
}

interface FormErrors {
  name?: string;
  prompt?: string;
}

export function AgentForm({
  defaultValues,
  onSubmit,
  isEditing = false,
}: AgentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [prompt, setPrompt] = useState(defaultValues?.prompt ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "O nome do agente é obrigatório.";
    if (!prompt.trim()) newErrors.prompt = "O prompt é obrigatório.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), prompt: prompt.trim() });
      toast.success(
        isEditing
          ? "Agente atualizado com sucesso!"
          : "Agente criado com sucesso!"
      );
      router.push("/config/agents");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar agente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/config/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Agentes
          </Link>
        </Button>
      </div>

      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>
            {isEditing ? "Editar Agente" : "Criar Agente"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Altere o nome e o prompt do agente."
              : "Defina um nome e o prompt de adaptação para o novo agente."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Nome do Agente</Label>
              <Input
                id="agent-name"
                placeholder="Ex: Adaptação para DI"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                }}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-prompt">Prompt</Label>
              <Textarea
                id="agent-prompt"
                placeholder="Escreva o prompt de adaptação do agente..."
                className="min-h-[300px] font-mono text-sm"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (errors.prompt)
                    setErrors((p) => ({ ...p, prompt: undefined }));
                }}
              />
              {errors.prompt && (
                <p className="text-sm text-destructive">{errors.prompt}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {prompt.length.toLocaleString("pt-BR")} caracteres
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" asChild>
                <Link href="/config/agents">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEditing ? "Salvar Alterações" : "Criar Agente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
