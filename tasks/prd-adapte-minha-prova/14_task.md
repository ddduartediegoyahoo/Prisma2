# Tarefa 14.0: Edge Function — Análise BNCC/Bloom & Geração de Adaptações

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Criar a Supabase Edge Function `analyze-and-adapt` que recebe um `examId`, carrega as questões e apoios selecionados, e para cada questão: identifica habilidades BNCC e nível Bloom, e gera uma versão adaptada para cada apoio usando o agente/modelo vinculado.

<requirements>
- Edge Function Deno em `supabase/functions/analyze-and-adapt/`
- Para cada questão: identificar habilidade(s) BNCC via LLM (PRD F6.1)
- Para cada questão: identificar nível cognitivo Bloom via LLM (PRD F6.2)
- Para cada questão × apoio: gerar versão adaptada mantendo BNCC (PRD F6.3, F6.5)
- Usar o agente (prompt) e modelo (LLM) vinculados ao apoio
- Contexto: disciplina, ano/série, tema, resposta correta do professor
- Persistir resultados na tabela `adaptations`
- Atualizar status do exame para `completed` ao concluir
- Atualizar status para `error` com mensagem em caso de falha
- Processar em batches para respeitar timeout de Edge Functions
</requirements>

## Subtarefas

- [ ] 14.1 Criar estrutura da Edge Function (`supabase/functions/analyze-and-adapt/index.ts`)
- [ ] 14.2 Carregar exame com questões, apoios selecionados (com agente e modelo vinculados), disciplina e ano/série
- [ ] 14.3 Implementar análise BNCC: para cada questão, chamar LLM com prompt de identificação de habilidades BNCC
- [ ] 14.4 Implementar análise Bloom: para cada questão, chamar LLM com prompt de identificação de nível cognitivo
- [ ] 14.5 Implementar geração de adaptação: para cada questão × apoio, chamar LLM usando o prompt do agente vinculado ao apoio
- [ ] 14.6 Definir schemas Zod para respostas estruturadas da LLM (BNCC, Bloom, adaptação)
- [ ] 14.7 Persistir resultados em `adaptations` (adapted_content, bncc_skills, bloom_level, bncc_analysis, bloom_analysis)
- [ ] 14.8 Atualizar status de cada adaptação (`pending` → `processing` → `completed`/`error`)
- [ ] 14.9 Atualizar status do exame para `completed` quando todas as adaptações estiverem prontas
- [ ] 14.10 Implementar tratamento de erro por questão (uma falha não bloqueia as demais)
- [ ] 14.11 Implementar logging estruturado (exam_id, duração, questões processadas, erros)
- [ ] 14.12 Testar com Supabase CLI local

## Detalhes de Implementação

Referir-se às seções **"Supabase Edge Functions"** e **"LLMs via Vercel AI SDK"** da `techspec.md`.

Fluxo principal:

```
1. Carregar exam + questions + exam_supports (com agents e ai_models)
2. Criar registros de adaptations com status 'pending' para cada questão × apoio
3. Para cada questão:
   a. Análise BNCC → salvar bncc_skills + bncc_analysis
   b. Análise Bloom → salvar bloom_level + bloom_analysis
   c. Para cada apoio:
      - Buscar agent.prompt e ai_model config
      - Gerar adaptação com prompt contextualizado
      - Salvar adapted_content
      - Atualizar adaptation.status → 'completed'
4. Atualizar exam.status → 'completed'
```

Prompt de adaptação contextualizado:

```typescript
const adaptationPrompt = `${agent.prompt}

Contexto:
- Disciplina: ${subject.name}
- Ano/Série: ${gradeLevel.name}
- Tema: ${exam.topic || "Não especificado"}
- Resposta correta: ${question.correct_answer}

Questão original:
${question.content}

${question.alternatives ? `Alternativas:\n${question.alternatives.map(a => `${a.label}) ${a.text}`).join('\n')}` : ''}

Gere a versão adaptada desta questão para um aluno com ${support.name}, mantendo a mesma habilidade BNCC e o objetivo de aprendizagem.`;
```

Schema Zod para análise BNCC:

```typescript
const bnccAnalysisSchema = z.object({
  skills: z.array(z.string()), // ["EF06MA01"]
  analysis: z.string(),         // Explicação
});
```

## Critérios de Sucesso

- Habilidades BNCC identificadas para cada questão
- Nível Bloom identificado para cada questão
- Adaptações geradas para cada questão × apoio
- Adaptações mantêm coerência com a questão original
- Registros de `adaptations` persistidos com todos os campos
- Status do exame atualizado para `completed`
- Falha em uma questão não bloqueia as demais
- Logs registram progresso e erros

## Arquivos relevantes

- `supabase/functions/analyze-and-adapt/index.ts`
- `lib/types/adaptation.ts`
- `lib/types/exam.ts`
