# Especificação Técnica — Adapte Minha Prova

## Resumo Executivo

O **Adapte Minha Prova** será construído como uma aplicação **Next.js 15 (App Router)** deployada na **Vercel**, com **Supabase** como backend (Auth, Postgres, Storage e Edge Functions). A extração de questões do PDF utiliza uma **LLM multimodal** (páginas convertidas em imagens), e toda comunicação com LLMs é mediada pelo **Vercel AI SDK** com providers OpenAI-compatible. O processamento de adaptação é **assíncrono** via **Supabase Edge Functions** com status persistido no banco e polling no client via **TanStack React Query**. A UI utiliza **Shadcn UI + Tailwind CSS**.

---

## Arquitetura do Sistema

### Visão Geral dos Componentes

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL                            │
│  ┌───────────────────────────────────────────────┐  │
│  │           Next.js 15 (App Router)             │  │
│  │  ┌─────────────┐  ┌────────────────────────┐  │  │
│  │  │  RSC Pages  │  │  API Routes            │  │  │
│  │  │  (Teacher)  │  │  /api/exams            │  │  │
│  │  │  (Admin)    │  │  /api/admin/*          │  │  │
│  │  │  (Public)   │  │  /api/feedback         │  │  │
│  │  └─────────────┘  └────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Supabase   │ │   Supabase   │ │   Supabase   │
│     Auth     │ │   Postgres   │ │   Storage    │
│ (Google OAuth)│ │  (all data)  │ │   (PDFs)     │
└──────────────┘ └──────┬───────┘ └──────────────┘
                        │
                        ▼
               ┌────────────────┐
               │ Supabase Edge  │
               │   Functions    │──────► LLMs externas
               │ (async jobs)   │        (via Vercel AI SDK)
               └────────────────┘
```

**Componentes principais:**

| Componente | Responsabilidade |
|---|---|
| **Next.js App (Vercel)** | UI (RSC + Client Components), API Routes para mutations, middleware de auth/role |
| **Supabase Auth** | Autenticação Google OAuth, sessões, JWT |
| **Supabase Postgres** | Persistência de todas as entidades (users, exams, questions, adaptations, feedback, config) |
| **Supabase Storage** | Armazenamento dos PDFs enviados (bucket `exams`) |
| **Supabase Edge Functions** | Jobs assíncronos: extração de questões, análise BNCC/Bloom, geração de adaptações, evolução de agentes |
| **Vercel AI SDK** | Interface unificada para chamadas a LLMs configuradas pelo admin (OpenAI-compatible providers) |

---

## Design de Implementação

### Estrutura do App Router

```
app/
├── (public)/
│   ├── page.tsx                          # Landing page (hero + CTA)
│   └── login/callback/route.ts           # OAuth callback
├── (auth)/
│   ├── layout.tsx                        # Auth guard + sidebar professor
│   ├── dashboard/page.tsx                # Repositório de provas
│   └── exams/
│       ├── new/page.tsx                  # Formulário nova adaptação
│       └── [id]/
│           ├── extraction/page.tsx       # Revisão das questões extraídas
│           ├── processing/page.tsx       # Status do processamento (polling)
│           └── result/page.tsx           # Resultado final
├── (admin)/
│   ├── layout.tsx                        # Admin guard + sidebar admin
│   ├── config/
│   │   ├── page.tsx                      # Visão geral de configurações
│   │   ├── models/page.tsx               # CRUD modelos
│   │   ├── agents/
│   │   │   ├── page.tsx                  # Lista de agentes
│   │   │   ├── new/page.tsx              # Criar agente
│   │   │   └── [id]/
│   │   │       ├── edit/page.tsx         # Editar agente
│   │   │       └── evolve/page.tsx       # Evoluir agente
│   │   ├── supports/page.tsx             # CRUD apoios
│   │   ├── subjects/page.tsx             # CRUD disciplinas
│   │   └── grade-levels/page.tsx         # CRUD anos/séries
│   └── users/page.tsx                    # Gestão de usuários
├── api/
│   ├── exams/
│   │   ├── route.ts                      # POST criar exame + trigger extraction
│   │   └── [id]/
│   │       ├── answers/route.ts          # POST salvar respostas corretas + trigger adaptation
│   │       ├── status/route.ts           # GET polling de status
│   │       └── feedback/route.ts         # POST salvar avaliação/comentário
│   └── admin/
│       ├── models/route.ts               # CRUD modelos
│       ├── agents/
│       │   ├── route.ts                  # CRUD agentes
│       │   └── [id]/evolve/route.ts      # POST trigger evolução
│       ├── supports/route.ts             # CRUD apoios
│       ├── subjects/route.ts             # CRUD disciplinas
│       ├── grade-levels/route.ts         # CRUD anos/séries
│       └── users/route.ts               # GET lista + PATCH bloquear
└── middleware.ts                          # Auth check + role routing
```

### Interfaces Principais

```typescript
// lib/types/exam.ts
interface Exam {
  id: string;
  userId: string;
  subjectId: string;
  gradeLevelId: string;
  topic: string | null;
  pdfPath: string;
  status: ExamStatus;
  createdAt: string;
  updatedAt: string;
}

type ExamStatus =
  | "uploading"
  | "extracting"
  | "awaiting_answers"
  | "analyzing"
  | "completed"
  | "error";
```

```typescript
// lib/types/adaptation.ts
interface Adaptation {
  id: string;
  questionId: string;
  supportId: string;
  adaptedContent: string;
  bnccSkills: string[];
  bloomLevel: string;
  bnccAnalysis: string;
  bloomAnalysis: string;
  status: "pending" | "processing" | "completed" | "error";
}
```

```typescript
// lib/types/admin.ts
interface AiModel {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;       // encrypted at rest
  modelId: string;      // ex: "gpt-4o", "claude-sonnet-4-20250514"
  enabled: boolean;
}

interface Agent {
  id: string;
  name: string;
  prompt: string;
  enabled: boolean;
}

interface Support {
  id: string;
  name: string;
  agentId: string;
  modelId: string;
  enabled: boolean;
}
```

### Modelos de Dados (Supabase Postgres)

```sql
-- Extensão do auth.users via tabela profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Modelos de IA
create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null,
  api_key text not null,          -- criptografada via Vault ou column encryption
  model_id text not null,         -- identificador do modelo (ex: "gpt-4o")
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Agentes (prompts)
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prompt text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Apoios (necessidades educacionais)
create table public.supports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agent_id uuid not null references public.agents(id),
  model_id uuid not null references public.ai_models(id),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Disciplinas
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default true
);

-- Anos/Séries
create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  enabled boolean not null default true
);

-- Provas
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  subject_id uuid not null references public.subjects(id),
  grade_level_id uuid not null references public.grade_levels(id),
  topic text,
  pdf_path text not null,
  status text not null default 'uploading'
    check (status in ('uploading','extracting','awaiting_answers','analyzing','completed','error')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Relação prova ↔ apoios selecionados
create table public.exam_supports (
  exam_id uuid not null references public.exams(id) on delete cascade,
  support_id uuid not null references public.supports(id),
  primary key (exam_id, support_id)
);

-- Questões extraídas
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  order_num integer not null,
  content text not null,
  question_type text not null check (question_type in ('objective', 'essay')),
  alternatives jsonb,             -- [{label: "A", text: "..."}, ...]
  correct_answer text,            -- preenchido pelo professor
  visual_elements jsonb,          -- [{type: "image", url: "..."}, ...]
  extraction_warning text,        -- aviso se OCR parcial
  created_at timestamptz not null default now()
);

-- Adaptações geradas
create table public.adaptations (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  support_id uuid not null references public.supports(id),
  adapted_content text,
  bncc_skills jsonb,              -- ["EF06MA01", "EF06MA02"]
  bloom_level text,
  bncc_analysis text,
  bloom_analysis text,
  status text not null default 'pending'
    check (status in ('pending','processing','completed','error')),
  created_at timestamptz not null default now()
);

-- Feedback do professor
create table public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  adaptation_id uuid not null references public.adaptations(id) on delete cascade,
  rating integer not null check (rating between 0 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- Histórico de evolução de agentes
create table public.agent_evolutions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id),
  original_prompt text not null,
  suggested_prompt text not null,
  llm_commentary text,
  feedback_ids uuid[] not null,   -- IDs dos feedbacks utilizados
  accepted boolean,
  created_at timestamptz not null default now()
);
```

### Endpoints de API

| Método | Caminho | Descrição |
|---|---|---|
| `POST` | `/api/exams` | Cria exame, faz upload do PDF ao Storage, dispara Edge Function de extração |
| `GET` | `/api/exams/[id]/status` | Retorna status atual do exame (usado para polling) |
| `POST` | `/api/exams/[id]/answers` | Salva respostas corretas, dispara Edge Function de análise/adaptação |
| `POST` | `/api/exams/[id]/feedback` | Salva avaliação + comentário por adaptação |
| `GET` | `/api/admin/models` | Lista modelos |
| `POST` | `/api/admin/models` | Cria modelo |
| `PATCH` | `/api/admin/models/[id]` | Atualiza/habilita/desabilita modelo |
| `GET` | `/api/admin/agents` | Lista agentes |
| `POST` | `/api/admin/agents` | Cria agente |
| `PATCH` | `/api/admin/agents/[id]` | Atualiza agente |
| `POST` | `/api/admin/agents/[id]/evolve` | Recebe feedback_ids, dispara Edge Function de evolução |
| `GET` | `/api/admin/agents/[id]/feedbacks` | Lista feedbacks vinculados ao agente |
| `GET/POST/PATCH` | `/api/admin/supports` | CRUD apoios |
| `GET/POST/PATCH` | `/api/admin/subjects` | CRUD disciplinas |
| `GET/POST/PATCH` | `/api/admin/grade-levels` | CRUD anos/séries |
| `GET` | `/api/admin/users` | Lista usuários |
| `PATCH` | `/api/admin/users/[id]` | Bloquear/desbloquear usuário |

---

## Pontos de Integração

### Supabase Auth (Google OAuth)

- Configurar Google OAuth provider no dashboard do Supabase.
- Callback URL: `/login/callback/route.ts` usando `supabase.auth.exchangeCodeForSession()`.
- Middleware (`middleware.ts`) valida JWT em todas as rotas `(auth)` e `(admin)`.
- Rotas `(admin)` verificam adicionalmente `profile.role === 'admin'`.
- Usuários com `blocked = true` recebem redirect para página de acesso negado.

### Supabase Storage

- Bucket `exams` com política RLS: professor só acessa seus próprios PDFs.
- Upload via `supabase.storage.from('exams').upload()` com path `{userId}/{examId}.pdf`.
- Limite de 25 MB configurado no bucket.

### LLMs via Vercel AI SDK

- O Vercel AI SDK abstrai diferenças entre providers via interface unificada.
- Para cada modelo cadastrado pelo admin, instanciar um provider `createOpenAI({ baseURL, apiKey })` em runtime.
- A `model_id` (ex.: `gpt-4o`) é passada ao SDK na chamada `generateText()` ou `generateObject()`.
- Tratamento de erros: retry com backoff exponencial (3 tentativas), fallback para status `error` na adaptação.

```typescript
// lib/ai/create-provider.ts
import { createOpenAI } from "@ai-sdk/openai";

export function createProviderFromModel(model: AiModel) {
  return createOpenAI({
    baseURL: model.baseUrl,
    apiKey: model.apiKey,
  });
}
```

### Supabase Edge Functions

Três Edge Functions Deno:

| Função | Trigger | Responsabilidade |
|---|---|---|
| `extract-questions` | Chamada via `supabase.functions.invoke()` após upload | Converte PDF em imagens (pdf-to-image), envia a LLM multimodal, persiste questões extraídas, atualiza status para `awaiting_answers` |
| `analyze-and-adapt` | Chamada após professor confirmar respostas | Para cada questão: identifica BNCC + Bloom; para cada questão × apoio: gera adaptação usando prompt do agente. Atualiza status para `completed` |
| `evolve-agent` | Chamada pelo admin | Recebe prompt atual + feedbacks selecionados, solicita sugestão de novo prompt à LLM, persiste em `agent_evolutions` |

---

## Abordagem de Testes

### Testes Unitários

- **Componentes UI:** Jest + React Testing Library para componentes interativos (formulários, star rating, copy button).
- **Validação Zod:** Testes dos schemas de validação de input (criação de exame, feedback, modelos).
- **Utilitários:** Funções de formatação, parsing de respostas da LLM, transformação de dados.
- **Mock:** Supabase client mockado via `@supabase/supabase-js` mock; Vercel AI SDK mockado para respostas de LLM.

### Testes de Integração

- **Fluxo completo do professor:** Upload → Extração → Respostas → Adaptação → Resultado → Feedback.
- **Fluxo admin:** CRUD de modelos/agentes/apoios, evolução de agente.
- **Auth & Roles:** Verificar que professor não acessa rotas admin e vice-versa; usuário bloqueado é barrado.
- **Edge Functions:** Testar com Supabase CLI local (`supabase functions serve`).

---

## Sequenciamento de Desenvolvimento

### Ordem de Construção

| Fase | Escopo | Justificativa |
|---|---|---|
| **1. Fundação** | Setup Next.js 15, Supabase project, Auth (Google OAuth), middleware, profiles, layout com sidebar | Infraestrutura base necessária para tudo |
| **2. Admin — Configurações** | CRUD modelos, agentes, apoios, disciplinas, anos/séries | Dados de configuração são pré-requisito para o fluxo do professor |
| **3. Admin — Usuários** | Lista + bloqueio de usuários | Simples, depende apenas da fundação |
| **4. Professor — Nova Adaptação** | Formulário, upload PDF, Storage | Fluxo de entrada de dados |
| **5. Edge Function — Extração** | `extract-questions`: PDF → imagens → LLM multimodal → questões | Core do produto |
| **6. Professor — Extração & Respostas** | Tela de revisão de questões + input de respostas corretas | Depende da extração funcionar |
| **7. Edge Function — Análise/Adaptação** | `analyze-and-adapt`: BNCC + Bloom + adaptação por apoio | Core do produto |
| **8. Professor — Processamento & Resultado** | Tela de polling + tela de resultado com copy/BNCC/Bloom | Depende da adaptação funcionar |
| **9. Professor — Feedback** | Avaliação (estrelas) + comentário por questão adaptada | Depende do resultado |
| **10. Repositório** | Dashboard com lista de provas + acesso a resultados anteriores | Depende das fases 4–9 |
| **11. Evolução de Agentes** | Edge Function `evolve-agent` + UI de seleção de feedbacks + comparador | Depende do feedback acumulado |
| **12. Landing Page** | Hero + CTA | Independente, pode ser paralela |

### Dependências Técnicas

- **Supabase project** criado com Auth, Database, Storage e Edge Functions habilitados.
- **Google Cloud Console**: OAuth client ID configurado para Supabase Auth.
- **Vercel project** conectado ao repositório Git.
- **Vercel AI SDK** + pelo menos um provider (`@ai-sdk/openai`) instalado.
- **Ao menos um modelo de IA** cadastrado pelo admin antes de testar o fluxo professor.

---

## Monitoramento e Observabilidade

- **Vercel Analytics:** Métricas de performance (Web Vitals), uso de API routes.
- **Supabase Dashboard:** Monitoramento de queries Postgres, uso de Storage, logs de Edge Functions.
- **Logs estruturados:** Cada Edge Function loga início/fim de processamento, exam_id, duração, erros.
- **Status do exame no banco:** Campo `error_message` em `exams` para diagnóstico de falhas.
- **Métricas de negócio (queries SQL):**
  - Provas por dia/semana/mês.
  - Média de rating por agente/apoio.
  - % de adaptações copiadas.
  - Tempo médio de processamento por exame.

---

## Considerações Técnicas

### Decisões Principais

| Decisão | Justificativa | Alternativa rejeitada |
|---|---|---|
| **Supabase Edge Functions** para async | Integração nativa com Supabase DB/Storage, sem infra adicional | Inngest/Trigger.dev (mais complexo para MVP) |
| **LLM multimodal para OCR** | Qualidade superior na extração contextual vs OCR tradicional; suporta tabelas/gráficos | Tesseract.js (menor qualidade), Google Document AI (vendor lock-in adicional) |
| **Vercel AI SDK** | Interface unificada, streaming, type-safe, suporte a múltiplos providers sem código custom | Chamadas HTTP diretas (mais boilerplate, menos type-safety) |
| **OpenAI-compatible providers** | Vercel AI SDK `createOpenAI` aceita qualquer `baseURL` OpenAI-compatible, cobrindo a maioria dos providers do mercado | Implementar adapter por provider (over-engineering no MVP) |
| **Database polling** (TanStack Query `refetchInterval`) | Simples, confiável, sem WebSocket infra | Supabase Realtime (adiciona complexidade desnecessária para MVP) |
| **Shadcn UI** | Componentes acessíveis, customizáveis, sem vendor lock-in, compatível com Tailwind | Material UI (bundle maior, estilo opinado) |

### Riscos Conhecidos

| Risco | Impacto | Mitigação |
|---|---|---|
| **Timeout de Edge Functions** (máx. ~150s no plano free Supabase) | Provas com muitas questões podem exceder o limite | Processar questões em batches; dividir em múltiplas invocações se necessário |
| **Custo de LLM para PDFs grandes** | Cada página vira imagem para LLM multimodal | Limitar a 25 MB; monitorar tokens consumidos |
| **Qualidade da extração** | LLM pode falhar em layouts complexos | Permitir que professor reporte erro; OCR parcial não bloqueia fluxo |
| **API Key em plain text** | Risco de exposição | Usar Supabase Vault ou column-level encryption; RLS impede acesso por non-admin |
| **Latência de polling** | Professor pode perceber delay entre conclusão e atualização na UI | `refetchInterval` de 3–5 segundos; feedback visual de "verificando..." |

### Conformidade com Padrões

As seguintes rules do projeto se aplicam a esta tech spec:

- **`nextapprouterpatterns.mdc`** — Estrutura de diretórios `app/`, uso de Server Components por padrão, Client Components apenas quando necessário (`'use client'`), Server Actions para mutations, fetch caching com revalidação.
- **`reactcomponentstandards.mdc`** — PascalCase para componentes, interfaces TypeScript para props, named exports, hooks no topo, Tailwind via `className`.
- **`tailwindcssguidelines.mdc`** — Utility-first, tema customizado via `theme.extend`, uso de `cva` para variantes de componentes, `@tailwindcss/forms` para formulários.

### Arquivos Relevantes

| Arquivo/Diretório | Descrição |
|---|---|
| `tasks/prd-adapte-minha-prova/prd.md` | PRD de referência |
| `app/(public)/page.tsx` | Landing page |
| `app/(auth)/layout.tsx` | Layout autenticado (professor) |
| `app/(admin)/layout.tsx` | Layout administrativo |
| `app/middleware.ts` | Guard de autenticação e roles |
| `lib/supabase/client.ts` | Client Supabase (browser) |
| `lib/supabase/server.ts` | Client Supabase (server) |
| `lib/ai/create-provider.ts` | Factory de provider Vercel AI SDK |
| `supabase/functions/extract-questions/` | Edge Function de extração |
| `supabase/functions/analyze-and-adapt/` | Edge Function de análise/adaptação |
| `supabase/functions/evolve-agent/` | Edge Function de evolução de agente |
| `supabase/migrations/` | Migrações SQL do schema |
