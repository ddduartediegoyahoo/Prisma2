# Tarefa 7.0: Admin — CRUD Agentes

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a gestão de Agentes (prompts de IA) no painel administrativo. Inclui listagem com toggle, criação em página dedicada e edição em página dedicada.

<requirements>
- Listar agentes com opção de habilitar/desabilitar (PRD F8.3)
- Criar agente em página dedicada com campos nome e prompt (PRD F8.4)
- Editar agente em página dedicada com campos nome e prompt (PRD F8.5)
- Botão "Evoluir agente" visível na página de edição (link para página de evolução — implementação na tarefa 18.0)
- Validação de input com Zod
- Textarea com altura generosa para o campo de prompt
- API Routes para CRUD
</requirements>

## Subtarefas

- [ ] 7.1 Criar schema Zod para validação de Agente (`lib/validations/agents.ts`)
- [ ] 7.2 Criar tipos TypeScript para Agent (`lib/types/admin.ts` — complementar)
- [ ] 7.3 Criar API Route `app/api/admin/agents/route.ts` (GET lista + POST criar)
- [ ] 7.4 Criar API Route `app/api/admin/agents/[id]/route.ts` (GET detalhe + PATCH atualizar)
- [ ] 7.5 Criar página de listagem `app/(admin)/config/agents/page.tsx` com tabela + botão "Novo Agente"
- [ ] 7.6 Criar página de criação `app/(admin)/config/agents/new/page.tsx` com formulário (nome + prompt)
- [ ] 7.7 Criar página de edição `app/(admin)/config/agents/[id]/edit/page.tsx` com formulário + botão "Evoluir agente" (link placeholder para `/config/agents/[id]/evolve`)
- [ ] 7.8 Implementar Switch/Toggle na listagem para habilitar/desabilitar
- [ ] 7.9 Testes unitários do schema Zod

## Detalhes de Implementação

Referir-se à seção **"Modelos de Dados"** da `techspec.md` para a tabela `agents` e **"Estrutura do App Router"** para as rotas.

A página de edição deve incluir um botão "Evoluir agente" que navega para `/config/agents/[id]/evolve`. Esta página será implementada na tarefa 18.0 — por agora, criar apenas a página placeholder.

```typescript
// Formulário de agente (reutilizável entre criar e editar)
interface AgentFormProps {
  defaultValues?: { name: string; prompt: string };
  onSubmit: (data: { name: string; prompt: string }) => Promise<void>;
  isEditing?: boolean;
}
```

Usar componentes Shadcn UI: `Table`, `Input`, `Textarea`, `Button`, `Label`, `Switch`, `Card`.

## Critérios de Sucesso

- Admin consegue criar um agente com nome e prompt
- Admin consegue editar nome e prompt de um agente existente
- Admin consegue habilitar/desabilitar agentes na listagem
- Botão "Evoluir agente" está visível na página de edição (link funcional)
- Validação impede nome vazio ou prompt vazio
- Navegação entre lista → criar → voltar e lista → editar → voltar funciona corretamente

## Arquivos relevantes

- `app/(admin)/config/agents/page.tsx`
- `app/(admin)/config/agents/new/page.tsx`
- `app/(admin)/config/agents/[id]/edit/page.tsx`
- `app/(admin)/config/agents/[id]/evolve/page.tsx` (placeholder)
- `app/api/admin/agents/route.ts`
- `app/api/admin/agents/[id]/route.ts`
- `lib/validations/agents.ts`
- `lib/types/admin.ts`
