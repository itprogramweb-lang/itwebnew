import "server-only";

const GEMINI_API_VERSION = "v1beta";
const DEFAULT_GEMINI_TEXT_MODEL = "gemini-1.5-flash";

export type GeminiJsonResult<T> =
  | {
      ok: true;
      data: T;
      model: string;
      warnings: string[];
    }
  | {
      ok: false;
      reason:
        | "disabled"
        | "missing_api_key"
        | "request_failed"
        | "invalid_response"
        | "invalid_json";
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

export async function generateGeminiJson<T>(
  prompt: string
): Promise<GeminiJsonResult<T>> {
  const model = getGeminiModel();

  if (process.env.AI_NEWS_ENABLED?.trim().toLowerCase() === "false") {
    return {
      ok: false,
      reason: "disabled",
      model,
      warnings: ["AI_NEWS_ENABLED=false จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
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
      console.warn("Gemini news draft request failed", {
        providerStatus: response.status,
      });
      return {
        ok: false,
        reason: "request_failed",
        model,
        warnings: ["Gemini ไม่พร้อมใช้งาน จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
      };
    }

    const json = (await response.json().catch(() => null)) as
      | GeminiGenerateContentResponse
      | null;
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      return {
        ok: false,
        reason: "invalid_response",
        model,
        warnings: ["Gemini ไม่ได้ส่งข้อความกลับมา จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
      };
    }

    try {
      return {
        ok: true,
        data: JSON.parse(stripJsonFence(text)) as T,
        model,
        warnings: [],
      };
    } catch {
      return {
        ok: false,
        reason: "invalid_json",
        model,
        warnings: ["Gemini ส่ง JSON ไม่ถูกต้อง จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
      };
    }
  } catch (error) {
    console.warn("Gemini news draft request error", {
      reason: error instanceof Error ? error.name : "unknown_error",
    });
    return {
      ok: false,
      reason: "request_failed",
      model,
      warnings: ["Gemini ไม่พร้อมใช้งาน จึงใช้ตัวอย่างจากข้อมูลที่กรอกโดยตรง"],
    };
  }
}
