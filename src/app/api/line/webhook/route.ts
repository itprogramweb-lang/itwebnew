import { NextRequest, NextResponse } from "next/server";
import {
  looksLikeFullNewsForm,
  parseLineNewsForm,
} from "@/lib/line/newsFormParser";
import {
  buildLineNewsPreview,
  appendLineNewsDraftEdit,
  cancelLineNewsDraft,
  claimLineNewsDraftForPublish,
  clearLineNewsDraftPublishClaim,
  getLatestActiveLineNewsDraft,
  hasPublishableLineNewsDraftFields,
  isLineNewsDraftExpired,
  lineNewsDraftToNewsPayload,
  markLineNewsDraftExpired,
  markLineNewsDraftPublished,
  replaceActiveLineNewsDraft,
  upsertLineNewsDraftCoverImage,
} from "@/lib/line/newsDrafts";
import { downloadLineMessageContent } from "@/lib/line/content";
import {
  checkLineNewsAiDailyLimit,
  logLineNewsAiUsage,
} from "@/lib/line/aiUsage";
import {
  uploadLineNewsCoverImage,
  validateLineNewsImage,
} from "@/lib/line/newsImageUpload";
import {
  generateLineNewsAiDraft,
  generateLineNewsFallbackDraft,
} from "@/lib/line/newsGeminiDraft";
import { resolveLineNewsManager } from "@/lib/line/permissions";
import { replyLineTextMessage } from "@/lib/line/reply";
import { recordLineWebhookEvent } from "@/lib/line/webhookEvents";
import {
  buildPublicNewsUrl,
  createNewsItem,
  getNewsUrlById,
} from "@/lib/news/service";
import {
  parseLineWebhookPayload,
  verifyLineSignature,
  type LineWebhookEvent,
} from "@/lib/line/webhook";

const NOT_LINKED_REPLY = [
  "บัญชี LINE นี้ยังไม่ได้เชื่อมกับบัญชีผู้ดูแลเว็บไซต์",
  "กรุณาเข้าสู่ระบบแดชบอร์ดแล้วเชื่อม LINE ก่อนใช้งานคำสั่งสร้างข่าว",
].join("\n");

const FORBIDDEN_REPLY = [
  "บัญชีนี้ไม่มีสิทธิ์สร้างหรือเผยแพร่ข่าวผ่าน LINE",
  "กรุณาติดต่อผู้ดูแลระบบ",
].join("\n");

const NEWS_FORM_HELP_REPLY = [
  " สร้างข่าวผ่าน LINE OA",
  "",
  "กรอกฟอร์มด้านล่าง แล้วส่งกลับมาได้เลยครับ ✨",
  "✅ จำเป็นต้องกรอก: หัวข้อ, รายละเอียด",
  "",
  "⚠️ กรุณาอย่าเปลี่ยนชื่อช่อง เช่น “หัวข้อ:”, “รายละเอียด:”, “สถานะ:”",
  "หากเปลี่ยนชื่อช่องหรือกรอกค่าผิด ระบบอาจสร้างข่าวไม่สำเร็จครับ",
  "",
  " ตัวเลือกที่ใช้ได้",
  "หมวดหมู่: ประกาศ / รับสมัคร / กิจกรรม / ทุน / ความสำเร็จ",
  "สถานะ: เผยแพร่ / ฉบับร่าง",
  "ข่าวเด่น: ใช่ / ไม่",
  "รูปปก: ไม่มีรูป / ใช้รูปที่แนบ",
  "",
  "━━━━━━━━━━━━━━",
  "สร้างข่าว",
  "หัวข้อ:",
  "หมวดหมู่: ประกาศ",
  "วันที่เผยแพร่: ตอนนี้",
  "สรุปสั้น:",
  "รายละเอียด:",
  "รูปปก: ไม่มีรูป",
  "สถานะ: ฉบับร่าง",
  "ข่าวเด่น: ไม่",
  "หมายเหตุสำหรับ AI:",
  "━━━━━━━━━━━━━━",
  "",
  "️ วิธีแนบรูปปก:",
  "ถ้ามีรูป ให้ส่งรูปมาพร้อมฟอร์มนี้ แล้วเปลี่ยนเป็น",
  "รูปปก: ใช้รูปที่แนบ",
  "",
  " AI จะช่วยเรียบเรียงจากข้อมูลที่กรอกเท่านั้น และจะไม่แต่งข้อมูลใหม่เอง",
].join("\n");

const READY_REPLY = [
  "ระบบ LINE สำหรับผู้ดูแลเว็บไซต์พร้อมใช้งาน",
  "",
  "คำสั่งที่รองรับตอนนี้:",
  "",
  "* สร้างข่าว",
  "* จัดข่าว",
  "* /news",
].join("\n");

