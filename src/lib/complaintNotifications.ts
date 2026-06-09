import "server-only";

import { complaintStatusLabels, getComplaintTypeLabel } from "@/data/complaints";
import { sendBrevoTransactionalEmail } from "@/lib/email/brevo";
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

export type ComplaintNotificationResult =
  | { status: "sent"; recipient: string; providerStatus: number }
  | { status: "skipped"; reason: "no_department_head_email" | "missing_env" }
  | { status: "failed"; recipient?: string; providerStatus?: number; reason: string };

export function splitValidEmails(value: string | null | undefined) {
  return (value ?? "")
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => emailPattern.test(email));
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

export async function notifyDepartmentHeadOfNewComplaint(
  complaint: ComplaintNotificationRow
): Promise<ComplaintNotificationResult> {
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
