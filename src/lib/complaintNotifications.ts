import "server-only";

import { complaintStatusLabels, getComplaintTypeLabel } from "@/data/complaints";
import { getComplaintAttachmentUrls } from "@/lib/complaintAttachments";
import { sendBrevoTransactionalEmail } from "@/lib/email/brevo";
import { sendLinePushTextMessage } from "@/lib/line/messaging";
import { buildCanonicalUrl } from "@/lib/siteUrl";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const departmentHeadRoleTypes = ["executive", "หัวหน้าสาขา", "หัวหน้าสาขาวิชา"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ComplaintNotificationRow = {
  id: string;
  tracking_code: string | null;
  complaint_type: string | null;
  title: string;
  detail: string | null;
  want_contact: boolean | null;
  attachment_url?: string | null;
  attachment_urls?: string[] | null;
  status: string | null;
  created_at: string | null;
};

type DepartmentHeadRecipient = {
  email: string;
  name: string | null;
  staffId: string;
  profileId: string | null;
};

type DepartmentHeadStaffMember = {
  id: string;
  full_name: string | null;
  email: string | null;
  user_id: string | null;
};

type SuperAdminProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean | null;
  status: string | null;
};

type ComplaintEmailRecipient = {
  email: string;
  name: string | null;
  profileId: string | null;
  source: "department_head" | "super_admin";
  staffId?: string;
};

type DepartmentHeadLineRecipient = {
  lineUserId: string;
  userId: string;
  staffId: string;
  resolution: "staff_user_id" | "email_profile_match";
};

type ComplaintLineRecipient = {
  lineUserId: string;
  userId: string;
  source: "department_head" | "super_admin";
  staffId?: string;
  resolution?: DepartmentHeadLineRecipient["resolution"];
};

export type ComplaintChannelNotificationResult = {
  status: "sent" | "partial" | "skipped" | "failed";
  recipientCount: number;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  providerStatuses: number[];
  reason?: string;
};

export type ComplaintEmailNotificationResult = ComplaintChannelNotificationResult;
export type ComplaintLineNotificationResult = ComplaintChannelNotificationResult;

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

function isActiveProfile(profile: SuperAdminProfile) {
  return profile.is_active !== false && profile.status !== "inactive";
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
    .select("id,full_name,email,user_id,role_type,sort_order")
    .eq("is_active", true)
    .in("role_type", departmentHeadRoleTypes)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error("department_head_lookup_failed");
  }

  for (const member of data ?? []) {
    const [email] = splitValidEmails(member.email);
    if (email) {
      let profileId: string | null = null;
      try {
        const resolvedUser = await resolveDepartmentHeadUserId(member);
        profileId = resolvedUser.status === "resolved" ? resolvedUser.userId : null;
      } catch {
        profileId = null;
      }
      return {
        email,
        name: member.full_name ?? null,
        staffId: member.id,
        profileId,
      };
    }
  }

  return null;
}

