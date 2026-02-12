// supabase/functions/evolve-agent/index.ts
// Edge Function: Generates a suggested prompt improvement for an agent
// based on teacher feedback, using an LLM.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createOpenAI } from "npm:@ai-sdk/openai@^3";
import { generateObject } from "npm:ai@^6";
import { z } from "npm:zod@^4";

const evolutionResultSchema = z.object({
  suggestedPrompt: z
    .string()
    .describe("The improved version of the agent prompt"),
  commentary: z
    .string()
    .describe("Explanation of the changes made and why"),
});

const EVOLVE_PROMPT = `Você é um especialista em engenharia de prompts para educação inclusiva.

Prompt atual do agente:
---
{agentPrompt}
---

Abaixo estão feedbacks de professores sobre adaptações geradas por este agente:

{feedbacksText}

Com base nesses feedbacks, sugira uma versão melhorada do prompt.
- Mantenha o propósito original do prompt
- Incorpore as melhorias sugeridas pelos feedbacks
- Explique detalhadamente as mudanças propostas e por quê

Retorne o prompt sugerido completo e um comentário explicativo.`;

Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    const { agentId, agentPrompt, feedbackIds } = await req.json();

    if (!agentId || !agentPrompt || !feedbackIds?.length) {
      return jsonResponse({ error: "agentId, agentPrompt and feedbackIds are required" }, 400);
    }

    console.log(`[evolve-agent] Starting for agent: ${agentId}, ${feedbackIds.length} feedbacks`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch selected feedbacks with context
    const { data: feedbacks, error: fbError } = await supabase
      .from("feedbacks")
      .select(`
        id, rating, comment,
        adaptations!inner(
          adapted_content,
          questions!inner(content),
          supports!inner(name)
        )
      `)
      .in("id", feedbackIds);

    if (fbError || !feedbacks || feedbacks.length === 0) {
      console.error("[evolve-agent] Failed to fetch feedbacks", fbError);
      return jsonResponse({ error: "Failed to fetch feedbacks" }, 500);
    }

    // 2. Get an enabled AI model
    const { data: aiModel, error: modelError } = await supabase
      .from("ai_models")
      .select("*")
      .eq("enabled", true)
      .limit(1)
      .single();

    if (modelError || !aiModel) {
      console.error("[evolve-agent] No enabled AI model found", modelError);
      return jsonResponse({ error: "No enabled AI model" }, 500);
    }

    // 3. Build feedbacks text
    const feedbacksText = feedbacks
      .map((f: Record<string, unknown>, i: number) => {
        const adaptation = f.adaptations as Record<string, unknown>;
        const question = adaptation.questions as Record<string, unknown>;
        const support = adaptation.supports as Record<string, unknown>;

        return `### Feedback ${i + 1} (Nota: ${f.rating}/5) — Apoio: ${support.name}
**Questão original:** ${question.content}
**Questão adaptada:** ${adaptation.adapted_content}
**Comentário do professor:** ${f.comment}`;
      })
      .join("\n\n");

    const prompt = EVOLVE_PROMPT
      .replace("{agentPrompt}", agentPrompt)
      .replace("{feedbacksText}", feedbacksText);

    // 4. Call LLM
    const provider = createOpenAI({
      baseURL: aiModel.base_url,
      apiKey: aiModel.api_key,
    });

    const model = provider(aiModel.model_id);

    const result = await generateObject({
      model,
      schema: evolutionResultSchema,
      prompt,
    });

    const { suggestedPrompt, commentary } = result.object;

    // 5. Persist evolution record
    const { data: evolution, error: insertError } = await supabase
      .from("agent_evolutions")
      .insert({
        agent_id: agentId,
        original_prompt: agentPrompt,
        suggested_prompt: suggestedPrompt,
        llm_commentary: commentary,
        feedback_ids: feedbackIds,
        accepted: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[evolve-agent] Failed to persist evolution", insertError);
    }

    const duration = Date.now() - startTime;
    console.log(`[evolve-agent] Completed for agent ${agentId} in ${duration}ms`);

    return jsonResponse({
      evolutionId: evolution?.id,
      suggestedPrompt,
      commentary,
      originalPrompt: agentPrompt,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[evolve-agent] Error after ${duration}ms:`, error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500
    );
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
