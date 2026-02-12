// supabase/functions/extract-questions/index.ts
// Edge Function: Extracts questions from a PDF exam using a multimodal LLM
//
// Triggered after PDF upload. Downloads PDF from Storage, sends pages as
// base64 to a configured LLM model, extracts structured question data,
// persists to the questions table, and updates exam status.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { createOpenAI } from "npm:@ai-sdk/openai@^3";
import { generateObject } from "npm:ai@^6";
import { z } from "npm:zod@^4";

// ---------- Zod schema for LLM structured output ----------

const alternativeSchema = z.object({
  label: z.string().describe("Letter label, e.g. A, B, C, D"),
  text: z.string().describe("Full text of the alternative"),
});

const visualElementSchema = z.object({
  type: z
    .string()
    .describe("Type of visual element: image, table, chart, diagram"),
  description: z
    .string()
    .describe("Description of the visual element and its relevance to the question"),
});

const extractedQuestionSchema = z.object({
  orderNum: z.number().describe("Sequential question number starting from 1"),
  content: z.string().describe("Full text content of the question"),
  questionType: z
    .enum(["objective", "essay"])
    .describe("objective for multiple choice, essay for open-ended"),
  alternatives: z
    .array(alternativeSchema)
    .nullable()
    .describe("Alternatives for objective questions only, null if essay"),
  visualElements: z
    .array(visualElementSchema)
    .nullable()
    .describe("Visual elements associated with this question, null if none"),
  extractionWarning: z
    .string()
    .nullable()
    .describe("Warning if extraction was partial or uncertain, null if clean"),
});

const pageExtractionSchema = z.object({
  questions: z
    .array(extractedQuestionSchema)
    .describe("All questions found on this page"),
});

// ---------- Extraction prompt ----------

const EXTRACTION_PROMPT = `Você é um assistente especializado em analisar provas escolares brasileiras.

Analise a imagem desta página de prova e extraia TODAS as questões encontradas.

Para cada questão, identifique:
1. **Número da questão** (orderNum): número sequencial conforme aparece na prova
2. **Tipo** (questionType): "objective" se tem alternativas de múltipla escolha, "essay" se é dissertativa/aberta
3. **Conteúdo** (content): texto completo da questão, incluindo enunciado, contextos e textos de apoio
4. **Alternativas** (alternatives): APENAS para questões objetivas — lista com label (A, B, C, D, E) e texto de cada alternativa
5. **Elementos visuais** (visualElements): se há tabelas, gráficos, imagens, diagramas ou mapas vinculados à questão, descreva cada um
6. **Aviso de extração** (extractionWarning): se algum conteúdo está ilegível, cortado ou incerto, registre um aviso

Regras importantes:
- Preserve o texto original da questão, sem interpretar ou modificar
- Se uma questão se estende por mais de uma página, extraia o que está visível nesta página
- Se não há questões na página (ex: capa, cabeçalho), retorne uma lista vazia
- Responda em português brasileiro`;