const CONFIRM_COMMAND = "ยืนยันเผยแพร่";
const CANCEL_COMMAND = "ยกเลิกข่าว";
const EDIT_PREFIX = "แก้ข่าว:";

type AuthorizedLineNewsPermission = Extract<
  Awaited<ReturnType<typeof resolveLineNewsManager>>,
  { status: "authorized" }
>;

function isNewsCommand(text: string) {
  const trimmed = text.trim();
  return (
    trimmed.startsWith("สร้างข่าว") ||
    trimmed.startsWith("จัดข่าว") ||
    trimmed.startsWith("/news")
  );
}

function isConfirmCommand(text: string) {
  return text.trim() === CONFIRM_COMMAND;
}

function isCancelCommand(text: string) {
  return text.trim() === CANCEL_COMMAND;
}

function getEditText(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith(EDIT_PREFIX)) return null;
  return trimmed.slice(EDIT_PREFIX.length).trim();
}

async function safeReply(replyToken: string | undefined, text: string) {
  if (!replyToken) return;

  const result = await replyLineTextMessage(replyToken, text);
  if (result.status !== "sent") {
    console.warn("LINE webhook reply skipped or failed", {
      status: result.status,
      reason: "reason" in result ? result.reason : undefined,
      providerStatus: "providerStatus" in result ? result.providerStatus : undefined,
    });
  }
}

function buildMissingFieldsReply(missingFields: string[]) {
  return [
    `กรุณากรอกข้อมูลที่จำเป็นให้ครบ: ${missingFields.join(", ")}`,
    "",
    "ส่งฟอร์มใหม่โดยใช้รูปแบบ:",
    "สร้างข่าว",
    "หัวข้อ:",
    "รายละเอียด:",
  ].join("\n");
}

function logLineNewsAi(details: Record<string, unknown>) {
  console.warn("[line-news-ai] usage", details);
}

async function handleConfirmCommand(
  event: LineWebhookEvent,
  permission: AuthorizedLineNewsPermission
) {
  const draft = await getLatestActiveLineNewsDraft(permission.lineUserId, {
    includePublished: true,
  });

  if (!draft) {
    await safeReply(
      event.replyToken,
      "ยังไม่มีข่าวที่รอเผยแพร่ กรุณาส่งฟอร์มสร้างข่าวก่อนครับ"
    );
    return;
  }

  if (draft.status === "published" || draft.published_news_id) {
    const existingUrl = draft.published_news_id
      ? await getNewsUrlById(draft.published_news_id)
      : null;
    await safeReply(
      event.replyToken,
      ["ข่าวนี้เผยแพร่แล้วครับ ✅", existingUrl ? `ลิงก์: ${existingUrl}` : null]
        .filter(Boolean)
        .join("\n")
    );
    return;
  }

  if (isLineNewsDraftExpired(draft)) {
    await markLineNewsDraftExpired(draft.id);
    await safeReply(
      event.replyToken,
      "แบบร่างข่าวนี้หมดอายุแล้ว กรุณาส่งฟอร์มสร้างข่าวใหม่อีกครั้ง"
    );
    return;
  }

  if (!hasPublishableLineNewsDraftFields(draft)) {
    await safeReply(
      event.replyToken,
      "ข้อมูลข่าวยังไม่ครบ กรุณาตรวจสอบหัวข้อและรายละเอียดอีกครั้ง"
    );
    return;
  }

  const claimed = await claimLineNewsDraftForPublish(draft.id);
  if (!claimed) {
    const latestDraft = await getLatestActiveLineNewsDraft(permission.lineUserId, {
      includePublished: true,
    });
    const existingUrl = latestDraft?.published_news_id
      ? await getNewsUrlById(latestDraft.published_news_id)
      : null;
    await safeReply(
      event.replyToken,
      existingUrl
        ? ["ข่าวนี้เผยแพร่แล้วครับ ✅", `ลิงก์: ${existingUrl}`].join("\n")
        : "ระบบกำลังเผยแพร่ข่าวนี้อยู่ กรุณารอสักครู่ครับ"
    );
    return;
  }

  const authorName = permission.profile.full_name || permission.profile.email;
  const createResult = await createNewsItem(
    lineNewsDraftToNewsPayload(draft, authorName)
  );

  if (!createResult.ok) {
    await clearLineNewsDraftPublishClaim(draft.id);
    const message =
      createResult.reason === "featured_limit"
        ? "ไม่สามารถเผยแพร่ข่าวเด่นได้ เนื่องจากข่าวเด่นครบจำนวนที่กำหนดแล้ว"
        : "ยังไม่สามารถเผยแพร่ข่าวจาก LINE ได้ในขณะนี้";
    await safeReply(event.replyToken, message);
    return;
  }

  try {
    await markLineNewsDraftPublished(draft.id, createResult.news.id);
  } catch (error) {
    console.warn("LINE news draft publish mark failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
      newsId: createResult.news.id,
    });
  }

  if (createResult.news.status === "published") {
    await safeReply(
      event.replyToken,
      [
        "เผยแพร่ข่าวเรียบร้อยแล้วครับ ✅",
        "",
        `หัวข้อ: ${createResult.news.title}`,
        `ลิงก์: ${buildPublicNewsUrl(createResult.news.slug || createResult.news.id)}`,
      ].join("\n")
    );
    return;
  }

  await safeReply(
    event.replyToken,
    [
      "บันทึกเป็นฉบับร่างเรียบร้อยแล้วครับ ✅",
      "",
      `หัวข้อ: ${createResult.news.title}`,
      "ลิงก์สำหรับตรวจสอบในระบบ: /dashboard/news",
    ].join("\n")
  );
}

