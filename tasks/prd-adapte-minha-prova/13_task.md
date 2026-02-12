# Tarefa 13.0: Professor — Revisão de Questões Extraídas + Respostas Corretas

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Implementar a página onde o professor revisa as questões extraídas do PDF e informa a(s) alternativa(s) correta(s) para cada questão. Ao confirmar, o sistema salva as respostas e dispara a Edge Function de análise e adaptação.

<requirements>
- Exibir cada questão extraída com seu conteúdo e alternativas (PRD F5.4)
- Para questões objetivas: permitir que o professor selecione a alternativa correta
- Para questões dissertativas: campo de texto para resposta esperada (opcional)
- Exibir avisos de extração parcial (extraction_warning) se houver
- Botão "Avançar" para confirmar e prosseguir (PRD F5.5)
- Ao avançar: salvar respostas corretas e disparar Edge Function `analyze-and-adapt`
- Redirecionar para `/exams/[id]/processing`
- Validação: ao menos uma questão deve ter resposta para avançar
</requirements>

## Subtarefas

- [ ] 13.1 Criar página `app/(auth)/exams/[id]/extraction/page.tsx` como Server Component que carrega questões do exame
- [ ] 13.2 Criar Client Component `ExtractionReview` com formulário de revisão das questões
- [ ] 13.3 Para cada questão objetiva: exibir alternativas com radio buttons para seleção da correta
- [ ] 13.4 Para cada questão dissertativa: exibir campo de texto para resposta esperada (opcional)
- [ ] 13.5 Exibir badge de warning se `extraction_warning` estiver preenchido
- [ ] 13.6 Criar API Route `app/api/exams/[id]/answers/route.ts` (POST): salvar respostas e disparar Edge Function
- [ ] 13.7 Implementar validação: verificar que o exame pertence ao professor e está em status `awaiting_answers`
- [ ] 13.8 Após salvar, atualizar status para `analyzing` e invocar `analyze-and-adapt`
- [ ] 13.9 Redirecionar para `/exams/[id]/processing`

## Detalhes de Implementação

Referir-se às seções **"Endpoints de API"** e **"Modelos de Dados"** da `techspec.md` para a tabela `questions`.

O Server Component carrega as questões:

```typescript
const supabase = await createClient();
const { data: exam } = await supabase
  .from("exams")
  .select("*, questions(*)")
  .eq("id", params.id)
  .single();

// Guard: se status não é 'awaiting_answers', redirecionar
if (exam.status !== "awaiting_answers") {
  redirect(`/exams/${params.id}/processing`);
}
```

Payload do POST `/api/exams/[id]/answers`:

```typescript
interface SaveAnswersPayload {
  answers: Array<{
    questionId: string;
    correctAnswer: string; // "A", "B", etc. para objetivas; texto livre para dissertativas
  }>;
}
```

Fluxo do POST:
1. Validar que exame pertence ao professor e status é `awaiting_answers`
2. Atualizar `correct_answer` em cada questão
3. Atualizar status do exame para `analyzing`
4. Invocar `supabase.functions.invoke('analyze-and-adapt', { body: { examId } })`
5. Retornar sucesso

Usar componentes Shadcn UI: `Card`, `RadioGroup`, `Input`, `Button`, `Badge`, `Label`.

## Critérios de Sucesso

- Questões extraídas são exibidas corretamente com conteúdo e alternativas
- Professor consegue selecionar alternativa correta para objetivas
- Professor consegue informar resposta para dissertativas
- Warnings de extração são exibidos de forma clara
- Ao avançar: respostas salvas, status atualizado, Edge Function invocada
- Redirect para página de processamento funciona
- Exame de outro professor não é acessível (guard server-side)

## Arquivos relevantes

- `app/(auth)/exams/[id]/extraction/page.tsx`
- `app/(auth)/exams/[id]/extraction/_components/ExtractionReview.tsx`
- `app/api/exams/[id]/answers/route.ts`
