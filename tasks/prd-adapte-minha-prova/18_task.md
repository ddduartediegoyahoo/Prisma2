# Tarefa 18.0: Admin — Evolução de Agentes

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o fluxo completo de evolução de agentes: o admin acessa a página de evolução de um agente, visualiza os feedbacks dos professores vinculados àquele agente, seleciona os feedbacks relevantes, e clica em "Evoluir". O sistema envia o prompt atual + feedbacks selecionados a uma LLM, que retorna uma sugestão de novo prompt. O admin visualiza o comparador lado a lado e pode aceitar ou descartar.

<requirements>
- Botão "Evoluir agente" na página de edição (link — implementado na tarefa 7.0) (PRD F8.6)
- Página de evolução exibe lista de feedbacks vinculados ao agente (PRD F8.7)
- Cada feedback mostra: questão original, questão adaptada, rating e comentário do professor
- Admin seleciona feedbacks via checkboxes e clica em "Evoluir" (PRD F8.8)
- Sistema envia dados à LLM e recebe sugestão de prompt (PRD F8.8)
- Exibir comparador lado a lado: prompt atual vs sugerido, com comentário da LLM (PRD F8.9)
- Admin pode aceitar (substitui prompt atual) ou descartar (PRD F8.10)
- Histórico de evoluções persistido em `agent_evolutions`
- Edge Function `evolve-agent` para processamento
- API Routes para listar feedbacks e trigger de evolução
</requirements>

## Subtarefas

- [ ] 18.1 Criar API Route `app/api/admin/agents/[id]/feedbacks/route.ts` (GET: lista feedbacks com questão original + adaptada + rating + comentário, filtrados pelo agente)
- [ ] 18.2 Criar Edge Function `supabase/functions/evolve-agent/index.ts`
- [ ] 18.3 Implementar lógica da Edge Function: receber agent prompt + feedbacks, chamar LLM, retornar sugestão + comentário
- [ ] 18.4 Criar API Route `app/api/admin/agents/[id]/evolve/route.ts` (POST: recebe feedback_ids, invoca Edge Function, retorna resultado)
- [ ] 18.5 Criar página `app/(admin)/config/agents/[id]/evolve/page.tsx` (substituir placeholder da tarefa 7.0)
- [ ] 18.6 Criar Client Component `FeedbackSelector`: tabela de feedbacks com checkboxes + botão "Evoluir"
- [ ] 18.7 Criar Client Component `PromptComparator`: exibição lado a lado do prompt atual vs sugerido
- [ ] 18.8 Exibir comentário explicativo gerado pela LLM sobre as mudanças sugeridas
- [ ] 18.9 Implementar ação "Aceitar": atualizar `agents.prompt` com o sugerido e registrar em `agent_evolutions` com `accepted = true`
- [ ] 18.10 Implementar ação "Descartar": registrar em `agent_evolutions` com `accepted = false`
- [ ] 18.11 Persistir histórico em `agent_evolutions`
- [ ] 18.12 Testar Edge Function com Supabase CLI local

## Detalhes de Implementação

Referir-se às seções **"Supabase Edge Functions"** e **"Modelos de Dados"** da `techspec.md` para `agent_evolutions`.

Query para listar feedbacks vinculados a um agente:

```sql
-- Feedbacks onde a adaptação usou um apoio cujo agent_id = [agente em questão]
SELECT
  f.id, f.rating, f.comment, f.created_at,
  q.content AS original_content,
  a.adapted_content,
  s.name AS support_name
FROM feedbacks f
JOIN adaptations a ON a.id = f.adaptation_id
JOIN questions q ON q.id = a.question_id
JOIN supports s ON s.id = a.support_id
WHERE s.agent_id = $1
  AND f.comment IS NOT NULL
ORDER BY f.created_at DESC;
```

Prompt para evolução do agente:

```typescript
const evolvePrompt = `Você é um especialista em engenharia de prompts para educação inclusiva.

Prompt atual do agente:
---
${agent.prompt}
---

Abaixo estão feedbacks de professores sobre adaptações geradas por este agente:

${selectedFeedbacks.map((f, i) => `
### Feedback ${i + 1} (Nota: ${f.rating}/5)
**Questão original:** ${f.originalContent}
**Questão adaptada:** ${f.adaptedContent}
**Comentário do professor:** ${f.comment}
`).join('\n')}

Com base nesses feedbacks, sugira uma versão melhorada do prompt. Explique as mudanças propostas.

Retorne em formato JSON com: { suggestedPrompt: string, commentary: string }`;
```

Comparador lado a lado:

```
┌──────────────────────┬──────────────────────┐
│   Prompt Atual       │   Prompt Sugerido    │
├──────────────────────┼──────────────────────┤
│ "Você é um agente    │ "Você é um agente    │
│  de adaptação..."    │  de adaptação que    │
│                      │  prioriza..."        │
└──────────────────────┴──────────────────────┘
│ Comentário: "As mudanças focam em..."       │
├─────────────────────────────────────────────┤
│        [Aceitar]        [Descartar]         │
└─────────────────────────────────────────────┘
```

Usar componentes Shadcn UI: `Table`, `Checkbox`, `Button`, `Card`, `Textarea` (readonly), `Badge`, `Separator`.

## Critérios de Sucesso

- Admin visualiza feedbacks com questão original, adaptada, rating e comentário
- Admin pode selecionar feedbacks e clicar em "Evoluir"
- LLM retorna sugestão de prompt e comentário explicativo
- Comparador lado a lado exibe prompt atual vs sugerido
- "Aceitar" atualiza o prompt do agente e registra em `agent_evolutions`
- "Descartar" registra em `agent_evolutions` com `accepted = false`
- Histórico de evoluções é persistido

## Arquivos relevantes

- `app/(admin)/config/agents/[id]/evolve/page.tsx`
- `app/(admin)/config/agents/[id]/evolve/_components/FeedbackSelector.tsx`
- `app/(admin)/config/agents/[id]/evolve/_components/PromptComparator.tsx`
- `app/api/admin/agents/[id]/feedbacks/route.ts`
- `app/api/admin/agents/[id]/evolve/route.ts`
- `supabase/functions/evolve-agent/index.ts`
