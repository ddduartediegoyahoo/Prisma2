# Tarefa 12.0: Edge Function — Extração de Questões (PDF → LLM Multimodal)

<critical>Ler os arquivos de prd.md e techspec.md desta pasta, se você não ler esses arquivos sua tarefa será invalidada</critical>

## Visão Geral

Criar a Supabase Edge Function `extract-questions` que recebe um `examId`, baixa o PDF do Storage, converte as páginas em imagens, envia cada página a uma LLM multimodal via Vercel AI SDK para extrair as questões, e persiste as questões extraídas no banco.

<requirements>
- Edge Function Deno em `supabase/functions/extract-questions/`
- Baixar PDF do Supabase Storage
- Converter páginas do PDF em imagens para envio à LLM multimodal
- Extrair questões usando LLM multimodal (PRD F5.1)
- Suportar questões objetivas e dissertativas (PRD F5.2)
- Preservar referências a elementos visuais (PRD F5.3)
- Em caso de falha parcial, registrar warning e continuar (PRD F5.1)
- Persistir questões na tabela `questions`
- Atualizar status do exame para `awaiting_answers` ao concluir
- Atualizar status para `error` com mensagem em caso de falha total
- Usar modelo de IA configurado pelo admin (buscar do banco)
</requirements>

## Subtarefas

- [ ] 12.1 Criar estrutura da Edge Function (`supabase/functions/extract-questions/index.ts`)
- [ ] 12.2 Implementar download do PDF do Supabase Storage dentro da Edge Function
- [ ] 12.3 Implementar conversão de PDF para imagens (base64) para envio à LLM — pesquisar biblioteca Deno compatível ou usar abordagem de envio direto do PDF se o modelo suportar
- [ ] 12.4 Implementar chamada à LLM multimodal via Vercel AI SDK (`generateObject`) com prompt estruturado para extração de questões
- [ ] 12.5 Definir schema de resposta esperada da LLM (Zod) para parsing estruturado
- [ ] 12.6 Implementar persistência das questões extraídas na tabela `questions`
- [ ] 12.7 Implementar tratamento de falha parcial: registrar `extraction_warning` nas questões afetadas
- [ ] 12.8 Atualizar status do exame (`awaiting_answers` ou `error`)
- [ ] 12.9 Implementar logging estruturado (exam_id, duração, quantidade de questões, erros)
- [ ] 12.10 Implementar seleção do modelo de IA a ser usado (buscar um modelo habilitado do banco)
- [ ] 12.11 Testar com Supabase CLI local (`supabase functions serve`)

## Detalhes de Implementação

Referir-se às seções **"Supabase Edge Functions"** e **"LLMs via Vercel AI SDK"** da `techspec.md`.

Prompt estruturado para extração:

```typescript
const extractionPrompt = `Analise esta página de prova escolar e extraia todas as questões.
Para cada questão, identifique:
- Número da questão
- Tipo: "objective" (múltipla escolha) ou "essay" (dissertativa)
- Conteúdo completo da questão
- Alternativas (se objetiva): lista com label (A, B, C...) e texto
- Elementos visuais: descreva se há tabelas, gráficos ou imagens vinculados à questão

Retorne em formato JSON estruturado.`;
```

Schema Zod para resposta:

```typescript
const questionExtractionSchema = z.object({
  questions: z.array(z.object({
    orderNum: z.number(),
    content: z.string(),
    questionType: z.enum(["objective", "essay"]),
    alternatives: z.array(z.object({
      label: z.string(),
      text: z.string(),
    })).optional(),
    visualElements: z.array(z.object({
      type: z.string(),
      description: z.string(),
    })).optional(),
    extractionWarning: z.string().optional(),
  })),
});
```

Para a conversão de PDF → imagens na Edge Function (Deno), considerar:
- Usar `pdf.js` (pdfjs-dist) para renderizar páginas como canvas/imagem
- Ou enviar o PDF diretamente se a LLM suportar (ex.: Claude com PDF support)
- Ou usar uma API externa de conversão

Factory do provider:

```typescript
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";

// Buscar modelo habilitado do banco
const aiModel = await getEnabledModel(supabase);
const provider = createOpenAI({ baseURL: aiModel.base_url, apiKey: aiModel.api_key });
const model = provider(aiModel.model_id);

const result = await generateObject({
  model,
  schema: questionExtractionSchema,
  messages: [
    { role: "user", content: [
      { type: "text", text: extractionPrompt },
      { type: "image", image: pageImageBase64 },
    ]},
  ],
});
```

## Critérios de Sucesso

- Edge Function executa sem erro para um PDF simples
- Questões objetivas e dissertativas são extraídas corretamente
- Questões persistidas na tabela `questions` com dados corretos
- Status do exame atualizado para `awaiting_answers`
- Em caso de falha parcial, questões extraídas são salvas e warning registrado
- Em caso de falha total, status atualizado para `error` com mensagem
- Logs estruturados registram exam_id, duração e quantidade de questões

## Arquivos relevantes

- `supabase/functions/extract-questions/index.ts`
- `lib/ai/create-provider.ts` (referência — lógica replicada na Edge Function Deno)
- `lib/types/exam.ts`
