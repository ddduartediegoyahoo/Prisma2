# Tarefa 9.0: Admin — Gestão de Usuários

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a página de gestão de usuários no painel administrativo. O admin pode visualizar todos os usuários registrados no sistema e bloquear/desbloquear o acesso de cada um.

<requirements>
- Listar todos os usuários registrados (PRD F9.1)
- Opção para bloquear/desbloquear o acesso de um usuário (PRD F9.2)
- Tabela com colunas: Avatar, Nome, E-mail, Role, Status (ativo/bloqueado), Ações
- Confirmação antes de bloquear um usuário (ação destrutiva)
- Admin não pode se auto-bloquear
- API Route para listar e atualizar status
</requirements>

## Subtarefas

- [ ] 9.1 Criar API Route `app/api/admin/users/route.ts` (GET lista de profiles com dados de auth.users)
- [ ] 9.2 Criar API Route `app/api/admin/users/[id]/route.ts` (PATCH bloquear/desbloquear)
- [ ] 9.3 Criar página `app/(admin)/users/page.tsx` com tabela de usuários
- [ ] 9.4 Implementar toggle de bloqueio com confirmação via Dialog
- [ ] 9.5 Impedir que admin se auto-bloqueie (validação frontend + backend)
- [ ] 9.6 Exibir avatar do Google e e-mail na tabela

## Detalhes de Implementação

Referir-se à seção **"Modelos de Dados"** da `techspec.md` para a tabela `profiles`.

Para listar usuários com e-mail (que está em `auth.users`), a query no server pode usar o Supabase Admin client (service role) ou uma view que junta `profiles` com `auth.users`. Alternativa: armazenar o e-mail no profile durante o trigger de criação.

```sql
-- Alternativa: adicionar email ao profile no trigger handle_new_user
-- new.email pode ser extraído de auth.users
```

Dialog de confirmação para bloqueio:

```typescript
// "Tem certeza que deseja bloquear o acesso de {nome}?"
// Botão "Bloquear" (variante destructive) + "Cancelar"
```

Usar componentes Shadcn UI: `Table`, `Badge`, `Button`, `Dialog`, `Avatar`.

## Critérios de Sucesso

- Admin visualiza lista completa de usuários com avatar, nome, e-mail, role e status
- Admin consegue bloquear um usuário com confirmação
- Admin consegue desbloquear um usuário previamente bloqueado
- Admin não consegue se auto-bloquear
- Usuário bloqueado é efetivamente barrado pelo middleware (verificar com teste manual)

## Arquivos relevantes

- `app/(admin)/users/page.tsx`
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/route.ts`
