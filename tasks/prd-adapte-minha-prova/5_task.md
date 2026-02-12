# Tarefa 5.0: Admin — CRUD Disciplinas & Anos/Séries

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar as páginas de gestão de Disciplinas e Anos/Séries no painel administrativo. Inclui listagem, criação e toggle de habilitado/desabilitado para cada item.

<requirements>
- Página de Disciplinas: listar, criar e habilitar/desabilitar (PRD F8.13)
- Página de Anos/Séries: listar, criar e habilitar/desabilitar (PRD F8.14)
- Validação de input com Zod
- API Routes para CRUD de ambas entidades
- Feedback visual ao criar/atualizar (toast ou similar)
- Tabela com colunas: Nome, Status (habilitado/desabilitado), Ações
</requirements>

## Subtarefas

- [ ] 5.1 Criar schemas Zod para validação de Disciplina e Ano/Série (`lib/validations/subjects.ts`, `lib/validations/grade-levels.ts`)
- [ ] 5.2 Criar API Route `app/api/admin/subjects/route.ts` (GET lista + POST criar)
- [ ] 5.3 Criar API Route `app/api/admin/subjects/[id]/route.ts` (PATCH habilitar/desabilitar)
- [ ] 5.4 Criar API Route `app/api/admin/grade-levels/route.ts` (GET lista + POST criar)
- [ ] 5.5 Criar API Route `app/api/admin/grade-levels/[id]/route.ts` (PATCH habilitar/desabilitar)
- [ ] 5.6 Criar página `app/(admin)/config/subjects/page.tsx` com tabela + formulário de criação (modal ou inline)
- [ ] 5.7 Criar página `app/(admin)/config/grade-levels/page.tsx` com tabela + formulário de criação
- [ ] 5.8 Implementar Switch/Toggle para habilitar/desabilitar via PATCH
- [ ] 5.9 Testes unitários dos schemas Zod

## Detalhes de Implementação

Referir-se à seção **"Endpoints de API"** e **"Modelos de Dados"** da `techspec.md` para as tabelas `subjects` e `grade_levels`.

Padrão de API Route:

```typescript
// app/api/admin/subjects/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createSubjectSchema } from "@/lib/validations/subjects";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("subjects").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSubjectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  // ... insert
}
```

Usar componentes Shadcn UI: `Table`, `Switch`, `Dialog`, `Input`, `Button`, `Label`.

## Critérios de Sucesso

- Admin consegue criar disciplinas e anos/séries
- Admin consegue habilitar/desabilitar cada item via toggle
- Itens desabilitados aparecem visualmente distintos na lista
- Validação impede criação de nomes duplicados ou vazios
- API routes protegidas (apenas admin autenticado)

## Arquivos relevantes

- `app/(admin)/config/subjects/page.tsx`
- `app/(admin)/config/grade-levels/page.tsx`
- `app/api/admin/subjects/route.ts`
- `app/api/admin/subjects/[id]/route.ts`
- `app/api/admin/grade-levels/route.ts`
- `app/api/admin/grade-levels/[id]/route.ts`
- `lib/validations/subjects.ts`
- `lib/validations/grade-levels.ts`
