import "server-only";

const GEMINI_API_VERSION = "v1beta";
const DEFAULT_GEMINI_TEXT_MODEL = "gemini-1.5-flash";

export type GeminiFailureReason =
  | "ai_disabled"
  | "missing_api_key"
  | "gemini_http_400_bad_request"
  | "gemini_http_401_invalid_key"
  | "gemini_http_403_permission_denied"
  | "gemini_http_404_model_not_found"
  | "gemini_http_429_quota_exceeded"
  | "gemini_http_5xx"
  | "gemini_network_error"
  | "gemini_empty_candidates"
  | "gemini_empty_text"
  | "gemini_invalid_json"
  | "unknown_error";

export type GeminiJsonResult<T> =
  | {
      ok: true;
      source: "json";
      data: T;
      parseStage: "direct_json" | "fenced_json" | "extracted_json";
      model: string;
      warnings: string[];
    }
  | {
      ok: true;
      source: "text";
      text: string;
      parseStage: "plain_text";
      model: string;
      warnings: string[];
    }
  | {
      ok: false;
      reason: GeminiFailureReason;
      model: string;
      warnings: string[];
    };

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  promptFeedback?: unknown;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type GeminiJsonParseResult =
  | {
      ok: true;
      data: Record<string, unknown>;
      parseStage: "direct_json" | "fenced_json" | "extracted_json";
    }
  | {
      ok: false;
      parseStage: "failed";
    };

