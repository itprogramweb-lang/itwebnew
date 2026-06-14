import { NextRequest, NextResponse } from "next/server";
import { getComplaintAccessForProfile } from "@/lib/complaintAccess";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfileWithPermissions } from "@/lib/serverAuth";
import type { ComplaintStatus } from "@/types";

const COMPLAINT_COLUMNS =
  "id,tracking_code,complaint_type,title,detail,sender_name,student_id,email,phone,want_contact,attachment_url,attachment_urls,status,assigned_to,internal_note,created_at,updated_at";
const LEGACY_COMPLAINT_COLUMNS =
  "id,tracking_code,complaint_type,title,detail,sender_name,student_id,email,phone,want_contact,attachment_url,status,assigned_to,internal_note,created_at,updated_at";

const allowedStatuses: ComplaintStatus[] = ["new", "in_progress", "resolved", "rejected"];

type UpdatePayload = {
  id?: string;
  status?: ComplaintStatus;
  assigned_to?: string | null;
  internal_note?: string | null;
};

async function requireComplaintViewer(request: NextRequest) {
  const profile = await getAuthenticatedProfileWithPermissions(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const access = await getComplaintAccessForProfile(profile);
  if (!access.canViewComplaints) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    profile,
    access,
    canUpdate: access.canManageComplaints,
  };
}

function cleanOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

export async function GET(request: NextRequest) {
  const auth = await requireComplaintViewer(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("access") === "1") {
    return NextResponse.json({
      permissions: {
        canView: auth.access.canViewComplaints,
        canUpdate: auth.access.canManageComplaints,
        isDepartmentHead: auth.access.isDepartmentHead,
      },
    });
  }

  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("complaints")
    .select(COMPLAINT_COLUMNS)
    .order("created_at", { ascending: false });
  let data: unknown[] | null = result.data;
  let error = result.error;

  if (error && isMissingAttachmentUrlsColumn(error)) {
    const legacyResult = await admin
      .from("complaints")
      .select(LEGACY_COMPLAINT_COLUMNS)
      .order("created_at", { ascending: false });

    data = legacyResult.data;
    error = legacyResult.error;
  }

  if (error) {
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อร้องเรียนได้" }, { status: 500 });
  }

  return NextResponse.json({
    complaints: data ?? [],
    permissions: {
      canUpdate: auth.canUpdate,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireComplaintViewer(request);
  if (auth.error) return auth.error;
  if (!auth.canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as UpdatePayload;
  const id = body.id?.trim();
  const status = body.status;

  if (!id) {
    return NextResponse.json({ error: "ไม่พบรหัสข้อร้องเรียน" }, { status: 400 });
  }
  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const updatedAt = new Date().toISOString();
  const result = await admin
    .from("complaints")
    .update({
      status,
      assigned_to: cleanOptionalText(body.assigned_to),
      internal_note: cleanOptionalText(body.internal_note),
      updated_at: updatedAt,
    })
    .eq("id", id)
    .select(COMPLAINT_COLUMNS)
    .single();
  let data: unknown | null = result.data;
  let error = result.error;

  if (error && isMissingAttachmentUrlsColumn(error)) {
    const legacyResult = await admin
      .from("complaints")
      .update({
        status,
        assigned_to: cleanOptionalText(body.assigned_to),
        internal_note: cleanOptionalText(body.internal_note),
        updated_at: updatedAt,
      })
      .eq("id", id)
      .select(LEGACY_COMPLAINT_COLUMNS)
      .single();

    data = legacyResult.data;
    error = legacyResult.error;
  }

  if (error) {
    return NextResponse.json({ error: "ไม่สามารถอัปเดตข้อร้องเรียนได้" }, { status: 500 });
  }

  return NextResponse.json({ complaint: data });
}