async function handleImageMessageEvent(event: LineWebhookEvent) {
  const lineUserId = event.source?.userId;
  const messageId = event.message?.id;

  const permission = await resolveLineNewsManager(lineUserId);
  if (permission.status === "not_linked") {
    await safeReply(event.replyToken, NOT_LINKED_REPLY);
    return;
  }

  if (permission.status === "forbidden") {
    await safeReply(event.replyToken, FORBIDDEN_REPLY);
    return;
  }

  if (!messageId) {
    await safeReply(
      event.replyToken,
      "ยังไม่สามารถอ่านรูปจาก LINE ได้ กรุณาลองส่งรูปใหม่อีกครั้ง"
    );
    return;
  }

  const downloaded = await downloadLineMessageContent(messageId);
  if (!downloaded.ok) {
    console.warn("LINE image download failed", {
      reason: downloaded.reason,
      providerStatus: downloaded.providerStatus,
    });
    await safeReply(
      event.replyToken,
      "ยังไม่สามารถอ่านรูปจาก LINE ได้ กรุณาลองส่งรูปใหม่อีกครั้ง"
    );
    return;
  }

  const validation = validateLineNewsImage({
    contentType: downloaded.contentType,
    size: downloaded.size,
  });

  if (!validation.ok) {
    await safeReply(
      event.replyToken,
      validation.reason === "too_large"
        ? "รูปมีขนาดใหญ่เกินไป กรุณาส่งรูปที่มีขนาดไม่เกิน 5MB"
        : "รองรับเฉพาะรูปภาพ JPG, PNG หรือ WebP เท่านั้นครับ"
    );
    return;
  }

  let uploadResult;
  try {
    uploadResult = await uploadLineNewsCoverImage(downloaded.buffer);
  } catch (error) {
    console.warn("LINE news cover upload failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    await safeReply(
      event.replyToken,
      "อัปโหลดรูปไม่สำเร็จ กรุณาลองส่งรูปใหม่อีกครั้ง"
    );
    return;
  }

  try {
    const result = await upsertLineNewsDraftCoverImage({
      userId: permission.profile.id,
      lineUserId: permission.lineUserId,
      imageUrl: uploadResult.secure_url,
    });

    await safeReply(
      event.replyToken,
      result.created
        ? [
            "ได้รับรูปแล้วครับ ✅",
            "ระบบจะใช้รูปนี้เป็นรูปปกของข่าว",
            "กรุณาส่งฟอร์มสร้างข่าวต่อได้เลย",
          ].join("\n")
        : [
            "ได้รับรูปแล้วครับ ✅",
            "ระบบใช้รูปนี้เป็นรูปปกของข่าวแล้ว",
            "",
            'พิมพ์ "ยืนยันเผยแพร่" เพื่อเผยแพร่',
            "หรือส่งฟอร์มสร้างข่าวใหม่หากต้องการแก้ไขข้อมูล",
          ].join("\n")
    );
  } catch (error) {
    console.warn("LINE news cover draft update failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    await safeReply(
      event.replyToken,
      "ยังไม่สามารถบันทึกรูปปกของข่าวได้ในขณะนี้"
    );
  }
}

