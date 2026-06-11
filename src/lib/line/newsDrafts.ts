import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { NewsCreatePayload } from "@/lib/news/service";
import type { NewsDraftAiOutput } from "@/lib/line/newsGeminiDraft";
import type { ParsedLineNewsForm } from "@/lib/line/newsFormParser";
import type { LineNewsDraft } from "@/types";

export const LINE_NEWS_PREVIEW_FOOTER = [
  'พิมพ์ "ยืนยันเผยแพร่" เพื่อเผยแพร่',
  'พิมพ์ "ยกเลิกข่าว" เพื่อยกเลิก',
  'พิมพ์ "แก้ข่าว: ..." เพื่อแก้ไข',
].join("\n");

export function buildLineNewsPreview(
  draft: ParsedLineNewsForm,
  aiOutput?: NewsDraftAiOutput,
  options: { hasCoverImage?: boolean } = {}
) {
  const previewTitle = aiOutput?.title || draft.title;
  const previewCategory = aiOutput?.category || draft.category;
  const previewExcerpt = aiOutput?.excerpt || draft.excerpt || "-";
  const previewContent = aiOutput?.content || draft.content;
  const aiFallbackNote =
    aiOutput?.source === "fallback"
      ? [
          "",
          "AI ไม่พร้อมใช้งานชั่วคราว ระบบจะแสดงตัวอย่างจากข้อมูลที่กรอกโดยตรง",
        ]
      : [];

  return [
    "ตัวอย่างข่าวก่อนเผยแพร่",
    "",
    `หัวข้อ: ${previewTitle}`,
    `หมวดหมู่: ${previewCategory}`,
    `สถานะ: ${draft.status === "published" ? "เผยแพร่" : "ฉบับร่าง"}`,
    `ข่าวเด่น: ${draft.isFeatured ? "ใช่" : "ไม่"}`,
    `สรุปสั้น: ${previewExcerpt}`,
    "",
    "เนื้อหา:",
    previewContent,
    "",
    `รูปปก: ${options.hasCoverImage ? "มีรูปแล้ว ✅" : "ไม่มีรูป"}`,
    ...aiFallbackNote,
    "",
    LINE_NEWS_PREVIEW_FOOTER,
  ].join("\n");
}

