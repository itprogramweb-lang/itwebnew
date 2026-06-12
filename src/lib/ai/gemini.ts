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
      data: T;
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

function getGeminiModel() {
  return (
    process.env.GEMINI_MODEL_TEXT?.trim().replace(/^models\//, "") ||
    DEFAULT_GEMINI_TEXT_MODEL
  );
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
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

    try {
      const data = JSON.parse(stripJsonFence(text)) as T;
      logLineNewsAi("gemini_json_parse", {
        model,
        jsonParseOk: true,
      });
      return {
        ok: true,
        data,
        model,
        warnings: [],
      };
    } catch {
      logLineNewsAi("gemini_json_parse", {
        model,
        jsonParseOk: false,
        fallbackReason: "gemini_invalid_json",
      });
      return {
        ok: false,
        reason: "gemini_invalid_json",
        model,
        warnings: ["Gemini ส่ง JSON ไม่ถูกต้อง จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
      };
    }
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
