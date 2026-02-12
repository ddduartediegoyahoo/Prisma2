# Tarefa 6.0: Admin — CRUD Modelos de IA

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a página de gestão de Modelos de IA no painel administrativo. O admin cadastra modelos LLM informando nome, URL base, API Key e Model ID. Cada modelo pode ser habilitado ou desabilitado.

<requirements>
- Listar modelos cadastrados com opção de habilitar/desabilitar (PRD F8.1)
- Criar modelo informando nome, URL da API, API Key e Model ID (PRD F8.2)
- Validação de input com Zod (URL válida, campos obrigatórios)
- API Key exibida de forma mascarada na listagem (ex: `sk-...xxxx`)
- API Routes para CRUD
- Tabela com colunas: Nome, Model ID, URL Base, Status, Ações
</requirements>

## Subtarefas

- [ ] 6.1 Criar schema Zod para validação de Modelo (`lib/validations/models.ts`)
- [ ] 6.2 Criar tipos TypeScript para AiModel (`lib/types/admin.ts` — pode já existir, complementar)
- [ ] 6.3 Criar API Route `app/api/admin/models/route.ts` (GET lista + POST criar)
- [ ] 6.4 Criar API Route `app/api/admin/models/[id]/route.ts` (PATCH atualizar/habilitar/desabilitar)
- [ ] 6.5 Criar página `app/(admin)/config/models/page.tsx` com tabela de modelos
- [ ] 6.6 Criar modal/dialog para criação de modelo (campos: nome, base URL, API Key, model ID)
- [ ] 6.7 Implementar mascaramento da API Key na exibição
- [ ] 6.8 Implementar Switch/Toggle para habilitar/desabilitar
- [ ] 6.9 Testes unitários do schema Zod

## Detalhes de Implementação

Referir-se à seção **"Modelos de Dados"** da `techspec.md` para a tabela `ai_models` e à seção **"Endpoints de API"** para os endpoints.

A API Key deve ser armazenada no banco. No MVP, usar a coluna `api_key` diretamente. Em produção futura, considerar Supabase Vault.

Na listagem, mascarar a API Key:

```typescript
function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 3)}...${key.slice(-4)}`;
}
```

Usar componentes Shadcn UI: `Table`, `Dialog`, `Input`, `Button`, `Label`, `Switch`.

## Critérios de Sucesso

- Admin consegue criar um modelo com todos os campos
- API Key é mascarada na listagem
- Admin consegue habilitar/desabilitar um modelo
- Validação impede campos obrigatórios vazios e URLs inválidas
- API routes protegidas (apenas admin)

## Arquivos relevantes

- `app/(admin)/config/models/page.tsx`
- `app/api/admin/models/route.ts`
- `app/api/admin/models/[id]/route.ts`
- `lib/validations/models.ts`
- `lib/types/admin.ts`