function getGeminiModel() {
  return (
    process.env.GEMINI_MODEL_TEXT?.trim().replace(/^models\//, "") ||
    DEFAULT_GEMINI_TEXT_MODEL
  );
}

function getAiNewsEnabled() {
  return process.env.AI_NEWS_ENABLED?.trim().toLowerCase() !== "false";
}

function getGeminiHttpReason(status: number): GeminiFailureReason {
  if (status === 400) return "gemini_http_400_bad_request";
  if (status === 401) return "gemini_http_401_invalid_key";
  if (status === 403) return "gemini_http_403_permission_denied";
  if (status === 404) return "gemini_http_404_model_not_found";
  if (status === 429) return "gemini_http_429_quota_exceeded";
  if (status >= 500) return "gemini_http_5xx";
  return "unknown_error";
}

function truncateLogText(value: unknown, maxLength = 200) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}...` : cleaned;
}

function logLineNewsAi(message: string, details: Record<string, unknown>) {
  console.warn(`[line-news-ai] ${message}`, details);
}

function isNonEmptyPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length > 0
  );
}

function tryParseJsonObject(value: string, parseStage: GeminiJsonParseResult["parseStage"]): GeminiJsonParseResult {
  if (parseStage === "failed") return { ok: false, parseStage };
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isNonEmptyPlainObject(parsed)) return { ok: false, parseStage: "failed" };
    return { ok: true, data: parsed, parseStage };
  } catch {
    return { ok: false, parseStage: "failed" };
  }
}

function stripSingleCodeFence(value: string) {
  const match = value.trim().match(/^```(?:[a-z0-9_-]+)?\s*([\s\S]*?)\s*```$/i);
  return match?.[1]?.trim() ?? null;
}

function extractFirstBalancedJsonObject(value: string) {
  const start = value.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < value.length; i += 1) {
    const char = value[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return value.slice(start, i + 1).trim();
      }
    }
  }

  return null;
}

function parseGeminiJsonText(text: string): GeminiJsonParseResult {
  const trimmed = text.trim();
  const direct = tryParseJsonObject(trimmed, "direct_json");
  if (direct.ok) return direct;

  const fenced = stripSingleCodeFence(trimmed);
  if (fenced) {
    const parsedFence = tryParseJsonObject(fenced, "fenced_json");
    if (parsedFence.ok) return parsedFence;
  }

  const extracted = extractFirstBalancedJsonObject(trimmed);
  if (extracted) {
    const parsedExtracted = tryParseJsonObject(extracted, "extracted_json");
    if (parsedExtracted.ok) return parsedExtracted;
  }

  return { ok: false, parseStage: "failed" };
}

function normalizeGeminiPlainText(text: string) {
  return (stripSingleCodeFence(text) ?? text).trim();
}

export async function generateGeminiJson<T>(
  prompt: string
): Promise<GeminiJsonResult<T>> {
  const model = getGeminiModel();
  const enabled = getAiNewsEnabled();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  logLineNewsAi("config", {
    enabled,
    hasApiKey: Boolean(apiKey),
    model,
  });

  if (!enabled) {
    logLineNewsAi("fallback", { fallbackReason: "ai_disabled", model });
    return {
      ok: false,
      reason: "ai_disabled",
      model,
      warnings: ["AI_NEWS_ENABLED=false จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
    };
  }

  if (!apiKey) {
    logLineNewsAi("fallback", { fallbackReason: "missing_api_key", model });
    return {
      ok: false,
      reason: "missing_api_key",
      model,
      warnings: ["ไม่พบ GEMINI_API_KEY จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as
        | GeminiGenerateContentResponse
        | null;
      const reason = getGeminiHttpReason(response.status);
      logLineNewsAi("gemini_http_error", {
        geminiStatus: response.status,
        fallbackReason: reason,
        model,
        geminiErrorStatus: errorBody?.error?.status,
        geminiErrorMessage: truncateLogText(errorBody?.error?.message),
      });
      return {
        ok: false,
        reason,
        model,
        warnings: ["Gemini ไม่พร้อมใช้งาน จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
      };
    }

    const json = (await response.json().catch(() => null)) as
      | GeminiGenerateContentResponse
      | null;
    const hasCandidates = Boolean(json?.candidates?.length);
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    const hasText = Boolean(text);

    logLineNewsAi("gemini_response_shape", {
      geminiStatus: response.status,
      model,
      hasCandidates,
      hasText,
      textLength: text?.length ?? 0,
      hasPromptFeedback: Boolean(json?.promptFeedback),
    });

    if (!hasCandidates) {
      logLineNewsAi("fallback", {
        fallbackReason: "gemini_empty_candidates",
        model,
      });
      return {
        ok: false,
        reason: "gemini_empty_candidates",
        model,
        warnings: ["Gemini ไม่ได้ส่งคำตอบกลับมา จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
      };
    }

    if (!text) {
      logLineNewsAi("fallback", {
        fallbackReason: "gemini_empty_text",
        model,
      });
      return {
        ok: false,
        reason: "gemini_empty_text",
        model,
        warnings: ["Gemini ไม่ได้ส่งข้อความกลับมา จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
      };
    }

    const parsedJson = parseGeminiJsonText(text);
    if (parsedJson.ok) {
      logLineNewsAi("gemini_json_parse", {
        model,
        jsonParseOk: true,
        parseStage: parsedJson.parseStage,
      });
      return {
        ok: true,
        source: "json",
        data: parsedJson.data as T,
        parseStage: parsedJson.parseStage,
        model,
        warnings: [],
      };
    }

    const plainText = normalizeGeminiPlainText(text);
    if (plainText) {
      logLineNewsAi("gemini_json_parse", {
        model,
        jsonParseOk: false,
        parseStage: "plain_text",
      });
      return {
        ok: true,
        source: "text",
        text: plainText,
        parseStage: "plain_text",
        model,
        warnings: [],
      };
    }

    logLineNewsAi("gemini_json_parse", {
      model,
      jsonParseOk: false,
      parseStage: parsedJson.parseStage,
      fallbackReason: "gemini_invalid_json",
    });
    return {
      ok: false,
      reason: "gemini_invalid_json",
      model,
      warnings: ["Gemini ส่ง JSON ไม่ถูกต้อง จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
    };
  } catch (error) {
    logLineNewsAi("network_error", {
      fallbackReason: "gemini_network_error",
      model,
      errorName: error instanceof Error ? error.name : "unknown_error",
      errorMessage: error instanceof Error ? truncateLogText(error.message) : undefined,
    });
    return {
      ok: false,
      reason: "gemini_network_error",
      model,
      warnings: ["Gemini ไม่พร้อมใช้งาน จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
    };
  }
}
