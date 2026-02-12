import { createOpenAI } from "@ai-sdk/openai";
import type { AiModel } from "@/lib/types/admin";

/**
 * Creates an OpenAI-compatible provider from a configured AiModel.
 * The Vercel AI SDK `createOpenAI` works with any OpenAI-compatible endpoint.
 *
 * @example
 * ```ts
 * const provider = createProviderFromModel(model);
 * const llm = provider(model.model_id);
 * const result = await generateText({ model: llm, prompt: "..." });
 * ```
 */
export function createProviderFromModel(model: AiModel) {
  return createOpenAI({
    baseURL: model.base_url,
    apiKey: model.api_key,
  });
}
