import { GoogleGenAI, Type } from "@google/genai";

export type GeminiModelTier = "primary" | "advanced";

export interface GeminiConfig {
  apiKeyConfigured: boolean;
  primaryModelId: string;
  advancedModelId: string;
}

export interface GeminiConnectionTestResult {
  modelId: string;
  tier: GeminiModelTier;
  configured: boolean;
  connected: boolean;
  statusLabel:
    | "Connected"
    | "Not configured"
    | "Authentication failed"
    | "API unavailable"
    | "Quota exceeded"
    | "Test not performed";
  lastTestedAt: string;
  responseTimeMs: number | null;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  sampleResponse: string | null;
  errorDetails: string | null;
}

export function getGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
  return {
    apiKeyConfigured: Boolean(apiKey),
    primaryModelId: process.env.PRIMARY_AI_MODEL?.trim() || "gemini-3.8-flash",
    advancedModelId: process.env.ADVANCED_AI_MODEL?.trim() || "gemini-4-argon",
  };
}

export function resolveModelId(tier: GeminiModelTier = "primary"): string {
  const cfg = getGeminiConfig();
  return tier === "advanced" ? cfg.advancedModelId : cfg.primaryModelId;
}

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function classifyGeminiError(err: unknown): {
  statusLabel: GeminiConnectionTestResult["statusLabel"];
  message: string;
} {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("permission_denied") ||
    lower.includes("unauthenticated")
  ) {
    return {
      statusLabel: "Authentication failed",
      message: `Invalid or unauthorized GEMINI_API_KEY: ${raw}`,
    };
  }

  if (
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    return {
      statusLabel: "Quota exceeded",
      message: `Gemini API rate limit or quota exceeded: ${raw}`,
    };
  }

  if (
    lower.includes("404") ||
    lower.includes("not_found") ||
    lower.includes("not found") ||
    lower.includes("is not supported")
  ) {
    return {
      statusLabel: "API unavailable",
      message: `Model ID not found or unavailable on this endpoint/account: ${raw}`,
    };
  }

  return {
    statusLabel: "API unavailable",
    message: raw,
  };
}

/**
 * Performs a real live request against the official Google Gemini Developer API
 * using @google/genai SDK. Never reports Connected without a verified API response.
 */
export async function testGeminiConnection(
  tier: GeminiModelTier = "primary"
): Promise<GeminiConnectionTestResult> {
  const cfg = getGeminiConfig();
  const modelId = resolveModelId(tier);
  const now = new Date().toISOString();

  if (!cfg.apiKeyConfigured) {
    return {
      modelId,
      tier,
      configured: false,
      connected: false,
      statusLabel: "Not configured",
      lastTestedAt: now,
      responseTimeMs: null,
      tokenUsage: null,
      sampleResponse: null,
      errorDetails:
        "Missing GEMINI_API_KEY in .env.local. Obtain a key from Google AI Studio (https://aistudio.google.com/apikey) and set GEMINI_API_KEY in .env.local.",
    };
  }

  const ai = getClient();
  if (!ai) {
    return {
      modelId,
      tier,
      configured: false,
      connected: false,
      statusLabel: "Not configured",
      lastTestedAt: now,
      responseTimeMs: null,
      tokenUsage: null,
      sampleResponse: null,
      errorDetails: "GEMINI_API_KEY is empty.",
    };
  }

  const startedAt = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents:
        'Respond with valid JSON: {"status":"ok","engine":"vyral","ready":true}',
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 64,
        abortSignal: AbortSignal.timeout(10000),
      },
    });

    const elapsedMs = Date.now() - startedAt;
    const text = response.text?.trim() || "";

    if (!text) {
      return {
        modelId,
        tier,
        configured: true,
        connected: false,
        statusLabel: "API unavailable",
        lastTestedAt: now,
        responseTimeMs: elapsedMs,
        tokenUsage: null,
        sampleResponse: null,
        errorDetails: "Empty response returned from Gemini endpoint.",
      };
    }

    const usage = response.usageMetadata;
    return {
      modelId,
      tier,
      configured: true,
      connected: true,
      statusLabel: "Connected",
      lastTestedAt: now,
      responseTimeMs: elapsedMs,
      tokenUsage: usage
        ? {
            promptTokens: usage.promptTokenCount || 0,
            completionTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
          }
        : null,
      sampleResponse: text,
      errorDetails: null,
    };
  } catch (err) {
    const elapsedMs = Date.now() - startedAt;
    const classified = classifyGeminiError(err);
    return {
      modelId,
      tier,
      configured: true,
      connected: false,
      statusLabel: classified.statusLabel,
      lastTestedAt: now,
      responseTimeMs: elapsedMs,
      tokenUsage: null,
      sampleResponse: null,
      errorDetails: classified.message,
    };
  }
}

/**
 * Generates text using Gemini 3.8 Flash (primary) or Gemini 4 Argon (advanced).
 */
export async function generateGeminiText(params: {
  prompt: string;
  systemInstruction?: string;
  tier?: GeminiModelTier;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}): Promise<{
  ok: boolean;
  modelId: string;
  text: string | null;
  latencyMs: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null;
  error: string | null;
}> {
  const modelId = resolveModelId(params.tier || "primary");
  const ai = getClient();
  if (!ai) {
    return {
      ok: false,
      modelId,
      text: null,
      latencyMs: 0,
      tokenUsage: null,
      error: "GEMINI_API_KEY not configured",
    };
  }

  const startedAt = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: params.prompt,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.6,
        maxOutputTokens: params.maxOutputTokens ?? 1024,
        abortSignal: AbortSignal.timeout(params.timeoutMs ?? 12000),
      },
    });
    const latencyMs = Date.now() - startedAt;
    const usage = response.usageMetadata;
    return {
      ok: Boolean(response.text),
      modelId,
      text: response.text || null,
      latencyMs,
      tokenUsage: usage
        ? {
            promptTokens: usage.promptTokenCount || 0,
            completionTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
          }
        : null,
      error: null,
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const classified = classifyGeminiError(err);
    return {
      ok: false,
      modelId,
      text: null,
      latencyMs,
      tokenUsage: null,
      error: classified.message,
    };
  }
}

/**
 * Generates structured JSON using Gemini 3.8 Flash (primary) or Gemini 4 Argon (advanced).
 */
export async function generateGeminiJson<T>(params: {
  prompt: string;
  tier?: GeminiModelTier;
  temperature?: number;
  timeoutMs?: number;
}): Promise<{
  ok: boolean;
  modelId: string;
  data: T | null;
  latencyMs: number;
  error: string | null;
}> {
  const modelId = resolveModelId(params.tier || "primary");
  const ai = getClient();
  if (!ai) {
    return {
      ok: false,
      modelId,
      data: null,
      latencyMs: 0,
      error: "GEMINI_API_KEY not configured",
    };
  }

  const startedAt = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: params.prompt,
      config: {
        responseMimeType: "application/json",
        temperature: params.temperature ?? 0.5,
        abortSignal: AbortSignal.timeout(params.timeoutMs ?? 12000),
      },
    });
    const latencyMs = Date.now() - startedAt;
    const rawText = response.text?.trim() || "";
    if (!rawText) {
      return {
        ok: false,
        modelId,
        data: null,
        latencyMs,
        error: "Empty JSON response from Gemini",
      };
    }
    const parsed = JSON.parse(rawText) as T;
    return {
      ok: true,
      modelId,
      data: parsed,
      latencyMs,
      error: null,
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const classified = classifyGeminiError(err);
    return {
      ok: false,
      modelId,
      data: null,
      latencyMs,
      error: classified.message,
    };
  }
}

export { Type };
