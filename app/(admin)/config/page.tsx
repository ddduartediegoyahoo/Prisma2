import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bot,
  BrainCircuit,
  GraduationCap,
  HandHeart,
  BookOpen,
} from "lucide-react";

const configSections = [
  {
    title: "Modelos de IA",
    description: "Gerencie os modelos LLM configurados para o sistema.",
    href: "/config/models",
    icon: BrainCircuit,
  },
  {
    title: "Agentes",
    description: "Crie e edite os prompts de adaptação dos agentes de IA.",
    href: "/config/agents",
    icon: Bot,
  },
  {
    title: "Apoios",
    description:
      "Configure as necessidades educacionais vinculando agentes e modelos.",
    href: "/config/supports",
    icon: HandHeart,
  },
  {
    title: "Disciplinas",
    description: "Gerencie as disciplinas disponíveis para os professores.",
    href: "/config/subjects",
    icon: BookOpen,
  },
  {
    title: "Anos/Séries",
    description: "Gerencie os anos e séries disponíveis para os professores.",
    href: "/config/grade-levels",
    icon: GraduationCap,
  },
];

export default function ConfigPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-2 text-muted-foreground">
          Gerencie os recursos do sistema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="transition-colors hover:border-primary/50 hover:bg-accent/50">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
