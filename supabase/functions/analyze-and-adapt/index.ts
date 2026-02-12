// supabase/functions/analyze-and-adapt/index.ts
// Edge Function: Analyzes questions (BNCC + Bloom) and generates adaptations
//
// Triggered after the teacher confirms correct answers. For each question:
//   1. Identifies BNCC skills via LLM
//   2. Identifies Bloom cognitive level via LLM
//   3. For each selected support: generates an adapted version using the agent's prompt
// Results are persisted to the adaptations table.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai@^3";
import { generateObject, generateText } from "npm:ai@^6";
import { z } from "npm:zod@^4";

// ---------- Zod schemas for structured LLM output ----------

const bnccAnalysisSchema = z.object({
  skills: z
    .array(z.string())
    .describe("Lista de códigos de habilidades BNCC, ex: ['EF06MA01', 'EF06MA03']"),
  analysis: z
    .string()
    .describe("Explicação de por que estas habilidades se aplicam à questão"),
});

const bloomAnalysisSchema = z.object({
  level: z
    .string()
    .describe("Nível da Taxonomia de Bloom: Lembrar, Entender, Aplicar, Analisar, Avaliar ou Criar"),
  analysis: z
    .string()
    .describe("Explicação de por que este nível cognitivo se aplica à questão"),
});

// ---------- Prompts ----------

const BNCC_PROMPT = `Você é um especialista em currículo educacional brasileiro (BNCC).

Analise a questão escolar abaixo e identifique:
1. A(s) habilidade(s) BNCC relacionada(s) (códigos como EF06MA01)
2. Uma breve análise explicando por que estas habilidades se aplicam

Contexto:
- Disciplina: {subject}
- Ano/Série: {gradeLevel}
- Tema: {topic}

Questão:
{questionContent}

{alternativesText}`;

const BLOOM_PROMPT = `Você é um especialista em Taxonomia de Bloom aplicada à educação.

Analise a questão escolar abaixo e identifique:
1. O nível cognitivo da Taxonomia de Bloom (Lembrar, Entender, Aplicar, Analisar, Avaliar ou Criar)
2. Uma breve análise explicando por que este nível se aplica

Questão:
{questionContent}

{alternativesText}`;

// ---------- Types ----------

interface ExamSupport {
  support_id: string;
  supports: {
    id: string;
    name: string;
    agent_id: string;
    model_id: string;
    agents: { id: string; name: string; prompt: string };
    ai_models: { id: string; name: string; base_url: string; api_key: string; model_id: string };
  };
}

interface Question {
  id: string;
  order_num: number;
  content: string;
  question_type: string;
  alternatives: Array<{ label: string; text: string }> | string | null;
  correct_answer: string | null;
}