// ---------- Main handler ----------

Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    const { examId } = await req.json();

    if (!examId) {
      return new Response(
        JSON.stringify({ error: "examId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[extract-questions] Starting extraction for exam: ${examId}`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch exam record
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();

    if (examError || !exam) {
      console.error(`[extract-questions] Exam not found: ${examId}`, examError);
      return new Response(
        JSON.stringify({ error: "Exam not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch the default AI model, falling back to any enabled model
    let aiModel = null;

    // Try to get the system default model first
    const { data: defaultModel } = await supabase
      .from("ai_models")
      .select("*")
      .eq("is_default", true)
      .eq("enabled", true)
      .limit(1)
      .single();

    if (defaultModel) {
      aiModel = defaultModel;
    } else {
      // Fallback: pick any enabled model
      const { data: fallbackModel } = await supabase
        .from("ai_models")
        .select("*")
        .eq("enabled", true)
        .limit(1)
        .single();

      aiModel = fallbackModel;
    }

    if (!aiModel) {
      console.error("[extract-questions] No enabled AI model found");
      await updateExamStatus(supabase, examId, "error", "Nenhum modelo de IA habilitado encontrado.");
      return new Response(
        JSON.stringify({ error: "No enabled AI model" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[extract-questions] Using model: ${aiModel.name} (${aiModel.model_id})`);

    // 3. Download PDF from Storage
    const { data: pdfData, error: downloadError } = await supabase.storage
      .from("exams")
      .download(exam.pdf_path);

    if (downloadError || !pdfData) {
      console.error("[extract-questions] PDF download failed", downloadError);
      await updateExamStatus(supabase, examId, "error", "Erro ao baixar o PDF.");
      return new Response(
        JSON.stringify({ error: "PDF download failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Convert PDF to base64 for LLM
    // Many multimodal LLMs (GPT-4o, Claude) support PDF or image input.
    // We send the entire PDF as a base64 file attachment.
    const pdfArrayBuffer = await pdfData.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    const pdfBase64 = encodeBase64(pdfBytes);

    console.log(`[extract-questions] PDF downloaded, size: ${pdfArrayBuffer.byteLength} bytes`);

    // 5. Create AI provider and call LLM
    const provider = createOpenAI({
      baseURL: aiModel.base_url,
      apiKey: aiModel.api_key,
    });

    const model = provider(aiModel.model_id);

    let extractedQuestions: z.infer<typeof pageExtractionSchema>;

    try {
      const result = await generateObject({
        model,
        schema: pageExtractionSchema,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              {
                type: "file",
                data: pdfBase64,
                mediaType: "application/pdf",
              },
            ],
          },
        ],
      });

      extractedQuestions = result.object;
    } catch (llmError) {
      console.error("[extract-questions] LLM extraction failed", llmError);
      await updateExamStatus(
        supabase,
        examId,
        "error",
        `Erro na extração via IA: ${llmError instanceof Error ? llmError.message : "Erro desconhecido"}`
      );
      return new Response(
        JSON.stringify({ error: "LLM extraction failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[extract-questions] Extracted ${extractedQuestions.questions.length} questions`
    );

    // 6. Handle no questions found
    if (extractedQuestions.questions.length === 0) {
      await updateExamStatus(
        supabase,
        examId,
        "error",
        "Nenhuma questão foi encontrada no PDF. Verifique se o arquivo contém uma prova."
      );
      return new Response(
        JSON.stringify({ error: "No questions found", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 7. Persist extracted questions
    const questionsToInsert = extractedQuestions.questions.map((q) => ({
      exam_id: examId,
      order_num: q.orderNum,
      content: q.content,
      question_type: q.questionType,
      alternatives: ensureJsonValue(q.alternatives),
      visual_elements: ensureJsonValue(q.visualElements),
      extraction_warning: q.extractionWarning ?? null,
    }));

    const { error: insertError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (insertError) {
      console.error("[extract-questions] Failed to insert questions", insertError);
      await updateExamStatus(
        supabase,
        examId,
        "error",
        `Erro ao salvar questões: ${insertError.message}`
      );
      return new Response(
        JSON.stringify({ error: "Failed to persist questions" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 8. Update exam status to awaiting_answers
    await updateExamStatus(supabase, examId, "awaiting_answers");

    const duration = Date.now() - startTime;
    const warningCount = extractedQuestions.questions.filter(
      (q) => q.extractionWarning
    ).length;

    console.log(
      `[extract-questions] Completed for exam ${examId}: ` +
        `${extractedQuestions.questions.length} questions, ` +
        `${warningCount} warnings, ${duration}ms`
    );

    return new Response(
      JSON.stringify({
        success: true,
        examId,
        questionsCount: extractedQuestions.questions.length,
        warningCount,
        durationMs: duration,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[extract-questions] Unexpected error after ${duration}ms:`,
      error
    );

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ---------- Helpers ----------

/** Ensures a value is a parsed JSON object/array before inserting into a JSONB column.
 *  Prevents double-serialisation when the AI SDK returns a JSON string instead of a parsed value. */
function ensureJsonValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

async function updateExamStatus(
  supabase: ReturnType<typeof createClient>,
  examId: string,
  status: string,
  errorMessage?: string
) {
  const update: Record<string, unknown> = { status };
  if (errorMessage) update.error_message = errorMessage;

  const { error } = await supabase
    .from("exams")
    .update(update)
    .eq("id", examId);

  if (error) {
    console.error(
      `[extract-questions] Failed to update exam status to ${status}:`,
      error
    );
  }
}
