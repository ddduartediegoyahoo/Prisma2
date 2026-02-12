# Tarefa 3.0: Autenticação & Autorização (Google OAuth, Middleware, Roles)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o fluxo completo de autenticação via Google OAuth usando Supabase Auth, criar o middleware Next.js para proteger rotas, implementar guards de role (teacher/admin) e tratamento de usuários bloqueados.

<requirements>
- Login via Google OAuth funcional (redirect → callback → sessão)
- Middleware protege rotas `(auth)` e `(admin)` — redireciona para login se não autenticado
- Rotas `(admin)` verificam `profile.role === 'admin'` — redireciona para dashboard se não admin
- Usuários com `blocked = true` são redirecionados para página de acesso negado
- Botão de logout funcional
- Página de acesso negado (`/blocked`) para usuários bloqueados
- Tipos TypeScript para User/Profile
</requirements>

## Subtarefas

- [ ] 3.1 Configurar Google OAuth provider no projeto Supabase (documentar passos no README ou `.env.example`)
- [ ] 3.2 Criar rota de login (`app/(public)/login/page.tsx`) com botão "Entrar com Google" que chama `supabase.auth.signInWithOAuth({ provider: 'google' })`
- [ ] 3.3 Criar callback route (`app/(public)/login/callback/route.ts`) que troca code por sessão via `supabase.auth.exchangeCodeForSession()`
- [ ] 3.4 Criar `middleware.ts` na raiz do projeto: validar sessão para rotas `(auth)` e `(admin)`, verificar role admin, verificar bloqueio
- [ ] 3.5 Criar helper `lib/auth/get-profile.ts` que retorna o profile do usuário autenticado (server-side)
- [ ] 3.6 Criar página de acesso negado (`app/(public)/blocked/page.tsx`)
- [ ] 3.7 Criar tipos TypeScript em `lib/types/auth.ts` (Profile, UserRole)
- [ ] 3.8 Implementar logout via Server Action ou API route
- [ ] 3.9 Testar fluxo completo: login → redirect por role → logout → blocked user

## Detalhes de Implementação

Referir-se à seção **"Pontos de Integração > Supabase Auth"** da `techspec.md`.

O middleware deve:
1. Verificar se há sessão ativa (JWT válido)
2. Para rotas `(admin)`: consultar `profiles.role` e redirecionar se não for admin
3. Para rotas `(auth)` e `(admin)`: verificar `profiles.blocked` e redirecionar para `/blocked`
4. Rotas `(public)` não são protegidas

```typescript
// middleware.ts — estrutura esperada
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Criar Supabase client com cookies do request
  // 2. Obter sessão
  // 3. Se rota protegida e sem sessão → redirect /login
  // 4. Se rota admin e role !== 'admin' → redirect /dashboard
  // 5. Se blocked === true → redirect /blocked
}

export const config = {
  matcher: ["/dashboard/:path*", "/exams/:path*", "/config/:path*", "/users/:path*"],
};
```

## Critérios de Sucesso

- Login com Google redireciona corretamente e cria sessão
- Profile é criado automaticamente no banco (trigger da tarefa 2.0)
- Usuário teacher é redirecionado para `/dashboard` após login
- Usuário admin consegue acessar `/config`
- Usuário teacher recebe redirect ao tentar acessar `/config`
- Usuário bloqueado é redirecionado para `/blocked`
- Logout limpa sessão e redireciona para `/`

## Arquivos relevantes

- `middleware.ts`
- `app/(public)/login/page.tsx`
- `app/(public)/login/callback/route.ts`
- `app/(public)/blocked/page.tsx`
- `lib/auth/get-profile.ts`
- `lib/types/auth.ts`
