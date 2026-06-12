import "server-only";

import { generateGeminiJson } from "@/lib/ai/gemini";
import type { ParsedLineNewsForm } from "@/lib/line/newsFormParser";

export type NewsDraftAiOutput = {
  title: string;
  excerpt: string;
  content: string;
  content_html: string;
  category: string;
  image_alt: string;
  missingFields: string[];
  warnings: string[];
  source: "gemini" | "fallback";
  model?: string;
  fallbackReason?: string;
  aiCalled?: boolean;
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

function fallbackOutput(
  draft: ParsedLineNewsForm,
  warning: string,
  model?: string,
  fallbackReason?: string
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
  model: string
): NewsDraftAiOutput {
  const content = limitText(
    (value.content || draft.content).trim() || draft.content,
    3000
  );
  const excerpt =
    limitText((value.excerpt || draft.excerpt).trim(), 300) ||
    limitText(content.replace(/\n+/g, " "), 180);

  return {
    title: limitText((value.title || draft.title).trim() || draft.title, 180),
    excerpt,
    content,
    content_html: sanitizeGeminiHtml(value.content_html || "", content),
    category: (value.category || draft.category).trim() || draft.category,
    image_alt: (value.image_alt || draft.title).trim() || draft.title,
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
  };
}

function buildPrompt(draft: ParsedLineNewsForm) {
  return [
    "คุณคือผู้ช่วยเรียบเรียงข่าวประชาสัมพันธ์ภาษาไทยของสาขาวิชาในมหาวิทยาลัย",
    "ตอบกลับเป็น JSON เท่านั้น ตาม schema: {\"title\":\"\",\"excerpt\":\"\",\"content\":\"\",\"content_html\":\"\",\"category\":\"\",\"image_alt\":\"\",\"missingFields\":[],\"warnings\":[]}",
    "ข้อกำหนด:",
    "- ใช้ภาษาไทย สุภาพ เป็นทางการ อ่านง่าย เหมาะกับประชาสัมพันธ์มหาวิทยาลัย/สาขาวิชา",
    "- ใช้เฉพาะข้อเท็จจริงที่ผู้ดูแลให้มาเท่านั้น",
    "- ห้ามแต่งวันที่ สถานที่ ชื่อบุคคล ผู้จัด ตารางเวลา ลิงก์ ตัวเลข หรือข้อกล่าวอ้างเพิ่มเติม",
    "- ถ้าข้อมูลสำคัญขาด ให้ใส่ชื่อฟิลด์ใน missingFields แต่อย่าแต่งเติมเอง",
    "- ปรับถ้อยคำโดยรักษาความหมายเดิม",
    "- title กระชับ",
    "- excerpt คือ สรุปสั้น ถ้าผู้ดูแลเว้นว่างให้สรุปจากรายละเอียดที่มี",
    "- content_html ใช้ HTML ปลอดภัยแบบ paragraph เท่านั้น เช่น <p>...</p>",
    "- ห้ามใส่ script, iframe, external embed หรือ HTML อันตราย",
    "- ห้ามใช้คำว่า คำโปรย ในข้อความที่ส่งกลับ",
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
  const result = await generateGeminiJson<Partial<NewsDraftAiOutput>>(
    buildPrompt(draft)
  );

  if (!result.ok) {
    return fallbackOutput(
      draft,
      "AI ไม่พร้อมใช้งานชั่วคราว ระบบจะแสดงตัวอย่างจากข้อมูลที่กรอกโดยตรง",
      result.model,
      result.reason
    );
  }

  return normalizeGeminiOutput(result.data, draft, result.model);
}