async function handleDuplicateImageMessageEvent(event: LineWebhookEvent) {
  const permission = await resolveLineNewsManager(event.source?.userId);
  if (permission.status === "not_linked") {
    await safeReply(event.replyToken, NOT_LINKED_REPLY);
    return;
  }

  if (permission.status === "forbidden") {
    await safeReply(event.replyToken, FORBIDDEN_REPLY);
    return;
  }

  await safeReply(
    event.replyToken,
    [
      "ได้รับรูปนี้แล้วครับ ✅",
      "ระบบจะไม่อัปโหลดรูปซ้ำ",
      "",
      'พิมพ์ "ยืนยันเผยแพร่" เพื่อเผยแพร่',
      "หรือส่งฟอร์มสร้างข่าวใหม่หากต้องการแก้ไขข้อมูล",
    ].join("\n")
  );
}

async function handleCancelCommand(event: LineWebhookEvent, lineUserId: string) {
  const draft = await getLatestActiveLineNewsDraft(lineUserId);

  if (!draft) {
    await safeReply(event.replyToken, "ไม่มีแบบร่างข่าวที่ต้องยกเลิกครับ");
    return;
  }

  if (isLineNewsDraftExpired(draft)) {
    await markLineNewsDraftExpired(draft.id);
    await safeReply(event.replyToken, "แบบร่างข่าวนี้หมดอายุแล้วครับ");
    return;
  }

  await cancelLineNewsDraft(draft.id);
  await safeReply(event.replyToken, "ยกเลิกแบบร่างข่าวเรียบร้อยแล้วครับ");
}

async function handleEditCommand(
  event: LineWebhookEvent,
  lineUserId: string,
  editText: string
) {
  if (!editText) {
    await safeReply(
      event.replyToken,
      "กรุณาพิมพ์รายละเอียดที่ต้องการแก้ไขหลังคำว่า แก้ข่าว:"
    );
    return;
  }

  const draft = await getLatestActiveLineNewsDraft(lineUserId);
  if (!draft) {
    await safeReply(
      event.replyToken,
      "ยังไม่มีข่าวที่รอแก้ไข กรุณาส่งฟอร์มสร้างข่าวก่อนครับ"
    );
    return;
  }

  if (isLineNewsDraftExpired(draft)) {
    await markLineNewsDraftExpired(draft.id);
    await safeReply(
      event.replyToken,
      "แบบร่างข่าวนี้หมดอายุแล้ว กรุณาส่งฟอร์มสร้างข่าวใหม่อีกครั้ง"
    );
    return;
  }

  const updatedDraft = await appendLineNewsDraftEdit(draft, editText);
  await safeReply(
    event.replyToken,
    updatedDraft.preview_text ||
      "บันทึกหมายเหตุแก้ไขแล้วครับ กรุณาตรวจสอบตัวอย่างข่าวอีกครั้ง"
  );
}

async function handleTextMessageEvent(event: LineWebhookEvent) {
  const text = event.message?.text;
  const lineUserId = event.source?.userId;

  if (!text) return;

  const permission = await resolveLineNewsManager(lineUserId);
  if (permission.status === "not_linked") {
    await safeReply(event.replyToken, NOT_LINKED_REPLY);
    return;
  }

  if (permission.status === "forbidden") {
    if (isConfirmCommand(text)) {
      await safeReply(
        event.replyToken,
        "บัญชีนี้ไม่มีสิทธิ์เผยแพร่ข่าวผ่าน LINE แล้ว\nกรุณาติดต่อผู้ดูแลระบบ"
      );
    } else {
      await safeReply(event.replyToken, FORBIDDEN_REPLY);
    }
    return;
  }

  if (isConfirmCommand(text)) {
    await handleConfirmCommand(event, permission);
    return;
  }

  if (isCancelCommand(text)) {
    await handleCancelCommand(event, permission.lineUserId);
    return;
  }

  const editText = getEditText(text);
  if (editText !== null) {
    await handleEditCommand(event, permission.lineUserId, editText);
    return;
  }

  if (!isNewsCommand(text)) {
    await safeReply(event.replyToken, READY_REPLY);
    return;
  }

  if (!looksLikeFullNewsForm(text)) {
    await safeReply(event.replyToken, NEWS_FORM_HELP_REPLY);
    return;
  }

  const parsed = parseLineNewsForm(text);
  if (!parsed.ok) {
    await safeReply(event.replyToken, buildMissingFieldsReply(parsed.missingFields));
    return;
  }

  const existingDraft = await getLatestActiveLineNewsDraft(permission.lineUserId);
  const coverDraft =
    parsed.draft.coverImageIntent !== "none" &&
    existingDraft &&
    !isLineNewsDraftExpired(existingDraft)
      ? existingDraft
      : null;
  const coverImageUrl = coverDraft?.cover_image_url ?? null;
  const coverImageAlt = coverDraft?.cover_image_alt ?? null;

  const aiLimit = await checkLineNewsAiDailyLimit(permission.profile.id);
  logLineNewsAi({
    aiUsageAllowed: aiLimit.status !== "limited",
    aiUsageStatus: aiLimit.status,
  });
  const aiOutput =
    aiLimit.status === "limited"
      ? generateLineNewsFallbackDraft(
          parsed.draft,
          "วันนี้ใช้ AI ครบโควต้าแล้ว ระบบจะแสดงตัวอย่างจากข้อมูลที่กรอกโดยตรง",
          "daily_limit_exceeded"
        )
      : await generateLineNewsAiDraft(parsed.draft);

  logLineNewsAi({
    source: aiOutput.source,
    fallbackReason: aiOutput.fallbackReason,
    aiCalled: aiOutput.aiCalled === true,
    jsonParseOk: aiOutput.jsonParseOk,
    parseStage: aiOutput.parseStage,
    usedAiOutput: aiOutput.source === "gemini" || aiOutput.source === "gemini_text",
    showedFallbackWarning: aiOutput.source === "fallback",
  });

  if (aiOutput.aiCalled) {
    await logLineNewsAiUsage({
      userId: permission.profile.id,
      lineUserId: permission.lineUserId,
    });
  }

  const previewText = buildLineNewsPreview(parsed.draft, aiOutput, {
    hasCoverImage: Boolean(coverImageUrl),
  });
  try {
    await replaceActiveLineNewsDraft({
      userId: permission.profile.id,
      lineUserId: permission.lineUserId,
      rawText: text,
      draft: parsed.draft,
      aiOutput,
      previewText,
      coverImageUrl,
      coverImageAlt,
    });
  } catch (error) {
    console.warn("LINE news draft create failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    await safeReply(
      event.replyToken,
      "ยังไม่สามารถบันทึกฉบับร่างจาก LINE ได้ในขณะนี้"
    );
    return;
  }

  await safeReply(event.replyToken, previewText);
}

