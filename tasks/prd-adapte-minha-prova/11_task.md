# Tarefa 11.0: Professor — Formulário Nova Adaptação + Upload PDF

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar o formulário de nova adaptação onde o professor seleciona disciplina, ano/série, tema, apoios desejados e faz upload de um PDF. Ao enviar, o sistema cria o registro do exame, faz upload do PDF ao Supabase Storage e dispara a Edge Function de extração.

<requirements>
- Campo de seleção de Disciplina — obrigatório, apenas habilitadas (PRD F4.1)
- Campo de seleção de Ano/Série — obrigatório, apenas habilitadas (PRD F4.2)
- Campo de texto para Conhecimento/Tema — opcional (PRD F4.3)
- Seleção de um ou mais Apoios (checkboxes ou multi-select) — apenas habilitados (PRD F4.4)
- Upload de PDF com limite de 25 MB e validação de tipo (PRD F4.5)
- Botão "Enviar para adaptação" (PRD F4.6)
- Validação client-side e server-side com Zod
- Feedback visual durante upload (progress bar ou spinner)
- Após envio, redirecionar para `/exams/[id]/processing`
</requirements>

## Subtarefas

- [ ] 11.1 Criar schema Zod para validação do formulário (`lib/validations/exams.ts`)
- [ ] 11.2 Criar página `app/(auth)/exams/new/page.tsx` como Server Component que carrega disciplinas, anos/séries e apoios habilitados
- [ ] 11.3 Criar Client Component `NewExamForm` com o formulário completo
- [ ] 11.4 Implementar selects de Disciplina e Ano/Série (Shadcn Select) carregados via props do Server Component
- [ ] 11.5 Implementar multi-select ou checkboxes para Apoios
- [ ] 11.6 Implementar upload de PDF com validação de tipo (`.pdf`) e tamanho (≤ 25 MB)
- [ ] 11.7 Criar API Route `app/api/exams/route.ts` (POST): validar input, criar registro em `exams` + `exam_supports`, upload PDF ao Storage, invocar Edge Function `extract-questions`
- [ ] 11.8 Implementar feedback visual durante envio (loading state, progress)
- [ ] 11.9 Redirecionar para `/exams/[id]/processing` após sucesso
- [ ] 11.10 Testes unitários do schema Zod

## Detalhes de Implementação

Referir-se às seções **"Endpoints de API"**, **"Supabase Storage"** e **"Modelos de Dados"** da `techspec.md`.

Fluxo do POST `/api/exams`:

```typescript
// 1. Validar body com Zod
// 2. Obter sessão do usuário
// 3. Criar registro em exams (status: 'uploading')
// 4. Upload PDF ao Supabase Storage: bucket 'exams', path '{userId}/{examId}.pdf'
// 5. Atualizar exam com pdf_path
// 6. Criar registros em exam_supports
// 7. Atualizar status para 'extracting'
// 8. Invocar Edge Function: supabase.functions.invoke('extract-questions', { body: { examId } })
// 9. Retornar { id: examId }
```

Para o upload do PDF, usar `FormData` no client:

```typescript
const formData = new FormData();
formData.append("file", pdfFile);
formData.append("subjectId", subjectId);
formData.append("gradeLevelId", gradeLevelId);
formData.append("topic", topic);
formData.append("supportIds", JSON.stringify(selectedSupportIds));
```

Usar componentes Shadcn UI: `Select`, `Input`, `Textarea`, `Button`, `Label`, `Checkbox`, `Card`.

## Critérios de Sucesso

- Formulário carrega apenas disciplinas, anos/séries e apoios habilitados
- Validação impede envio sem disciplina, ano/série ou PDF
- Validação impede PDF > 25 MB e arquivos não-PDF
- Após envio: registro criado no banco, PDF no Storage, Edge Function invocada
- Redirect para página de processamento com o ID do exame

## Arquivos relevantes

- `app/(auth)/exams/new/page.tsx`
- `app/(auth)/exams/new/_components/NewExamForm.tsx`
- `app/api/exams/route.ts`
- `lib/validations/exams.ts`
- `lib/types/exam.ts`
