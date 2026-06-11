import "server-only";

import { complaintStatusLabels, getComplaintTypeLabel } from "@/data/complaints";
import { sendBrevoTransactionalEmail } from "@/lib/email/brevo";
import { sendLinePushTextMessage } from "@/lib/line/messaging";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const departmentHeadRoleTypes = ["executive", "หัวหน้าสาขา", "หัวหน้าสาขาวิชา"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ComplaintNotificationRow = {
  id: string;
  tracking_code: string | null;
  complaint_type: string | null;
  title: string;
  status: string | null;
  created_at: string | null;
};

type DepartmentHeadRecipient = {
  email: string;
  name: string | null;
  staffId: string;
};

type DepartmentHeadStaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  user_id: string | null;
};

type DepartmentHeadLineRecipient = {
  lineUserId: string;
  userId: string;
  staffId: string;
  resolution: "staff_user_id" | "email_profile_match";
};

export type ComplaintEmailNotificationResult =
  | { status: "sent"; recipient: string; providerStatus: number }
  | { status: "skipped"; reason: "no_department_head_email" | "missing_env" }
  | { status: "failed"; recipient?: string; providerStatus?: number; reason: string };

export type ComplaintLineNotificationResult =
  | {
      status: "sent";
      recipient: string;
      providerStatus: number;
      staffId: string;
      resolution: DepartmentHeadLineRecipient["resolution"];
    }
  | {
      status: "skipped";
      reason:
        | "missing_env"
        | "no_department_head"
        | "department_head_profile_ambiguous"
        | "department_head_profile_not_found"
        | "no_department_head_line_connection";
      staffId?: string;
    }
  | {
      status: "failed";
      recipient?: string;
      providerStatus?: number;
      reason: string;
      staffId?: string;
    };

export type ComplaintNotificationResult = {
  email: ComplaintEmailNotificationResult;
  line: ComplaintLineNotificationResult;
};

export function splitValidEmails(value: string | null | undefined) {
  return (value ?? "")
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => emailPattern.test(email));
}

async function getCurrentDepartmentHeadStaffMember(): Promise<DepartmentHeadStaffMember | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("staff_members")
    .select("id,full_name,email,user_id,role_type,sort_order")
    .eq("is_active", true)
    .in("role_type", departmentHeadRoleTypes)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle<DepartmentHeadStaffMember>();

  if (error) {
    throw new Error("department_head_lookup_failed");
  }

  return data ?? null;
}

export async function getCurrentDepartmentHeadRecipient(): Promise<DepartmentHeadRecipient | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("staff_members")
    .select("id,full_name,email,role_type,sort_order")
    .eq("is_active", true)
    .in("role_type", departmentHeadRoleTypes)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error("department_head_lookup_failed");
  }

  for (const member of data ?? []) {
    const [email] = splitValidEmails(member.email);
    if (email) {
      return {
        email,
        name: member.full_name ?? null,
        staffId: member.id,
      };
    }
  }

  return null;
}

async function resolveDepartmentHeadUserId(
  member: DepartmentHeadStaffMember
): Promise<
  | { status: "resolved"; userId: string; resolution: DepartmentHeadLineRecipient["resolution"] }
  | { status: "ambiguous" }
  | { status: "not_found" }
