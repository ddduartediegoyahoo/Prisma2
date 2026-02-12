# Tarefa 15.0: Professor — Tela de Processamento (Polling Assíncrono)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a página de processamento onde o professor acompanha o progresso da extração ou adaptação. A página usa polling para verificar o status do exame e atualiza a UI automaticamente. Quando concluído, exibe botão para avançar ao resultado.

<requirements>
- Exibir indicador de progresso durante processamento (PRD F6.6)
- Polling do status via TanStack React Query (`refetchInterval` de 3–5 segundos)
- Exibir fases: extração → aguardando respostas → analisando → concluído
- Quando status = `awaiting_answers`, redirecionar para `/exams/[id]/extraction`
- Quando status = `completed`, exibir botão "Ver Resultado" (PRD F6.7)
- Quando status = `error`, exibir mensagem de erro
- O professor pode sair e voltar — a página retoma de onde parou
- API Route para consultar status
</requirements>

## Subtarefas

- [ ] 15.1 Criar API Route `app/api/exams/[id]/status/route.ts` (GET: retorna status + contagens de progresso)
- [ ] 15.2 Criar página `app/(auth)/exams/[id]/processing/page.tsx` com Server Component que faz verificação inicial de status
- [ ] 15.3 Criar Client Component `ProcessingStatus` com polling via TanStack React Query
- [ ] 15.4 Implementar UI de progresso: steps/stepper visual mostrando fase atual
- [ ] 15.5 Implementar redirect automático para `/exams/[id]/extraction` quando status = `awaiting_answers`
- [ ] 15.6 Implementar botão "Ver Resultado" quando status = `completed`
- [ ] 15.7 Implementar exibição de erro quando status = `error` (com mensagem do banco)
- [ ] 15.8 Implementar indicador de contagem de adaptações concluídas vs total (ex: "3/10 questões adaptadas")

## Detalhes de Implementação

Referir-se à seção **"Considerações Técnicas > Decisões Principais"** da `techspec.md` sobre database polling com TanStack Query.

API Route de status:

```typescript
// app/api/exams/[id]/status/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("exams")
    .select("status, error_message")
    .eq("id", params.id)
    .single();

  // Contar adaptações por status
  const { count: totalAdaptations } = await supabase
    .from("adaptations")
    .select("*", { count: "exact", head: true })
    .eq("question_id.exam_id", params.id); // via join ou subquery

  const { count: completedAdaptations } = await supabase
    .from("adaptations")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  return NextResponse.json({
    status: exam.status,
    errorMessage: exam.error_message,
    progress: { total: totalAdaptations, completed: completedAdaptations },
  });
}
```

Polling no Client Component:

```typescript
const { data } = useQuery({
  queryKey: ["exam-status", examId],
  queryFn: () => fetch(`/api/exams/${examId}/status`).then(r => r.json()),
  refetchInterval: 4000, // 4 segundos
  refetchIntervalInBackground: false, // parar quando tab não está ativa
});
```

Stepper visual com estados:

```
[✓ Upload] → [✓ Extração] → [● Adaptação (3/10)] → [ Resultado]
```

Usar componentes Shadcn UI: `Card`, `Badge`, `Button`, `Progress` (barra de progresso).

## Critérios de Sucesso

- Página exibe fase atual corretamente
- Polling atualiza status a cada 3–5 segundos
- Redirect automático para extração quando `awaiting_answers`
- Botão "Ver Resultado" aparece quando `completed`
- Mensagem de erro exibida quando `error`
- Barra/indicador de progresso mostra adaptações concluídas vs total
- Professor pode sair e voltar sem perder progresso

## Arquivos relevantes

- `app/(auth)/exams/[id]/processing/page.tsx`
- `app/(auth)/exams/[id]/processing/_components/ProcessingStatus.tsx`
- `app/api/exams/[id]/status/route.ts`
