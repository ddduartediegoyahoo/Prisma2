# Tarefa 10.0: Professor — Layout, Dashboard & Repositório de Provas

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Criar o layout autenticado do professor com sidebar/header, a página de boas-vindas (dashboard) e o repositório de provas adaptadas. O professor visualiza suas provas anteriores e pode acessar o resultado de cada uma ou iniciar uma nova adaptação.

<requirements>
- Layout `app/(auth)/layout.tsx` com header e navegação do professor
- Dashboard com mensagem de boas-vindas e lista de provas (PRD F3.1)
- Cada item exibe: disciplina, ano/série, tema, data, status (em andamento/concluído/erro)
- Item clicável para acessar resultado (somente leitura) ou retomar fluxo (PRD F3.2)
- Botão "Nova Adaptação" visível e destacado (PRD F3.3)
- Lista paginada ou com scroll infinito se houver muitas provas
- Indicador visual de status: ícone/badge colorido por status do exame
</requirements>

## Subtarefas

- [ ] 10.1 Criar `app/(auth)/layout.tsx` com Server Component que busca profile do professor
- [ ] 10.2 Criar componente `TeacherHeader` (`app/(auth)/_components/TeacherHeader.tsx`) com nome, avatar, logout
- [ ] 10.3 Criar `app/(auth)/dashboard/page.tsx` como Server Component que busca exames do professor
- [ ] 10.4 Criar componente `ExamList` para renderizar lista de provas com status visual
- [ ] 10.5 Criar componente `ExamCard` ou row para cada prova (disciplina, ano, tema, data, status, link)
- [ ] 10.6 Implementar lógica de link por status: `completed` → `/exams/[id]/result`, `awaiting_answers` → `/exams/[id]/extraction`, `extracting`/`analyzing` → `/exams/[id]/processing`
- [ ] 10.7 Criar botão "Nova Adaptação" que navega para `/exams/new`
- [ ] 10.8 Tratar estado vazio (nenhuma prova ainda) com mensagem e CTA

## Detalhes de Implementação

Referir-se à seção **"Estrutura do App Router"** da `techspec.md` para as rotas `(auth)`.

Query para listar provas do professor:

```typescript
const supabase = await createClient();
const { data: exams } = await supabase
  .from("exams")
  .select("*, subjects(name), grade_levels(name)")
  .eq("user_id", profile.id)
  .order("created_at", { ascending: false });
```

Mapeamento de status para exibição:

| Status DB | Badge | Ação ao clicar |
|---|---|---|
| `uploading` / `extracting` | 🟡 Processando | → `/exams/[id]/processing` |
| `awaiting_answers` | 🟠 Aguardando respostas | → `/exams/[id]/extraction` |
| `analyzing` | 🟡 Adaptando | → `/exams/[id]/processing` |
| `completed` | 🟢 Concluído | → `/exams/[id]/result` |
| `error` | 🔴 Erro | → `/exams/[id]/processing` (com msg de erro) |

Usar componentes Shadcn UI: `Card`, `Badge`, `Button`, `Separator`.

## Critérios de Sucesso

- Professor logado vê suas provas na dashboard
- Status visual correto para cada estado do exame
- Clique em uma prova navega para a página correta por status
- Botão "Nova Adaptação" está visível e funcional
- Estado vazio mostra mensagem adequada
- Layout é consistente e desktop-first

## Arquivos relevantes

- `app/(auth)/layout.tsx`
- `app/(auth)/_components/TeacherHeader.tsx`
- `app/(auth)/dashboard/page.tsx`
- `app/(auth)/_components/ExamList.tsx`
- `app/(auth)/_components/ExamCard.tsx`
