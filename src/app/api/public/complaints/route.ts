import { NextRequest, NextResponse } from "next/server";
import {
  notifyDepartmentHeadOfNewComplaint,
  type ComplaintNotificationRow,
} from "@/lib/complaintNotifications";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const COMPLAINT_COLUMNS =
  "id,tracking_code,complaint_type,title,status,created_at";

type ComplaintCreatePayload = {
  complaint_type?: unknown;
  title?: unknown;
  detail?: unknown;
  sender_name?: unknown;
  student_id?: unknown;
  email?: unknown;
  phone?: unknown;
  want_contact?: unknown;
  attachment_url?: unknown;
};

function cleanRequiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

  if (result.status === "sent") {
    console.info("Complaint email notification sent", {
      ...metadata,
      providerStatus: result.providerStatus,
    });
    return;
  }

  if (result.status === "skipped") {
    console.warn("Complaint email notification skipped", {
      ...metadata,
      reason: result.reason,
    });
    return;
  }

  console.warn("Complaint email notification failed", {
    ...metadata,
    reason: result.reason,
    providerStatus: result.providerStatus,
  });
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
    attachment_url: cleanOptionalText(body.attachment_url),
    status: "new",
  };

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("complaints")
      .insert(payload)
      .select(COMPLAINT_COLUMNS)
      .single<ComplaintNotificationRow>();

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
      console.warn("Complaint email notification threw", {
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
