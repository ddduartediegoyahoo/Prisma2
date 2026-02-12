# Tarefa 16.0: Professor — Tela de Resultado

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a página de resultado final onde o professor visualiza as informações da prova, as questões adaptadas para cada apoio, as análises BNCC e Bloom, e pode copiar o texto de cada adaptação. Esta página é acessada após a conclusão do processamento e também a partir do repositório (somente leitura).

<requirements>
- Exibir informações gerais da prova: disciplina, ano, tema, apoios selecionados (PRD F7.1)
- Para cada questão: exibir versão adaptada com botão de copiar texto (PRD F7.2)
- Para cada questão: exibir análise de habilidades BNCC (PRD F7.3)
- Para cada questão: exibir análise do nível Bloom (PRD F7.4)
- Se múltiplos apoios: exibir abas ou seções separadas por apoio
- Botão de copiar copia texto para clipboard e exibe feedback visual
- Conteúdo é somente leitura (sem edição)
- Rastrear cópias (incrementar contador no banco ao copiar — KPI)
</requirements>

## Subtarefas

- [ ] 16.1 Criar página `app/(auth)/exams/[id]/result/page.tsx` como Server Component que carrega todos os dados do exame
- [ ] 16.2 Criar componente `ExamResultHeader` com informações gerais (disciplina, ano, tema, apoios)
- [ ] 16.3 Criar componente `QuestionResult` para exibir uma questão com suas adaptações
- [ ] 16.4 Criar componente `AdaptationCard` para cada adaptação (texto adaptado + botão copiar + BNCC + Bloom)
- [ ] 16.5 Implementar botão de copiar com `navigator.clipboard.writeText()` e feedback visual (toast "Copiado!")
- [ ] 16.6 Implementar exibição de análise BNCC: lista de habilidades + comentário
- [ ] 16.7 Implementar exibição de análise Bloom: nível + comentário
- [ ] 16.8 Se múltiplos apoios: implementar tabs ou accordion por apoio
- [ ] 16.9 Implementar rastreamento de cópia (POST para API ao copiar — para KPI)
- [ ] 16.10 Guard: verificar que exame pertence ao professor e status é `completed`

## Detalhes de Implementação

Referir-se às seções **"Modelos de Dados"** e **"Endpoints de API"** da `techspec.md`.

Query principal:

```typescript
const { data: exam } = await supabase
  .from("exams")
  .select(`
    *,
    subjects(name),
    grade_levels(name),
    exam_supports(supports(name)),
    questions(
      *,
      adaptations(
        *,
        supports(name)
      )
    )
  `)
  .eq("id", params.id)
  .single();
```

Componente de cópia (Client Component):

```typescript
"use client";

function CopyButton({ text }: { text: string }) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setHasCopied(true);
    // Registrar cópia para KPI
    fetch(`/api/exams/${examId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ type: "copy", adaptationId }),
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {hasCopied ? "Copiado!" : "Copiar"}
    </Button>
  );
}
```

Layout por questão:

```
┌─────────────────────────────────────────┐
│ Questão 1 (Objetiva)                    │
├─────────────────────────────────────────┤
│ BNCC: EF06MA01 | Bloom: Aplicação       │
│ Análise BNCC: "Esta questão avalia..."  │
│ Análise Bloom: "Nível de aplicação..." │
├─────────────────────────────────────────┤
│ [Tab: DI] [Tab: TEA] [Tab: Dislexia]   │
│ ┌─────────────────────────────────────┐ │
│ │ Versão adaptada para DI:            │ │
│ │ "Leia o texto com atenção..."      │ │
│ │                        [Copiar]     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Usar componentes Shadcn UI: `Card`, `Tabs`, `Badge`, `Button`, `Separator`, `Tooltip`.

## Critérios de Sucesso

- Informações da prova exibidas corretamente no header
- Cada questão mostra análise BNCC e Bloom
- Adaptações exibidas por apoio (tabs se múltiplos)
- Botão copiar funciona e exibe feedback visual
- Página é somente leitura
- Acesso restrito ao professor dono do exame
- Exame com status diferente de `completed` redireciona

## Arquivos relevantes

- `app/(auth)/exams/[id]/result/page.tsx`
- `app/(auth)/exams/[id]/result/_components/ExamResultHeader.tsx`
- `app/(auth)/exams/[id]/result/_components/QuestionResult.tsx`
- `app/(auth)/exams/[id]/result/_components/AdaptationCard.tsx`
- `app/(auth)/exams/[id]/result/_components/CopyButton.tsx`
