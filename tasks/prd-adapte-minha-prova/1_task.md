# Tarefa 1.0: Setup do Projeto (Next.js 15, Supabase, Tailwind CSS, Shadcn UI)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Inicializar o projeto Next.js 15 com App Router, configurar Supabase (client e server), instalar e configurar Tailwind CSS, Shadcn UI, e todas as dependências base. Criar a estrutura de pastas conforme definida na techspec.

<requirements>
- Next.js 15 com App Router e TypeScript
- Tailwind CSS configurado com `theme.extend` e plugins (`@tailwindcss/forms`, `@tailwindcss/typography`)
- Shadcn UI inicializado com componentes base (Button, Input, Label, Card, Dialog, Table, Select, Textarea, Badge, Switch, Separator, Tooltip)
- Supabase client configurado para browser (`lib/supabase/client.ts`) e server (`lib/supabase/server.ts`)
- TanStack React Query provider configurado
- Zustand disponível como dependência
- Zod disponível como dependência
- Vercel AI SDK (`ai`, `@ai-sdk/openai`) instalado
- Estrutura de route groups criada: `(public)`, `(auth)`, `(admin)`
- Variáveis de ambiente documentadas em `.env.example`
- Prettier configurado com `prettier-plugin-tailwindcss`
</requirements>

## Subtarefas

- [ ] 1.1 Criar projeto Next.js 15 com `create-next-app` (TypeScript, App Router, Tailwind CSS, ESLint)
- [ ] 1.2 Instalar dependências: `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `zustand`, `zod`, `ai`, `@ai-sdk/openai`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- [ ] 1.3 Configurar Tailwind CSS (`tailwind.config.ts`) com `theme.extend` e plugins `@tailwindcss/forms` e `@tailwindcss/typography`
- [ ] 1.4 Inicializar Shadcn UI (`npx shadcn@latest init`) e adicionar componentes base
- [ ] 1.5 Criar `lib/supabase/client.ts` (browser client com `createBrowserClient`)
- [ ] 1.6 Criar `lib/supabase/server.ts` (server client com `createServerClient` usando cookies)
- [ ] 1.7 Criar provider de TanStack React Query em `app/providers.tsx` e aplicar no `app/layout.tsx`
- [ ] 1.8 Criar estrutura de route groups: `app/(public)/`, `app/(auth)/`, `app/(admin)/` com `page.tsx` placeholder em cada
- [ ] 1.9 Criar `lib/utils.ts` com helper `cn()` (clsx + tailwind-merge)
- [ ] 1.10 Criar `.env.example` com variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 1.11 Configurar Prettier com `prettier-plugin-tailwindcss`

## Detalhes de Implementação

Referir-se à seção **"Design de Implementação > Estrutura do App Router"** da `techspec.md` para a estrutura de pastas.

Para os clients Supabase, seguir o padrão SSR do `@supabase/ssr`:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}
```

## Critérios de Sucesso

- `npm run dev` inicia sem erros
- `npm run build` compila com sucesso
- Página placeholder renderiza em cada route group (`/`, `/dashboard`, `/config`)
- Supabase clients criados sem erro (validar com log de conexão)
- Shadcn UI Button renderiza corretamente em página de teste
- TanStack React Query provider funcional (verificar com React DevTools)

## Arquivos relevantes

- `package.json`
- `tailwind.config.ts`
- `app/layout.tsx`
- `app/providers.tsx`
- `app/(public)/page.tsx`
- `app/(auth)/page.tsx`
- `app/(admin)/page.tsx`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/utils.ts`
- `.env.example`
