import type {
  AIResponse,
  CallClassification,
  GameState,
  InstructionType,
  ProviderConfig,
  ProviderResponse,
  ValidatedAIResponse,
} from "./types";
import { AIError } from "./errors";
import { createAdapter, type LLMProviderAdapter } from "./providers";
import { assemblePrompt, promptToMessages } from "./prompts";
import type { MemoryState, LoreContext } from "./types";
import { parseAIResponse, sanitizeAIResponse, validateAIResponse } from "./validation";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];
const MAX_OUTPUT_TOKENS = 1500;
const ROUTINE_TEMPERATURE = 0.8;
const PREMIUM_TEMPERATURE = 0.7;

const PREMIUM_INSTRUCTIONS: InstructionType[] = ["advancement", "combat"];

export function classifyCall(instruction: InstructionType): CallClassification {
  return PREMIUM_INSTRUCTIONS.includes(instruction) ? "premium" : "routine";
}

export function selectModel(
  config: ProviderConfig,
  classification: CallClassification,
): string {
  return classification === "premium" ? config.premiumModel : config.routineModel;
}

function getTemperature(classification: CallClassification): number {
  return classification === "premium" ? PREMIUM_TEMPERATURE : ROUTINE_TEMPERATURE;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeWithRetry(
  adapter: LLMProviderAdapter,
  request: Parameters<LLMProviderAdapter["makeRequest"]>[0],
  apiKey: string,
): Promise<ProviderResponse> {
  let lastError: AIError | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await adapter.makeRequest(request, apiKey);
    } catch (err) {
      if (err instanceof AIError) {
        lastError = err;
        if (!err.retryable || attempt === MAX_RETRIES) {
          throw err;
        }
        await sleep(RETRY_DELAYS[attempt]);
      } else {
        throw err;
      }
    }
  }

  throw lastError ?? new AIError("PROVIDER_ERROR", "Max retries exceeded");
}

export interface GenerateOptions {
  config: ProviderConfig;
  gameState: GameState;
  memory: MemoryState;
  loreContext: LoreContext;
  instruction: InstructionType;
  playerAction: string;
  abilities: string[];
  actingRequirements: string[];
}

export async function generate(options: GenerateOptions): Promise<ValidatedAIResponse> {
  const adapter = createAdapter(options.config.providerId, options.config.baseUrl);
  const classification = classifyCall(options.instruction);
  const model = selectModel(options.config, classification);
  const temperature = getTemperature(classification);

  const assembly = assemblePrompt({
    gameState: options.gameState,
    memory: options.memory,
    loreContext: options.loreContext,
    instruction: options.instruction,
    playerAction: options.playerAction,
    abilities: options.abilities,
    actingRequirements: options.actingRequirements,
  });

  const messages = promptToMessages(assembly);

  const providerResponse = await executeWithRetry(
    adapter,
    {
      messages,
      model,
      temperature,
      maxTokens: MAX_OUTPUT_TOKENS,
      responseFormat: { type: "json_object" },
    },
    options.config.apiKey,
  );

  let aiResponse: AIResponse;
  try {
    aiResponse = parseAIResponse(providerResponse.content);
  } catch (parseError) {
    if (parseError instanceof AIError && parseError.code === "MALFORMED_OUTPUT") {
      const retryMessages = [
        ...messages,
        { role: "assistant" as const, content: providerResponse.content },
        {
          role: "user" as const,
          content:
            "Your previous response was not valid JSON. Please respond with ONLY a valid JSON object matching the required schema. No markdown, no code blocks, just the JSON object.",
        },
      ];

      const retryResponse = await executeWithRetry(
        adapter,
        {
          messages: retryMessages,
          model,
          temperature: temperature * 0.5,
          maxTokens: MAX_OUTPUT_TOKENS,
          responseFormat: { type: "json_object" },
        },
        options.config.apiKey,
      );

      aiResponse = parseAIResponse(retryResponse.content);
    } else {
      throw parseError;
    }
  }

  const validation = validateAIResponse(aiResponse);

  if (!validation.valid) {
    aiResponse = sanitizeAIResponse(aiResponse);
  }

  const finalValidation = validateAIResponse(aiResponse);

  return {
    response: aiResponse,
    validation: finalValidation,
  };
}

export async function validateProviderConfig(
  config: ProviderConfig,
): Promise<{ valid: boolean; error?: string }> {
  const adapter = createAdapter(config.providerId, config.baseUrl);
  return adapter.validateKey(config.apiKey);
}

export { MAX_RETRIES, RETRY_DELAYS, MAX_OUTPUT_TOKENS };
