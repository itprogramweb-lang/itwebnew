import "server-only";

import { generateGeminiJson } from "@/lib/ai/gemini";
import type { ParsedLineNewsForm } from "@/lib/line/newsFormParser";

const LINE_NEWS_GEMINI_MAX_OUTPUT_TOKENS = 3072;
const LINE_NEWS_GEMINI_RETRY_MAX_OUTPUT_TOKENS = 4096;

export type NewsDraftAiOutput = {
  title: string;
  excerpt: string;
  content: string;
  content_html: string;
  category: string;
  image_alt: string;
  missingFields: string[];
  warnings: string[];
  source: "gemini" | "gemini_text" | "fallback";
  model?: string;
  fallbackReason?: string;
  aiCalled?: boolean;
  jsonParseOk?: boolean;
  parseStage?:
    | "direct_json"
    | "fenced_json"
    | "extracted_json"
    | "plain_text"
    | "malformed_json"
    | "truncated_json"
    | "failed";
};

function limitText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function plainTextToSafeHtml(value: string) {
  return value
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function sanitizeGeminiHtml(value: string, fallbackText: string) {
  const html = value.trim();
  if (!html) return plainTextToSafeHtml(fallbackText);
  if (/<\s*(script|iframe|object|embed|link|style|meta)\b/i.test(html)) {
    return plainTextToSafeHtml(fallbackText);
  }
  if (/\son\w+\s*=/i.test(html)) {
    return plainTextToSafeHtml(fallbackText);
  }
  return html.length > 6000 ? plainTextToSafeHtml(fallbackText) : html;
}

function getGeminiString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fallbackOutput(
  draft: ParsedLineNewsForm,
  warning: string,
  model?: string,
  fallbackReason?: string,
  parseStage?: NewsDraftAiOutput["parseStage"]
): NewsDraftAiOutput {
  const excerpt =
    draft.excerpt.trim() || limitText(draft.content.replace(/\n+/g, " "), 180);

  return {
    title: draft.title,
    excerpt,
    content: draft.content,
    content_html: plainTextToSafeHtml(draft.content),
    category: draft.category,
    image_alt: draft.title,
    missingFields: [],
    warnings: [warning, ...draft.warnings],
    source: "fallback",
    model,
    fallbackReason,
    aiCalled: fallbackReason?.startsWith("gemini_") ?? false,
    jsonParseOk: fallbackReason?.startsWith("gemini_") ? false : undefined,
    parseStage,
  };
}

export function generateLineNewsFallbackDraft(
  draft: ParsedLineNewsForm,
  warning: string,
  fallbackReason?: string
): NewsDraftAiOutput {
  return fallbackOutput(draft, warning, undefined, fallbackReason);
}

function normalizeGeminiOutput(
  value: Partial<NewsDraftAiOutput>,
  draft: ParsedLineNewsForm,
  model: string,
  parseStage: NewsDraftAiOutput["parseStage"]
): NewsDraftAiOutput {
  const aiTitle = getGeminiString(value.title);
  const aiExcerpt = getGeminiString(value.excerpt);
  const aiContent = getGeminiString(value.content);
  const aiContentHtml = getGeminiString(value.content_html);
  const aiCategory = getGeminiString(value.category);
  const aiImageAlt = getGeminiString(value.image_alt);
  const content = limitText(aiContent || draft.content, 500);
  const excerpt =
    limitText(aiExcerpt || draft.excerpt, 300) ||
    limitText(content.replace(/\n+/g, " "), 180);

  return {
    title: limitText(aiTitle || draft.title, 180),
    excerpt,
    content,
    content_html: sanitizeGeminiHtml(aiContentHtml, content),
    category: aiCategory || draft.category,
    image_alt: aiImageAlt || draft.title,
    missingFields: Array.isArray(value.missingFields)
      ? value.missingFields.filter((item): item is string => typeof item === "string")
      : [],
    warnings: [
      ...(Array.isArray(value.warnings)
        ? value.warnings.filter((item): item is string => typeof item === "string")
        : []),
      ...draft.warnings,
    ],
    source: "gemini",
    model,
    aiCalled: true,
    jsonParseOk: true,
    parseStage,
  };
}

function normalizeGeminiTextOutput(
  text: string,
  draft: ParsedLineNewsForm,
  model: string
): NewsDraftAiOutput {
  const content = limitText(text, 500);
  const excerpt =
    limitText(draft.excerpt, 300) ||
    limitText(content.replace(/\n+/g, " "), 180);

  return {
    title: draft.title,
    excerpt,
    content,
    content_html: plainTextToSafeHtml(content),
    category: draft.category,
    image_alt: draft.title,
    missingFields: [],
    warnings: draft.warnings,
    source: "gemini_text",
    model,
    aiCalled: true,
    jsonParseOk: false,
    parseStage: "plain_text",
  };
}

function buildPrompt(draft: ParsedLineNewsForm, options: { retry?: boolean } = {}) {
  return [
    "คุณคือผู้ช่วยเรียบเรียงข่าวประชาสัมพันธ์ภาษาไทยของสาขาวิชาในมหาวิทยาลัย",
    options.retry
      ? "รอบนี้ต้องตอบ JSON object สั้นมากเท่านั้น ห้ามมี Markdown ห้ามมี code fence ห้ามมีคำอธิบายก่อนหรือหลัง JSON"
      : "ให้ตอบกลับเป็น JSON object เท่านั้นเป็นลำดับแรก ห้ามมี Markdown ห้ามมี code fence ห้ามมีคำอธิบายก่อนหรือหลัง JSON",
    "ถ้าไม่สามารถตอบเป็น JSON ได้ ให้ตอบเฉพาะเนื้อหาข่าวที่เรียบเรียงแล้วเท่านั้น ไม่ต้องมีหัวข้อหรือคำอธิบายประกอบ",
    "schema ที่ต้องใช้: {\"title\":\"\",\"excerpt\":\"\",\"content\":\"\",\"category\":\"\",\"image_alt\":\"\",\"missingFields\":[],\"warnings\":[]}",
    "ข้อกำหนด:",
    "- ใช้ภาษาไทย สุภาพ เป็นทางการ อ่านง่าย เหมาะกับประชาสัมพันธ์มหาวิทยาลัย/สาขาวิชา",
    "- ใช้เฉพาะข้อเท็จจริงที่ผู้ดูแลให้มาเท่านั้น",
    "- ห้ามแต่งวันที่ สถานที่ ชื่อบุคคล ผู้จัด ตารางเวลา ลิงก์ ตัวเลข หรือข้อกล่าวอ้างเพิ่มเติม",
    "- ถ้าข้อมูลสำคัญขาด ให้ใส่ชื่อฟิลด์ใน missingFields แต่อย่าแต่งเติมเอง",
    "- ปรับถ้อยคำโดยรักษาความหมายเดิม",
    "- title ยาวไม่เกิน 80 ตัวอักษร",
    "- excerpt คือ สรุปสั้น ยาวไม่เกิน 120 ตัวอักษร และเป็นหนึ่งประโยคสมบูรณ์",
    "- content เป็นเนื้อหาข่าว 1 ย่อหน้าสั้น ไม่เกิน 500 ตัวอักษร",
    "- ไม่ต้องส่ง content_html ระบบจะสร้าง HTML ปลอดภัยจาก content เอง",
    "- ห้ามใช้คำว่า คำโปรย ในข้อความที่ส่งกลับ",
    "- ถ้าไม่แน่ใจ ให้คงข้อความเดิมจากผู้ดูแลและใส่คำเตือนใน warnings",
    "",
    "ข้อมูลจากผู้ดูแล:",
    JSON.stringify({
      title: draft.title,
      category: draft.category,
      excerpt: draft.excerpt,
      content: draft.content,
      notesForAi: draft.notesForAi,
    }),
  ].join("\n");
}

export async function generateLineNewsAiDraft(
  draft: ParsedLineNewsForm
): Promise<NewsDraftAiOutput> {
  let result = await generateGeminiJson<Partial<NewsDraftAiOutput>>(
    buildPrompt(draft),
    { maxOutputTokens: LINE_NEWS_GEMINI_MAX_OUTPUT_TOKENS }
  );

  if (!result.ok && result.reason === "gemini_max_tokens") {
    result = await generateGeminiJson<Partial<NewsDraftAiOutput>>(
      buildPrompt(draft, { retry: true }),
      { maxOutputTokens: LINE_NEWS_GEMINI_RETRY_MAX_OUTPUT_TOKENS }
    );
  }

  if (!result.ok) {
    return fallbackOutput(
      draft,
      "AI ไม่พร้อมใช้งานชั่วคราว ระบบจะแสดงตัวอย่างจากข้อมูลที่กรอกโดยตรง",
      result.model,
      result.reason,
      result.reason === "gemini_malformed_json"
        ? "malformed_json"
        : result.reason === "gemini_truncated_json" || result.reason === "gemini_max_tokens"
          ? "truncated_json"
          : undefined
    );
  }

  if (result.source === "text") {
    return normalizeGeminiTextOutput(result.text, draft, result.model);
  }

  return normalizeGeminiOutput(result.data, draft, result.model, result.parseStage);
}