async function getActiveSuperAdminProfiles(): Promise<SuperAdminProfile[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id,email,full_name,is_active,status")
    .eq("role", "super_admin")
    .eq("is_active", true)
    .returns<SuperAdminProfile[]>();

  if (error) {
    throw new Error("super_admin_lookup_failed");
  }

  return (data ?? []).filter(isActiveProfile);
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
  | { status: "skipped" }
> {
  const member = await getCurrentDepartmentHeadStaffMember();

  if (!member) {
    return { status: "skipped" };
  }

  const resolvedUser = await resolveDepartmentHeadUserId(member);

  if (resolvedUser.status === "ambiguous") {
    return { status: "skipped" };
  }

  if (resolvedUser.status === "not_found") {
    return { status: "skipped" };
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
    return { status: "skipped" };
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

function dedupeEmailRecipients(recipients: ComplaintEmailRecipient[]) {
  const seenProfileIds = new Set<string>();
  const seenEmails = new Set<string>();
  const unique: ComplaintEmailRecipient[] = [];

  for (const recipient of recipients) {
    if (recipient.profileId) {
      if (seenProfileIds.has(recipient.profileId)) continue;
      seenProfileIds.add(recipient.profileId);
    }

    if (seenEmails.has(recipient.email)) continue;
    seenEmails.add(recipient.email);
    unique.push(recipient);
  }

  return unique;
}

function dedupeLineRecipients(recipients: ComplaintLineRecipient[]) {
  const seenUserIds = new Set<string>();
  const seenLineUserIds = new Set<string>();
  const unique: ComplaintLineRecipient[] = [];

  for (const recipient of recipients) {
    if (seenUserIds.has(recipient.userId)) continue;
    if (seenLineUserIds.has(recipient.lineUserId)) continue;
    seenUserIds.add(recipient.userId);
    seenLineUserIds.add(recipient.lineUserId);
    unique.push(recipient);
  }

  return unique;
}

async function getComplaintEmailRecipients(): Promise<ComplaintEmailRecipient[]> {
  const [departmentHeadResult, superAdminsResult] = await Promise.allSettled([
    getCurrentDepartmentHeadRecipient(),
    getActiveSuperAdminProfiles(),
  ]);
  const departmentHead =
    departmentHeadResult.status === "fulfilled" ? departmentHeadResult.value : null;
  const superAdmins =
    superAdminsResult.status === "fulfilled" ? superAdminsResult.value : [];

  const recipients: ComplaintEmailRecipient[] = [];

  if (departmentHead) {
    recipients.push({
      email: departmentHead.email,
      name: departmentHead.name,
      profileId: departmentHead.profileId,
      source: "department_head",
      staffId: departmentHead.staffId,
    });
  }

  for (const profile of superAdmins) {
    const [email] = splitValidEmails(profile.email);
    if (!email) continue;
    recipients.push({
      email,
      name: profile.full_name ?? null,
      profileId: profile.id,
      source: "super_admin",
    });
  }

  return dedupeEmailRecipients(recipients);
}

async function getSuperAdminLineRecipients(): Promise<ComplaintLineRecipient[]> {
  const superAdmins = await getActiveSuperAdminProfiles();
  const userIds = superAdmins.map((profile) => profile.id);

  if (userIds.length === 0) return [];

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_line_connections")
    .select("user_id,line_user_id")
    .in("user_id", userIds)
    .eq("notify_enabled", true)
    .is("revoked_at", null)
    .not("line_user_id", "is", null)
    .returns<{ user_id: string; line_user_id: string | null }[]>();

  if (error) {
    throw new Error("super_admin_line_connection_lookup_failed");
  }

  return (data ?? [])
    .filter((row): row is { user_id: string; line_user_id: string } => Boolean(row.line_user_id))
    .map((row) => ({
      lineUserId: row.line_user_id,
      userId: row.user_id,
      source: "super_admin",
    }));
}

async function getComplaintLineRecipients(): Promise<ComplaintLineRecipient[]> {
  const [departmentHeadResult, superAdminRecipientsResult] = await Promise.allSettled([
    getCurrentDepartmentHeadLineRecipient(),
    getSuperAdminLineRecipients(),
  ]);
  const superAdminRecipients =
    superAdminRecipientsResult.status === "fulfilled" ? superAdminRecipientsResult.value : [];

  const recipients: ComplaintLineRecipient[] = [...superAdminRecipients];

  if (
    departmentHeadResult.status === "fulfilled" &&
    departmentHeadResult.value.status === "found"
  ) {
    recipients.unshift({
      lineUserId: departmentHeadResult.value.recipient.lineUserId,
      userId: departmentHeadResult.value.recipient.userId,
      source: "department_head",
      staffId: departmentHeadResult.value.recipient.staffId,
      resolution: departmentHeadResult.value.recipient.resolution,
    });
  }

  return dedupeLineRecipients(recipients);
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
  return buildCanonicalUrl("/dashboard/complaints");
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
  const detail = truncateLineText(complaint.detail ?? "", 420);
  const wantContact = complaint.want_contact === true ? "ใช่" : "ไม่";
  const attachmentCount = getComplaintAttachmentUrls(complaint).length;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 16px;">แจ้งเตือนข้อร้องเรียนใหม่จากเว็บไซต์สาขา</h2>
      <p>มีข้อร้องเรียนใหม่ถูกส่งเข้าสู่ระบบ กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียด</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">รหัสติดตาม</td><td>${escapeHtml(trackingCode)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">วันที่ส่ง</td><td>${escapeHtml(submittedAt)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">ประเภท</td><td>${escapeHtml(complaintType)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">หัวข้อ</td><td>${escapeHtml(complaint.title)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">ต้องการให้ติดต่อกลับ</td><td>${escapeHtml(wantContact)}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">รูปภาพแนบ</td><td>${attachmentCount > 0 ? `${attachmentCount} รูป` : "-"}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">สถานะ</td><td>${escapeHtml(status)}</td></tr>
      </table>
      <div style="margin: 16px 0;">
        <div style="font-weight: bold; margin-bottom: 6px;">รายละเอียดข้อร้องเรียน</div>
        <div style="white-space: pre-line; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">${escapeHtml(detail || "-")}</div>
      </div>
      <p><a href="${escapeHtml(dashboardUrl)}">เปิดหน้าจัดการข้อร้องเรียน</a></p>
      <p style="font-size: 13px; color: #6b7280;">กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียดเพิ่มเติม</p>
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
    `รายละเอียด: ${detail || "-"}`,
    `ต้องการให้ติดต่อกลับ: ${wantContact}`,
    `รูปภาพแนบ: ${attachmentCount > 0 ? `${attachmentCount} รูป` : "-"}`,
    `สถานะ: ${status}`,
    "",
    "กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียดเพิ่มเติม",
    `ลิงก์หลังบ้าน: ${dashboardUrl}`,
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
  const detail = truncateLineText(complaint.detail ?? "", 420);
  const wantContact = complaint.want_contact === true ? "ใช่" : "ไม่";
  const attachmentCount = getComplaintAttachmentUrls(complaint).length;

  return [
    "แจ้งเตือนข้อร้องเรียนใหม่จากเว็บไซต์สาขา",
    "",
    `รหัสติดตาม: ${trackingCode}`,
    `ประเภท: ${complaintType}`,
    `หัวข้อ: ${truncateLineText(complaint.title)}`,
    `รายละเอียด: ${detail || "-"}`,
    `ต้องการให้ติดต่อกลับ: ${wantContact}`,
    `รูปภาพแนบ: ${attachmentCount > 0 ? `${attachmentCount} รูป` : "-"}`,
    `สถานะ: ${status}`,
    "",
    "กรุณาเข้าสู่ระบบหลังบ้านเพื่อตรวจสอบรายละเอียด",
    dashboardUrl,
  ].join("\n");
}

function summarizeChannelResults(
  recipientCount: number,
  results: PromiseSettledResult<
    | { status: "sent"; providerStatus: number }
    | { status: "skipped"; reason: string }
    | { status: "failed"; providerStatus?: number; reason: string }
  >[]
): ComplaintChannelNotificationResult {
  if (recipientCount === 0) {
    return {
      status: "skipped",
      recipientCount: 0,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
      providerStatuses: [],
      reason: "no_recipients",
    };
  }

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const reasons = new Set<string>();
  const providerStatuses: number[] = [];

  for (const result of results) {
    if (result.status === "rejected") {
      failedCount += 1;
      reasons.add(result.reason instanceof Error ? result.reason.message : "unknown_error");
      continue;
    }

    if (result.value.status === "sent") {
      sentCount += 1;
      providerStatuses.push(result.value.providerStatus);
      continue;
    }

    if (result.value.status === "skipped") {
      skippedCount += 1;
      reasons.add(result.value.reason);
      continue;
    }

    failedCount += 1;
    if (result.value.providerStatus) providerStatuses.push(result.value.providerStatus);
    reasons.add(result.value.reason);
  }

  const reason = Array.from(reasons).sort().join(",") || undefined;
  const status =
    sentCount === recipientCount
      ? "sent"
      : sentCount > 0
        ? "partial"
        : failedCount > 0
          ? "failed"
          : "skipped";

  return {
    status,
    recipientCount,
    sentCount,
    skippedCount,
    failedCount,
    providerStatuses,
    reason,
  };
}

async function notifyComplaintRecipientsByEmail(
  complaint: ComplaintNotificationRow
): Promise<ComplaintEmailNotificationResult> {
  const recipients = await getComplaintEmailRecipients();

  if (recipients.length === 0) {
    return summarizeChannelResults(0, []);
  }

  const { htmlContent, textContent } = buildComplaintEmailContent(complaint);
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendBrevoTransactionalEmail({
        to: {
          email: recipient.email,
          name: recipient.name,
        },
        subject: "แจ้งเตือนข้อร้องเรียนใหม่จากเว็บไซต์สาขา",
        htmlContent,
        textContent,
      })
    )
  );

  return summarizeChannelResults(recipients.length, results);
}

async function notifyComplaintRecipientsByLine(
  complaint: ComplaintNotificationRow
): Promise<ComplaintLineNotificationResult> {
  const recipients = await getComplaintLineRecipients();

  if (recipients.length === 0) {
    return summarizeChannelResults(0, []);
  }

  const lineText = buildComplaintLineText(complaint);
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendLinePushTextMessage(recipient.lineUserId, lineText)
    )
  );

  return summarizeChannelResults(recipients.length, results);
}

function normalizeRejectedNotification(reason: unknown) {
  const errorReason = reason instanceof Error ? reason.message : "unknown_error";

  return {
    status: "failed",
    recipientCount: 0,
    sentCount: 0,
    skippedCount: 0,
    failedCount: 0,
    providerStatuses: [],
    reason: errorReason,
  } satisfies ComplaintChannelNotificationResult;
}

export async function notifyDepartmentHeadOfNewComplaint(
  complaint: ComplaintNotificationRow
): Promise<ComplaintNotificationResult> {
  const [emailResult, lineResult] = await Promise.allSettled([
    notifyComplaintRecipientsByEmail(complaint),
    notifyComplaintRecipientsByLine(complaint),
  ]);

  return {
    email:
      emailResult.status === "fulfilled"
        ? emailResult.value
        : normalizeRejectedNotification(emailResult.reason),
    line:
      lineResult.status === "fulfilled"
        ? lineResult.value
        : normalizeRejectedNotification(lineResult.reason),
  };
}
