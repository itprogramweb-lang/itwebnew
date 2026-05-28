import { NextRequest, NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile } from "@/lib/serverAuth";
import type { ComplaintStatus } from "@/types";

const COMPLAINT_COLUMNS =
  "id,tracking_code,complaint_type,title,detail,sender_name,student_id,email,phone,want_contact,attachment_url,status,assigned_to,internal_note,created_at,updated_at";

const allowedStatuses: ComplaintStatus[] = ["new", "in_progress", "resolved", "rejected"];

type UpdatePayload = {
  id?: string;
  status?: ComplaintStatus;
  assigned_to?: string | null;
  internal_note?: string | null;
};

async function requireComplaintViewer(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!can(profile.role, "view_complaints") && !can(profile.role, "manage_complaints")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    profile,
    canUpdate: can(profile.role, "manage_complaints"),
  };
}

function cleanOptionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireComplaintViewer(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("complaints")
    .select(COMPLAINT_COLUMNS)
    .order("created_at", { ascending: false });

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
  const { data, error } = await admin
    .from("complaints")
    .update({
      status,
      assigned_to: cleanOptionalText(body.assigned_to),
      internal_note: cleanOptionalText(body.internal_note),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(COMPLAINT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: "ไม่สามารถอัปเดตข้อร้องเรียนได้" }, { status: 500 });
  }

  return NextResponse.json({ complaint: data });
}