// ---------- Main handler ----------

Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    const { examId } = await req.json();

    if (!examId) {
      return jsonResponse({ error: "examId is required" }, 400);
    }

    console.log(`[analyze-and-adapt] Starting for exam: ${examId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Load exam with context
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("*, subjects(name), grade_levels(name)")
      .eq("id", examId)
      .single();

    if (examError || !exam) {
      console.error("[analyze-and-adapt] Exam not found", examError);
      return jsonResponse({ error: "Exam not found" }, 404);
    }

    // 2. Load questions
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("order_num");

    if (questionsError || !questions || questions.length === 0) {
      console.error("[analyze-and-adapt] No questions found", questionsError);
      await updateExamStatus(supabase, examId, "error", "Nenhuma questão encontrada para análise.");
      return jsonResponse({ error: "No questions" }, 500);
    }

    // 3. Load exam supports with linked agents and models
    const { data: examSupports, error: supportsError } = await supabase
      .from("exam_supports")
      .select("support_id, supports(id, name, agent_id, model_id, agents(id, name, prompt), ai_models(id, name, base_url, api_key, model_id))")
      .eq("exam_id", examId);

    if (supportsError || !examSupports || examSupports.length === 0) {
      console.error("[analyze-and-adapt] No supports found", supportsError);
      await updateExamStatus(supabase, examId, "error", "Nenhum apoio selecionado.");
      return jsonResponse({ error: "No supports" }, 500);
    }

    const supports = (examSupports as unknown as ExamSupport[]).map((es) => es.supports);

    // 4. Get a default model for BNCC/Bloom analysis (use the first support's model)
    const defaultModel = supports[0].ai_models;
    const defaultProvider = createOpenAI({
      baseURL: defaultModel.base_url,
      apiKey: defaultModel.api_key,
    });
    const defaultLlm = defaultProvider(defaultModel.model_id);

    console.log(
      `[analyze-and-adapt] Processing ${questions.length} questions × ${supports.length} supports`
    );

    // 5. Create pending adaptation records for each question × support
    const pendingAdaptations: Array<{
      question_id: string;
      support_id: string;
      status: string;
    }> = [];

    for (const question of questions as Question[]) {
      for (const support of supports) {
        pendingAdaptations.push({
          question_id: question.id,
          support_id: support.id,
          status: "pending",
        });
      }
    }

    await supabase.from("adaptations").insert(pendingAdaptations);

    // 6. Process each question
    const subjectName = exam.subjects?.name ?? "Não especificada";
    const gradeLevelName = exam.grade_levels?.name ?? "Não especificado";
    const topicName = exam.topic ?? "Não especificado";
    let processedCount = 0;
    let errorCount = 0;

    for (const question of questions as Question[]) {
      try {
        const alternativesText = formatAlternatives(question.alternatives);

        // 6a. BNCC Analysis
        let bnccSkills: string[] = [];
        let bnccAnalysis = "";

        try {
          const bnccPrompt = BNCC_PROMPT
            .replace("{subject}", subjectName)
            .replace("{gradeLevel}", gradeLevelName)
            .replace("{topic}", topicName)
            .replace("{questionContent}", question.content)
            .replace("{alternativesText}", alternativesText);

          const bnccResult = await generateObject({
            model: defaultLlm,
            schema: bnccAnalysisSchema,
            prompt: bnccPrompt,
          });

          bnccSkills = bnccResult.object.skills;
          bnccAnalysis = bnccResult.object.analysis;
        } catch (err) {
          console.error(`[analyze-and-adapt] BNCC analysis failed for question ${question.order_num}:`, err);
          bnccAnalysis = "Erro na análise BNCC.";
        }

        // 6b. Bloom Analysis
        let bloomLevel = "";
        let bloomAnalysis = "";

        try {
          const bloomPrompt = BLOOM_PROMPT
            .replace("{questionContent}", question.content)
            .replace("{alternativesText}", alternativesText);

          const bloomResult = await generateObject({
            model: defaultLlm,
            schema: bloomAnalysisSchema,
            prompt: bloomPrompt,
          });

          bloomLevel = bloomResult.object.level;
          bloomAnalysis = bloomResult.object.analysis;
        } catch (err) {
          console.error(`[analyze-and-adapt] Bloom analysis failed for question ${question.order_num}:`, err);
          bloomAnalysis = "Erro na análise Bloom.";
        }

        // 6c. Generate adaptation for each support
        for (const support of supports) {
          try {
            // Update adaptation status to processing
            await supabase
              .from("adaptations")
              .update({ status: "processing" })
              .eq("question_id", question.id)
              .eq("support_id", support.id);

            // Create provider for this support's model
            const supportProvider = createOpenAI({
              baseURL: support.ai_models.base_url,
              apiKey: support.ai_models.api_key,
            });
            const supportLlm = supportProvider(support.ai_models.model_id);

            const adaptationPrompt = buildAdaptationPrompt({
              agentPrompt: support.agents.prompt,
              subjectName,
              gradeLevelName,
              topicName,
              correctAnswer: question.correct_answer,
              questionContent: question.content,
              alternatives: question.alternatives,
              supportName: support.name,
            });

            const adaptationResult = await generateText({
              model: supportLlm,
              prompt: adaptationPrompt,
            });

            // Update adaptation with results
            await supabase
              .from("adaptations")
              .update({
                adapted_content: adaptationResult.text,
                bncc_skills: bnccSkills,
                bloom_level: bloomLevel,
                bncc_analysis: bnccAnalysis,
                bloom_analysis: bloomAnalysis,
                status: "completed",
              })
              .eq("question_id", question.id)
              .eq("support_id", support.id);

          } catch (err) {
            console.error(
              `[analyze-and-adapt] Adaptation failed for question ${question.order_num}, support ${support.name}:`,
              err
            );

            await supabase
              .from("adaptations")
              .update({
                bncc_skills: bnccSkills,
                bloom_level: bloomLevel,
                bncc_analysis: bnccAnalysis,
                bloom_analysis: bloomAnalysis,
                status: "error",
              })
              .eq("question_id", question.id)
              .eq("support_id", support.id);

            errorCount++;
          }
        }

        processedCount++;
      } catch (err) {
        console.error(
          `[analyze-and-adapt] Failed processing question ${question.order_num}:`,
          err
        );
        errorCount++;
      }
    }

    // 7. Update exam status
    if (processedCount === 0) {
      await updateExamStatus(supabase, examId, "error", "Nenhuma questão foi processada com sucesso.");
    } else {
      await updateExamStatus(supabase, examId, "completed");
    }

    const duration = Date.now() - startTime;
    console.log(
      `[analyze-and-adapt] Completed for exam ${examId}: ` +
        `${processedCount}/${questions.length} questions, ` +
        `${errorCount} errors, ${duration}ms`
    );

    return jsonResponse({
      success: true,
      examId,
      questionsProcessed: processedCount,
      questionsTotal: questions.length,
      supportsCount: supports.length,
      errorCount,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[analyze-and-adapt] Unexpected error after ${duration}ms:`, error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500
    );
  }
});

// ---------- Helpers ----------

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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
    console.error(`[analyze-and-adapt] Failed to update exam status to ${status}:`, error);
  }
}

/** Normalises alternatives from DB — handles both parsed arrays and JSON strings (double-serialised JSONB). */
function safeParseAlternatives(
  raw: unknown
): Array<{ label: string; text: string }> | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* invalid JSON — treat as null */ }
  }
  return null;
}

function formatAlternatives(
  alternatives: Array<{ label: string; text: string }> | string | null
): string {
  const parsed = safeParseAlternatives(alternatives);
  if (!parsed || parsed.length === 0) return "";
  return (
    "Alternativas:\n" +
    parsed.map((a) => `${a.label}) ${a.text}`).join("\n")
  );
}

function buildAdaptationPrompt(params: {
  agentPrompt: string;
  subjectName: string;
  gradeLevelName: string;
  topicName: string;
  correctAnswer: string | null;
  questionContent: string;
  alternatives: Array<{ label: string; text: string }> | string | null;
  supportName: string;
}): string {
  const alternativesText = formatAlternatives(params.alternatives);

  return `${params.agentPrompt}

Contexto:
- Disciplina: ${params.subjectName}
- Ano/Série: ${params.gradeLevelName}
- Tema: ${params.topicName}
- Resposta correta: ${params.correctAnswer ?? "Não informada"}

Questão original:
${params.questionContent}

${alternativesText}

Gere a versão adaptada desta questão para um aluno com ${params.supportName}, mantendo a mesma habilidade BNCC e o objetivo de aprendizagem. Retorne apenas o texto da questão adaptada.`;
}
