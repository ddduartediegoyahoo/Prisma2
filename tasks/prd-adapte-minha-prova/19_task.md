# Tarefa 19.0: Landing Page (Hero + CTA)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a landing page pública do aplicativo com design moderno e minimalista. Contém hero section com proposta de valor e CTA de login via Google. Esta tarefa é independente e pode ser desenvolvida em paralelo com as demais.

<requirements>
- Hero section com proposta de valor clara (PRD F1.1)
- Design moderno e minimalista, desktop-first (PRD F1.2)
- CTA principal: botão "Entrar com Google" que inicia fluxo de login
- Se usuário já está logado, redirecionar para `/dashboard`
- Idioma: português brasileiro
- Acessibilidade: contraste, alt texts, navegação por teclado
</requirements>

## Subtarefas

- [ ] 19.1 Criar `app/(public)/page.tsx` como Server Component que verifica se há sessão ativa (se sim, redirect para `/dashboard`)
- [ ] 19.2 Implementar hero section com título, subtítulo e descrição breve do produto
- [ ] 19.3 Implementar CTA "Entrar com Google" que navega para `/login` ou inicia OAuth diretamente
- [ ] 19.4 Adicionar seção visual (ícones ou ilustração simples) representando o fluxo: Upload → Adaptação → Resultado
- [ ] 19.5 Estilizar com Tailwind CSS seguindo guidelines (sem arbitrary values, utility-first)
- [ ] 19.6 Garantir acessibilidade: contraste, semântica HTML, alt text

## Detalhes de Implementação

Referir-se à seção **"Estrutura do App Router"** da `techspec.md` — a landing page fica em `app/(public)/page.tsx`.

Estrutura sugerida:

```tsx
export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-5xl font-bold tracking-tight">
          Adapte Minha Prova
        </h1>
        <p className="mt-6 text-xl text-muted-foreground">
          Adapte avaliações para estudantes com necessidades educacionais
          específicas em minutos, não horas.
        </p>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/login">Entrar com Google</Link>
          </Button>
        </div>
      </section>

      {/* Fluxo visual */}
      <section className="...">
        {/* 3 cards: Upload → IA Adapta → Resultado */}
      </section>
    </main>
  );
}
```

Usar componentes Shadcn UI: `Button`, `Card`.
Usar `lucide-react` para ícones do fluxo (Upload, Brain/Sparkles, FileCheck).

## Critérios de Sucesso

- Landing page renderiza com design moderno e minimalista
- CTA "Entrar com Google" navega para login
- Usuário logado é redirecionado para dashboard
- Design acessível (validar com axe DevTools)
- Texto claro em PT-BR

## Arquivos relevantes

- `app/(public)/page.tsx`
