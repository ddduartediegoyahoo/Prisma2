"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { validatePdfFile } from "@/lib/validations/exams";

interface SelectOption {
  id: string;
  name: string;
}

interface NewExamFormProps {
  subjects: SelectOption[];
  gradeLevels: SelectOption[];
  supports: SelectOption[];
}

interface FormErrors {
  subjectId?: string;
  gradeLevelId?: string;
  supportIds?: string;
  file?: string;
}

export function NewExamForm({
  subjects,
  gradeLevels,
  supports,
}: NewExamFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subjectId, setSubjectId] = useState("");
  const [gradeLevelId, setGradeLevelId] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedSupportIds, setSelectedSupportIds] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSupport = (id: string) => {
    setSelectedSupportIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    if (errors.supportIds) {
      setErrors((p) => ({ ...p, supportIds: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPdfFile(file);
    if (errors.file) {
      setErrors((p) => ({ ...p, file: undefined }));
    }
  };

  const removeFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!subjectId) newErrors.subjectId = "Selecione uma disciplina.";
    if (!gradeLevelId) newErrors.gradeLevelId = "Selecione um ano/série.";
    if (selectedSupportIds.length === 0)
      newErrors.supportIds = "Selecione ao menos um apoio.";

    const fileError = validatePdfFile(pdfFile);
    if (fileError) newErrors.file = fileError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !pdfFile) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("subjectId", subjectId);
      formData.append("gradeLevelId", gradeLevelId);
      formData.append("topic", topic);
      formData.append("supportIds", JSON.stringify(selectedSupportIds));

      const res = await fetch("/api/exams", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Erro ao enviar a prova."
        );
      }

      const data = await res.json();
      toast.success("Prova enviada para adaptação!");
      router.push(`/exams/${data.id}/processing`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar a prova."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informações da Prova</CardTitle>
          <CardDescription>
            Selecione a disciplina, ano/série e os apoios desejados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Disciplina */}
          <div className="space-y-2">
            <Label>
              Disciplina <span className="text-destructive">*</span>
            </Label>
            <Select
              value={subjectId}
              onValueChange={(v) => {
                setSubjectId(v);
                if (errors.subjectId)
                  setErrors((p) => ({ ...p, subjectId: undefined }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a disciplina" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subjectId && (
              <p className="text-sm text-destructive">{errors.subjectId}</p>
            )}
          </div>

          {/* Ano/Série */}
          <div className="space-y-2">
            <Label>
              Ano/Série <span className="text-destructive">*</span>
            </Label>
            <Select
              value={gradeLevelId}
              onValueChange={(v) => {
                setGradeLevelId(v);
                if (errors.gradeLevelId)
                  setErrors((p) => ({ ...p, gradeLevelId: undefined }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano/série" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gradeLevelId && (
              <p className="text-sm text-destructive">{errors.gradeLevelId}</p>
            )}
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <Label htmlFor="topic">Conhecimento / Tema (opcional)</Label>
            <Input
              id="topic"
              placeholder="Ex: Frações, Segunda Guerra Mundial..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Apoios */}
          <div className="space-y-3">
            <Label>
              Apoios (necessidades educacionais){" "}
              <span className="text-destructive">*</span>
            </Label>
            {supports.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum apoio disponível. Solicite ao administrador que configure
                os apoios.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {supports.map((support) => (
                  <label
                    key={support.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-primary/5"
                  >
                    <Checkbox
                      checked={selectedSupportIds.includes(support.id)}
                      onCheckedChange={() => toggleSupport(support.id)}
                    />
                    <span className="text-sm font-medium">{support.name}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.supportIds && (
              <p className="text-sm text-destructive">{errors.supportIds}</p>
            )}
          </div>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label>
              Arquivo PDF <span className="text-destructive">*</span>
            </Label>
            {pdfFile ? (
              <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pdfFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-8 transition-colors hover:border-primary/50 hover:bg-accent/30"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current?.click();
                }}
                role="button"
                tabIndex={0}
              >
                <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Clique para selecionar o PDF
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Apenas arquivos PDF, máximo 25 MB
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {errors.file && (
              <p className="text-sm text-destructive">{errors.file}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar para adaptação"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
