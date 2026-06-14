import { NextRequest, NextResponse } from "next/server";
import {
  notifyDepartmentHeadOfNewComplaint,
  type ComplaintNotificationRow,
} from "@/lib/complaintNotifications";
import { MAX_COMPLAINT_ATTACHMENT_COUNT } from "@/lib/complaintAttachments";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const COMPLAINT_COLUMNS =
  "id,tracking_code,complaint_type,title,detail,want_contact,attachment_url,attachment_urls,status,created_at";
const LEGACY_COMPLAINT_COLUMNS =
  "id,tracking_code,complaint_type,title,detail,want_contact,attachment_url,status,created_at";

type ComplaintCreatePayload = {
  complaint_type?: unknown;
  title?: unknown;
  detail?: unknown;
  sender_name?: unknown;
  student_id?: unknown;
  email?: unknown;
  phone?: unknown;
  want_contact?: unknown;
  truth_confirmed?: unknown;
  attachment_url?: unknown;
  attachment_urls?: unknown;
};

function cleanRequiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanAttachmentUrls(value: unknown) {
  if (value === undefined || value === null) return { status: "ok" as const, urls: [] };

  if (!Array.isArray(value)) {
    return { status: "invalid" as const, error: "ข้อมูลไฟล์แนบไม่ถูกต้อง" };
  }

  if (value.length > MAX_COMPLAINT_ATTACHMENT_COUNT) {
    return { status: "invalid" as const, error: "แนบรูปภาพได้สูงสุด 5 รูป" };
  }

  const urls: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return { status: "invalid" as const, error: "ข้อมูลไฟล์แนบไม่ถูกต้อง" };
    }

    const trimmed = item.trim();
    if (!trimmed) {
      return { status: "invalid" as const, error: "ข้อมูลไฟล์แนบไม่ถูกต้อง" };
    }

    urls.push(trimmed);
  }

  return { status: "ok" as const, urls };
}

function isMissingAttachmentUrlsColumn(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42703" ||
    error?.code === "PGRST204" ||
    message.includes("attachment_urls") ||
    message.includes("schema cache")
  );
}

function generateTrackingCode() {
  const date = new Date();

  const yyyymmdd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `CMP-${yyyymmdd}-${suffix}`;
}

function logNotificationOutcome(
  complaint: ComplaintNotificationRow,
  result: Awaited<ReturnType<typeof notifyDepartmentHeadOfNewComplaint>>
) {
  const metadata = {
    complaintId: complaint.id,
    trackingCode: complaint.tracking_code,
  };

  if (result.email.status === "sent") {
    console.info("Complaint email notification sent", {
      ...metadata,
      recipientCount: result.email.recipientCount,
      sentCount: result.email.sentCount,
      providerStatuses: result.email.providerStatuses,
    });
  } else if (result.email.status === "partial") {
    console.warn("Complaint email notification partially sent", {
      ...metadata,
      recipientCount: result.email.recipientCount,
      sentCount: result.email.sentCount,
      failedCount: result.email.failedCount,
      skippedCount: result.email.skippedCount,
      reason: result.email.reason,
      providerStatuses: result.email.providerStatuses,
    });
  } else if (result.email.status === "skipped") {
    console.warn("Complaint email notification skipped", {
      ...metadata,
      recipientCount: result.email.recipientCount,
      reason: result.email.reason,
    });
  } else {
    console.warn("Complaint email notification failed", {
      ...metadata,
      recipientCount: result.email.recipientCount,
      failedCount: result.email.failedCount,
      skippedCount: result.email.skippedCount,
      reason: result.email.reason,
      providerStatuses: result.email.providerStatuses,
    });
  }

  if (result.line.status === "sent") {
    console.info("Complaint LINE notification sent", {
      ...metadata,
      recipientCount: result.line.recipientCount,
      sentCount: result.line.sentCount,
      providerStatuses: result.line.providerStatuses,
    });
  } else if (result.line.status === "partial") {
    console.warn("Complaint LINE notification partially sent", {
      ...metadata,
      recipientCount: result.line.recipientCount,
      sentCount: result.line.sentCount,
      failedCount: result.line.failedCount,
      skippedCount: result.line.skippedCount,
      reason: result.line.reason,
      providerStatuses: result.line.providerStatuses,
    });
  } else if (result.line.status === "skipped") {
    console.warn("Complaint LINE notification skipped", {
      ...metadata,
      recipientCount: result.line.recipientCount,
      reason: result.line.reason,
    });
  } else {
    console.warn("Complaint LINE notification failed", {
      ...metadata,
      recipientCount: result.line.recipientCount,
      failedCount: result.line.failedCount,
      skippedCount: result.line.skippedCount,
      reason: result.line.reason,
      providerStatuses: result.line.providerStatuses,
    });
  }
}