export async function replaceActiveLineNewsDraft(input: {
  userId: string;
  lineUserId: string;
  rawText: string;
  draft: ParsedLineNewsForm;
  aiOutput: NewsDraftAiOutput;
  previewText: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  await admin
    .from("line_news_drafts")
    .update({
      status: "cancelled",
      cancelled_at: now,
      updated_at: now,
    })
    .eq("user_id", input.userId)
    .in("status", ["pending", "previewed"]);

  const { data, error } = await admin
    .from("line_news_drafts")
    .insert({
      user_id: input.userId,
      line_user_id: input.lineUserId,
      status: "previewed",
      raw_text: input.rawText,
      parsed_title: input.aiOutput.title,
      parsed_category: input.aiOutput.category,
      parsed_excerpt: input.aiOutput.excerpt || null,
      parsed_content: input.aiOutput.content,
      parsed_status: input.draft.status,
      parsed_is_featured: input.draft.isFeatured,
      parsed_published_at: input.draft.publishedAt,
      parsed_notes_for_ai: input.draft.notesForAi || null,
      cover_image_url: input.coverImageUrl || null,
      cover_image_alt:
        input.coverImageUrl && input.coverImageAlt
          ? input.coverImageAlt
          : input.coverImageUrl
            ? input.aiOutput.image_alt || null
            : null,
      ai_output_json: input.aiOutput,
      preview_text: input.previewText,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error("line_news_draft_create_failed");
  }

  return data;
}

export async function upsertLineNewsDraftCoverImage(input: {
  userId: string;
  lineUserId: string;
  imageUrl: string;
  imageAlt?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: activeDraft, error: activeError } = await admin
    .from("line_news_drafts")
    .select("*")
    .eq("line_user_id", input.lineUserId)
    .in("status", ["pending", "previewed"])
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<LineNewsDraft>();

  if (activeError) {
    throw new Error("line_news_draft_load_failed");
  }

  if (activeDraft) {
    const existingContentImages = Array.isArray(activeDraft.content_image_urls)
      ? activeDraft.content_image_urls
      : [];
    const nextContentImages = activeDraft.cover_image_url
      ? Array.from(new Set([...existingContentImages, input.imageUrl]))
      : existingContentImages;
    const nextPreviewText = activeDraft.preview_text
      ? activeDraft.preview_text.replace("รูปปก: ไม่มีรูป", "รูปปก: มีรูปแล้ว ✅")
      : activeDraft.preview_text;

    const { data, error } = await admin
      .from("line_news_drafts")
      .update({
        cover_image_url: activeDraft.cover_image_url || input.imageUrl,
        cover_image_alt:
          activeDraft.cover_image_alt ||
          input.imageAlt ||
          activeDraft.parsed_title ||
          null,
        content_image_urls: nextContentImages,
        preview_text: nextPreviewText,
        updated_at: now,
      })
      .eq("id", activeDraft.id)
      .select("*")
      .single<LineNewsDraft>();

    if (error || !data) {
      throw new Error("line_news_draft_cover_update_failed");
    }

    return { draft: data, created: false };
  }

  const { data, error } = await admin
    .from("line_news_drafts")
    .insert({
      user_id: input.userId,
      line_user_id: input.lineUserId,
      status: "pending",
      cover_image_url: input.imageUrl,
      cover_image_alt: input.imageAlt || null,
      ai_output_json: {},
    })
    .select("*")
    .single<LineNewsDraft>();

  if (error || !data) {
    throw new Error("line_news_draft_cover_create_failed");
  }

  return { draft: data, created: true };
}

export async function getLatestActiveLineNewsDraft(
  lineUserId: string,
  options: { includePublished?: boolean } = {}
) {
  const statuses = options.includePublished
    ? ["pending", "previewed", "published"]
    : ["pending", "previewed"];
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("line_news_drafts")
    .select("*")
    .eq("line_user_id", lineUserId)
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<LineNewsDraft>();

  if (error) {
    throw new Error("line_news_draft_load_failed");
  }

  return data;
}

export async function markLineNewsDraftExpired(draftId: string) {
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  await admin
    .from("line_news_drafts")
    .update({
      status: "expired",
      updated_at: now,
    })
    .eq("id", draftId)
    .in("status", ["pending", "previewed"]);
}

export async function cancelLineNewsDraft(draftId: string) {
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("line_news_drafts")
    .update({
      status: "cancelled",
      cancelled_at: now,
      updated_at: now,
    })
    .eq("id", draftId)
    .in("status", ["pending", "previewed"]);

  if (error) {
    throw new Error("line_news_draft_cancel_failed");
  }
}

export async function markLineNewsDraftPublished(
  draftId: string,
  newsId: string
) {
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("line_news_drafts")
    .update({
      status: "published",
      published_news_id: newsId,
      confirmed_at: now,
      published_at: now,
      updated_at: now,
    })
    .eq("id", draftId)
    .in("status", ["pending", "previewed"]);

  if (error) {
    throw new Error("line_news_draft_publish_mark_failed");
  }
}

export async function claimLineNewsDraftForPublish(draftId: string) {
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("line_news_drafts")
    .update({
      confirmed_at: now,
      updated_at: now,
    })
    .eq("id", draftId)
    .is("confirmed_at", null)
    .in("status", ["pending", "previewed"])
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error("line_news_draft_publish_claim_failed");
  }

  return Boolean(data?.id);
}

export async function clearLineNewsDraftPublishClaim(draftId: string) {
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  await admin
    .from("line_news_drafts")
    .update({
      confirmed_at: null,
      updated_at: now,
    })
    .eq("id", draftId)
    .in("status", ["pending", "previewed"]);
}

export async function appendLineNewsDraftEdit(
  draft: LineNewsDraft,
  editText: string
) {
  const now = new Date().toISOString();
  const nextNotes = [draft.parsed_notes_for_ai, `แก้ข่าว: ${editText}`]
    .filter(Boolean)
    .join("\n");
  const nextRawText = [draft.raw_text, `แก้ข่าว: ${editText}`]
    .filter(Boolean)
    .join("\n\n");
  const nextPreviewText = [
    draft.preview_text || buildPreviewFromStoredDraft(draft),
    "",
    `หมายเหตุแก้ไขล่าสุด: ${editText}`,
    "",
    "ระบบบันทึกหมายเหตุแก้ไขแล้ว แต่รอบนี้ยังไม่เรียบเรียงใหม่อัตโนมัติ",
  ].join("\n");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("line_news_drafts")
    .update({
      raw_text: nextRawText,
      parsed_notes_for_ai: nextNotes,
      preview_text: nextPreviewText,
      updated_at: now,
    })
    .eq("id", draft.id)
    .in("status", ["pending", "previewed"])
    .select("*")
    .single<LineNewsDraft>();

  if (error || !data) {
    throw new Error("line_news_draft_edit_failed");
  }

  return data;
}

export function isLineNewsDraftExpired(draft: LineNewsDraft) {
  return new Date(draft.expires_at).getTime() <= Date.now();
}

function getAiString(
  aiOutput: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = aiOutput?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function lineNewsDraftToNewsPayload(
  draft: LineNewsDraft,
  authorName: string | null | undefined
): NewsCreatePayload {
  const aiOutput = draft.ai_output_json;
  const imageUrl = draft.cover_image_url?.trim() || null;

  return {
    title: draft.parsed_title || getAiString(aiOutput, "title"),
    excerpt: draft.parsed_excerpt || getAiString(aiOutput, "excerpt"),
    content: draft.parsed_content || getAiString(aiOutput, "content"),
    content_html: getAiString(aiOutput, "content_html") || null,
    category: draft.parsed_category || getAiString(aiOutput, "category"),
    status:
      draft.parsed_status === "draft" || draft.parsed_status === "published"
        ? draft.parsed_status
        : "published",
    published_at: draft.parsed_published_at,
    is_featured: draft.parsed_is_featured === true,
    image_url: imageUrl,
    image_alt: imageUrl
      ? draft.cover_image_alt ||
        getAiString(aiOutput, "image_alt") ||
        draft.parsed_title ||
        getAiString(aiOutput, "title")
      : null,
    image_crop_settings: {},
    author_name: authorName,
  };
}

export function hasPublishableLineNewsDraftFields(draft: LineNewsDraft) {
  const payload = lineNewsDraftToNewsPayload(draft, null);
  return Boolean(payload.title && (payload.content || payload.content_html));
}

export function buildPreviewFromStoredDraft(draft: LineNewsDraft) {
  return [
    "ตัวอย่างข่าวก่อนเผยแพร่",
    "",
    `หัวข้อ: ${draft.parsed_title || "-"}`,
    `หมวดหมู่: ${draft.parsed_category || "-"}`,
    `สถานะ: ${draft.parsed_status === "draft" ? "ฉบับร่าง" : "เผยแพร่"}`,
    `ข่าวเด่น: ${draft.parsed_is_featured ? "ใช่" : "ไม่"}`,
    `สรุปสั้น: ${draft.parsed_excerpt || "-"}`,
    "",
    "เนื้อหา:",
    draft.parsed_content || "-",
    "",
    `รูปปก: ${draft.cover_image_url ? "มีรูปแล้ว ✅" : "ไม่มีรูป"}`,
    "",
    LINE_NEWS_PREVIEW_FOOTER,
  ].join("\n");
}