async function handleDuplicateTextMessageEvent(event: LineWebhookEvent) {
  const text = event.message?.text;
  if (!text) return;

  const permission = await resolveLineNewsManager(event.source?.userId);
  if (permission.status === "not_linked") {
    await safeReply(event.replyToken, NOT_LINKED_REPLY);
    return;
  }

  if (permission.status === "forbidden") {
    if (isConfirmCommand(text)) {
      await safeReply(
        event.replyToken,
        "บัญชีนี้ไม่มีสิทธิ์เผยแพร่ข่าวผ่าน LINE แล้ว\nกรุณาติดต่อผู้ดูแลระบบ"
      );
    } else {
      await safeReply(event.replyToken, FORBIDDEN_REPLY);
    }
    return;
  }

  if (isConfirmCommand(text)) {
    await handleConfirmCommand(event, permission);
    return;
  }

  if (isCancelCommand(text)) {
    await handleCancelCommand(event, permission.lineUserId);
    return;
  }

  const editText = getEditText(text);
  if (editText !== null) {
    await handleEditCommand(event, permission.lineUserId, editText);
    return;
  }

  const draft = await getLatestActiveLineNewsDraft(permission.lineUserId, {
    includePublished: true,
  });

  if (draft?.status === "published" || draft?.published_news_id) {
    const existingUrl = draft.published_news_id
      ? await getNewsUrlById(draft.published_news_id)
      : null;
    await safeReply(
      event.replyToken,
      ["ข่าวนี้เผยแพร่แล้วครับ ✅", existingUrl ? `ลิงก์: ${existingUrl}` : null]
        .filter(Boolean)
        .join("\n")
    );
    return;
  }

  if (draft?.preview_text) {
    await safeReply(event.replyToken, draft.preview_text);
    return;
  }

  await safeReply(
    event.replyToken,
    "ระบบได้รับข้อความนี้แล้ว กรุณาตรวจสอบแบบร่างล่าสุดอีกครั้งครับ"
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload;
  try {
    payload = parseLineWebhookPayload(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  for (const event of payload.events ?? []) {
    if (event.type !== "message") {
      continue;
    }

    try {
      const dedupe = await recordLineWebhookEvent(event);
      if (event.message?.type === "text") {
        if (dedupe.status === "duplicate") {
          await handleDuplicateTextMessageEvent(event);
        } else {
          await handleTextMessageEvent(event);
        }
      } else if (event.message?.type === "image") {
        if (dedupe.status === "duplicate") {
          await handleDuplicateImageMessageEvent(event);
        } else {
          await handleImageMessageEvent(event);
        }
      }
    } catch (error) {
      console.warn("LINE webhook event handling failed", {
        reason: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
