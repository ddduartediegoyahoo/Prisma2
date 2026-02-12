# Tarefa 8.0: Admin — CRUD Apoios

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a gestão de Apoios (necessidades educacionais) no painel administrativo. Cada apoio vincula um nome a um agente e a um modelo de IA. Os apoios habilitados ficam disponíveis para os professores selecionarem ao criar uma adaptação.

<requirements>
- Listar apoios com opção de habilitar/desabilitar (PRD F8.11)
- Criar apoio informando nome, selecionando agente e selecionando modelo (PRD F8.12)
- Selects de agente e modelo devem mostrar apenas os habilitados
- Validação de input com Zod
- Tabela com colunas: Nome, Agente vinculado, Modelo vinculado, Status, Ações
- API Routes para CRUD
</requirements>

## Subtarefas

- [ ] 8.1 Criar schema Zod para validação de Apoio (`lib/validations/supports.ts`)
- [ ] 8.2 Criar tipos TypeScript para Support (`lib/types/admin.ts` — complementar)
- [ ] 8.3 Criar API Route `app/api/admin/supports/route.ts` (GET lista com joins + POST criar)
- [ ] 8.4 Criar API Route `app/api/admin/supports/[id]/route.ts` (PATCH atualizar/habilitar/desabilitar)
- [ ] 8.5 Criar página `app/(admin)/config/supports/page.tsx` com tabela de apoios
- [ ] 8.6 Criar modal/dialog para criação de apoio (nome + select agente + select modelo)
- [ ] 8.7 No GET, fazer join com `agents` e `ai_models` para exibir nomes na tabela
- [ ] 8.8 Implementar Switch/Toggle para habilitar/desabilitar
- [ ] 8.9 Testes unitários do schema Zod

## Detalhes de Implementação

Referir-se à seção **"Modelos de Dados"** da `techspec.md` para a tabela `supports` com FKs para `agents` e `ai_models`.

A query de listagem deve incluir joins:

```typescript
const { data } = await supabase
  .from("supports")
  .select("*, agents(name), ai_models(name, model_id)")
  .order("name");
```

Os selects de Agente e Modelo no formulário de criação devem carregar apenas os habilitados:

```typescript
const { data: agents } = await supabase
  .from("agents")
  .select("id, name")
  .eq("enabled", true)
  .order("name");
```

Usar componentes Shadcn UI: `Table`, `Dialog`, `Select`, `Input`, `Button`, `Label`, `Switch`.

## Critérios de Sucesso

- Admin consegue criar apoio selecionando agente e modelo habilitados
- Tabela exibe nome do agente e modelo vinculados (não UUIDs)
- Admin consegue habilitar/desabilitar apoios
- Selects não exibem agentes/modelos desabilitados
- Validação impede nome vazio ou seleções faltantes

## Arquivos relevantes

- `app/(admin)/config/supports/page.tsx`
- `app/api/admin/supports/route.ts`
- `app/api/admin/supports/[id]/route.ts`
- `lib/validations/supports.ts`
- `lib/types/admin.ts`