export async function POST(request: NextRequest) {
  let body: ComplaintCreatePayload;

  try {
    body = (await request.json()) as ComplaintCreatePayload;
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถอ่านข้อมูลที่ส่งมาได้" },
      { status: 400 }
    );
  }

  const complaintType = cleanRequiredText(body.complaint_type);
  const title = cleanRequiredText(body.title);
  const detail = cleanRequiredText(body.detail);
  const email = cleanOptionalText(body.email);
  const phone = cleanOptionalText(body.phone);
  const wantContact = body.want_contact === true;
  const truthConfirmed = body.truth_confirmed === true;
  const attachmentUrlsResult = cleanAttachmentUrls(body.attachment_urls);

  if (!complaintType || !title || !detail) {
    return NextResponse.json(
      { error: "กรุณากรอกประเภทข้อร้องเรียน หัวข้อ และรายละเอียดให้ครบ" },
      { status: 400 }
    );
  }

  if (wantContact && !email && !phone) {
    return NextResponse.json(
      {
        error:
          "หากต้องการให้เจ้าหน้าที่ติดต่อกลับ กรุณาระบุอีเมลหรือเบอร์โทรอย่างน้อย 1 ช่อง",
      },
      { status: 400 }
    );
  }

  if (!truthConfirmed) {
    return NextResponse.json(
      { error: "กรุณายืนยันว่าข้อมูลที่แจ้งเป็นความจริงก่อนส่งข้อร้องเรียน" },
      { status: 400 }
    );
  }

  if (attachmentUrlsResult.status === "invalid") {
    return NextResponse.json(
      { error: attachmentUrlsResult.error },
      { status: 400 }
    );
  }

  const legacyAttachmentUrl = cleanOptionalText(body.attachment_url);
  const attachmentUrls =
    attachmentUrlsResult.urls.length > 0
      ? attachmentUrlsResult.urls
      : legacyAttachmentUrl
        ? [legacyAttachmentUrl]
        : [];

  const payload = {
    tracking_code: generateTrackingCode(),
    complaint_type: complaintType,
    title,
    detail,
    sender_name: cleanOptionalText(body.sender_name),
    student_id: cleanOptionalText(body.student_id),
    email,
    phone,
    want_contact: wantContact,
    attachment_url: attachmentUrls[0] ?? null,
    attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : null,
    status: "new",
  };

  try {
    const admin = createSupabaseAdminClient();
    let { data, error } = await admin
      .from("complaints")
      .insert(payload)
      .select(COMPLAINT_COLUMNS)
      .single<ComplaintNotificationRow>();

    if (error && isMissingAttachmentUrlsColumn(error)) {
      const legacyPayload = {
        tracking_code: payload.tracking_code,
        complaint_type: payload.complaint_type,
        title: payload.title,
        detail: payload.detail,
        sender_name: payload.sender_name,
        student_id: payload.student_id,
        email: payload.email,
        phone: payload.phone,
        want_contact: payload.want_contact,
        attachment_url: payload.attachment_url,
        status: payload.status,
      };
      const legacyResult = await admin
        .from("complaints")
        .insert(legacyPayload)
        .select(LEGACY_COMPLAINT_COLUMNS)
        .single<ComplaintNotificationRow>();

      data = legacyResult.data;
      error = legacyResult.error;
    }

    if (error || !data) {
      console.error("Public complaint insert failed", {
        trackingCode: payload.tracking_code,
        code: error?.code,
      });
      return NextResponse.json(
        { error: "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 }
      );
    }

    try {
      const notificationResult = await notifyDepartmentHeadOfNewComplaint(data);
      logNotificationOutcome(data, notificationResult);
    } catch (error) {
      console.warn("Complaint notification flow threw", {
        complaintId: data.id,
        trackingCode: data.tracking_code,
        reason: error instanceof Error ? error.message : "unknown_error",
      });
    }

    return NextResponse.json({
      success: true,
      complaint: data,
    });
  } catch (error) {
    console.error("Public complaint creation failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
