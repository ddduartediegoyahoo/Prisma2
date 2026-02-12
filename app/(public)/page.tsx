import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  Sparkles,
  FileCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const flowSteps = [
  {
    icon: Upload,
    title: "Envie sua prova",
    description:
      "Faça upload do PDF da prova e selecione as necessidades educacionais dos seus alunos.",
  },
  {
    icon: Sparkles,
    title: "IA adapta as questões",
    description:
      "Nossa inteligência artificial analisa cada questão e gera versões adaptadas mantendo os objetivos pedagógicos.",
  },
  {
    icon: FileCheck,
    title: "Copie o resultado",
    description:
      "Visualize as adaptações com análise BNCC e Bloom, e copie o texto para seu documento.",
  },
];

const highlights = [
  "Identifica habilidades BNCC automaticamente",
  "Analisa nível cognitivo Bloom",
  "Preserva objetivos de aprendizagem",
  "Suporta múltiplas necessidades educacionais",
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold">Adapte Minha Prova</span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/login">Entrar</Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Adapte avaliações
            <br />
            <span className="text-primary">em minutos, não horas.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Ferramenta para professores que precisam adaptar provas para
            estudantes com necessidades educacionais específicas — DI, TEA,
            dislexia, TDAH e outras — mantendo os objetivos pedagógicos.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link href="/login">
                Começar Agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Highlights */}
        <div className="mx-auto mt-16 flex max-w-2xl flex-wrap justify-center gap-3">
          {highlights.map((text) => (
            <span
              key={text}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm"
            >
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* Flow Section */}
      <section className="border-t bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Como funciona
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Três passos simples para adaptar suas avaliações.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {flowSteps.map((step, index) => (
              <Card
                key={step.title}
                className="relative border-0 bg-card shadow-sm"
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Pronto para adaptar suas provas?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Gratuito para professores. Entre com sua conta Google e comece agora.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild className="gap-2">
              <Link href="/login">
                Entrar com Google
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Adapte Minha Prova. Feito para
            professores que acreditam na educação inclusiva.
          </p>
        </div>
      </footer>
    </main>
  );
}
