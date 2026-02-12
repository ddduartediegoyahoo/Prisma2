import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, GraduationCap, Tag, HandHeart } from "lucide-react";

interface ExamResultHeaderProps {
  subjectName: string;
  gradeLevelName: string;
  topic: string | null;
  supportNames: string[];
  createdAt: string;
}

export function ExamResultHeader({
  subjectName,
  gradeLevelName,
  topic,
  supportNames,
  createdAt,
}: ExamResultHeaderProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Resultado da Adaptação</CardTitle>
        <CardDescription>Prova adaptada em {formattedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Disciplina</p>
              <p className="text-sm font-medium">{subjectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Ano/Série</p>
              <p className="text-sm font-medium">{gradeLevelName}</p>
            </div>
          </div>
          {topic && (
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tema</p>
                <p className="text-sm font-medium">{topic}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <HandHeart className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Apoios</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {supportNames.map((name) => (
                  <Badge key={name} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