> {
  if (member.user_id) {
    return {
      status: "resolved",
      userId: member.user_id,
      resolution: "staff_user_id",
    };
  }

  const emails = splitValidEmails(member.email);
  const uniqueEmails = Array.from(new Set(emails));

  if (uniqueEmails.length !== 1) {
    return uniqueEmails.length > 1 ? { status: "ambiguous" } : { status: "not_found" };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,email")
    .eq("email", uniqueEmails[0])
    .limit(2);

  if (error) {
    throw new Error("department_head_profile_lookup_failed");
  }

  if (!data || data.length === 0) {
    return { status: "not_found" };
  }

  if (data.length > 1) {
    return { status: "ambiguous" };
  }

  return {
    status: "resolved",
    userId: data[0].id,
    resolution: "email_profile_match",
  };
}

async function getCurrentDepartmentHeadLineRecipient(): Promise<
  | { status: "found"; recipient: DepartmentHeadLineRecipient }
  | { status: "skipped"; result: ComplaintLineNotificationResult }
> {
  const member = await getCurrentDepartmentHeadStaffMember();

  if (!member) {
    return {
      status: "skipped",
      result: { status: "skipped", reason: "no_department_head" },
    };
  }

  const resolvedUser = await resolveDepartmentHeadUserId(member);

  if (resolvedUser.status === "ambiguous") {
    return {
      status: "skipped",
      result: {
        status: "skipped",
        reason: "department_head_profile_ambiguous",
        staffId: member.id,
      },
    };
  }

  if (resolvedUser.status === "not_found") {
    return {
      status: "skipped",
      result: {
        status: "skipped",
        reason: "department_head_profile_not_found",
        staffId: member.id,
      },
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_line_connections")
    .select("line_user_id")
    .eq("user_id", resolvedUser.userId)
    .eq("notify_enabled", true)
    .is("revoked_at", null)
    .not("line_user_id", "is", null)
    .maybeSingle<{ line_user_id: string | null }>();

  if (error) {
    throw new Error("department_head_line_connection_lookup_failed");
  }

  if (!data?.line_user_id) {
    return {
      status: "skipped",
      result: {
        status: "skipped",
        reason: "no_department_head_line_connection",
        staffId: member.id,
      },
    };
  }

  return {
    status: "found",
    recipient: {
      lineUserId: data.line_user_id,
      userId: resolvedUser.userId,
      staffId: member.id,
      resolution: resolvedUser.resolution,
    },
  };
}

function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSubmittedAt(value: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Bangkok",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getDashboardComplaintsUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "";
  return `${siteUrl}/dashboard/complaints`;
}

function buildComplaintEmailContent(complaint: ComplaintNotificationRow) {
  const dashboardUrl = getDashboardComplaintsUrl();
  const trackingCode = complaint.tracking_code || complaint.id;
  const complaintType = getComplaintTypeLabel(complaint.complaint_type);
  const status =
    complaintStatusLabels[complaint.status as keyof typeof complaintStatusLabels] ??
    complaint.status ??
    "new";
  const submittedAt = formatSubmittedAt(complaint.created_at);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 16px;">แจ้งเตือนข้อร้องเรียนใหม่จากเว็บไซต์สาขา</h2>
      <p>มีข้อร้องเรียนใหม่ถูกส่งเข้าสู่ระบบ กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียด</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">รหัสติดตาม</td><td>${escapeHtml(trackingCode)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">วันที่ส่ง</td><td>${escapeHtml(submittedAt)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">ประเภท</td><td>${escapeHtml(complaintType)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">หัวข้อ</td><td>${escapeHtml(complaint.title)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">สถานะ</td><td>${escapeHtml(status)}</td></tr>
      </table>
      <p><a href="${escapeHtml(dashboardUrl)}">เปิดหน้าจัดการข้อร้องเรียน</a></p>
      <p style="font-size: 13px; color: #6b7280;">อีเมลนี้ไม่แสดงรายละเอียดข้อร้องเรียนฉบับเต็มเพื่อคุ้มครองข้อมูลส่วนบุคคล</p>
    </div>
  `;

  const textContent = [
    "แจ้งเตือนข้อร้องเรียนใหม่จากเว็บไซต์สาขา",
    "",
    "มีข้อร้องเรียนใหม่ถูกส่งเข้าสู่ระบบ กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียด",
    `รหัสติดตาม: ${trackingCode}`,
    `วันที่ส่ง: ${submittedAt}`,
    `ประเภท: ${complaintType}`,
    `หัวข้อ: ${complaint.title}`,
    `สถานะ: ${status}`,
    `ลิงก์หลังบ้าน: ${dashboardUrl}`,
    "",
    "อีเมลนี้ไม่แสดงรายละเอียดข้อร้องเรียนฉบับเต็มเพื่อคุ้มครองข้อมูลส่วนบุคคล",
  ].join("\n");

  return { htmlContent, textContent };
}

function truncateLineText(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function buildComplaintLineText(complaint: ComplaintNotificationRow) {
  const dashboardUrl = getDashboardComplaintsUrl();
  const trackingCode = complaint.tracking_code || complaint.id;
  const complaintType = getComplaintTypeLabel(complaint.complaint_type);
  const status =
    complaintStatusLabels[complaint.status as keyof typeof complaintStatusLabels] ??
    complaint.status ??
    "new";

  return [
    "แจ้งเตือนข้อร้องเรียนใหม่จากเว็บไซต์สาขา",
    "",
    `รหัสติดตาม: ${trackingCode}`,
    `ประเภท: ${complaintType}`,
    `หัวข้อ: ${truncateLineText(complaint.title)}`,
    `สถานะ: ${status}`,
    "",
    "กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียด",
    dashboardUrl,
  ].join("\n");
}

async function notifyDepartmentHeadByEmail(
  complaint: ComplaintNotificationRow
): Promise<ComplaintEmailNotificationResult> {
  const recipient = await getCurrentDepartmentHeadRecipient();

  if (!recipient) {
    return { status: "skipped", reason: "no_department_head_email" };
  }

  const { htmlContent, textContent } = buildComplaintEmailContent(complaint);
  const result = await sendBrevoTransactionalEmail({
    to: {
      email: recipient.email,
      name: recipient.name,
    },
    subject: "แจ้งเตือนข้อร้องเรียนใหม่จากเว็บไซต์สาขา",
    htmlContent,
    textContent,
  });

  if (result.status === "sent") {
    return {
      status: "sent",
      recipient: recipient.email,
      providerStatus: result.providerStatus,
    };
  }

  if (result.status === "skipped") {
    return { status: "skipped", reason: result.reason };
  }

  return {
    status: "failed",
    recipient: recipient.email,
    providerStatus: result.providerStatus,
    reason: result.reason,
  };
}

async function notifyDepartmentHeadByLine(
  complaint: ComplaintNotificationRow
): Promise<ComplaintLineNotificationResult> {
  const recipientResult = await getCurrentDepartmentHeadLineRecipient();

  if (recipientResult.status === "skipped") {
    return recipientResult.result;
  }

  const { recipient } = recipientResult;
  const result = await sendLinePushTextMessage(
    recipient.lineUserId,
    buildComplaintLineText(complaint)
  );

  if (result.status === "sent") {
    return {
      status: "sent",
      recipient: recipient.lineUserId,
      providerStatus: result.providerStatus,
      staffId: recipient.staffId,
      resolution: recipient.resolution,
    };
  }

  if (result.status === "skipped") {
    return {
      status: "skipped",
      reason: result.reason,
      staffId: recipient.staffId,
    };
  }

  return {
    status: "failed",
    recipient: recipient.lineUserId,
    providerStatus: result.providerStatus,
    reason: result.reason,
    staffId: recipient.staffId,
  };
}

function normalizeRejectedNotification(reason: unknown, channel: "email" | "line") {
  const errorReason = reason instanceof Error ? reason.message : "unknown_error";

  if (channel === "email") {
    return {
      status: "failed",
      reason: errorReason,
    } satisfies ComplaintEmailNotificationResult;
  }

  return {
    status: "failed",
    reason: errorReason,
  } satisfies ComplaintLineNotificationResult;
}

export async function notifyDepartmentHeadOfNewComplaint(
  complaint: ComplaintNotificationRow
): Promise<ComplaintNotificationResult> {
  const [emailResult, lineResult] = await Promise.allSettled([
    notifyDepartmentHeadByEmail(complaint),
    notifyDepartmentHeadByLine(complaint),
  ]);

  return {
    email:
      emailResult.status === "fulfilled"
        ? emailResult.value
        : normalizeRejectedNotification(emailResult.reason, "email"),
    line:
      lineResult.status === "fulfilled"
        ? lineResult.value
        : normalizeRejectedNotification(lineResult.reason, "line"),
  };
}
