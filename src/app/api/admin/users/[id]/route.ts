import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile, isAllowedUserRole, isSuperAdmin } from "@/lib/serverAuth";
import { normalizeRole } from "@/lib/roles";

type UpdatePayload = {
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
};

async function countActiveSuperAdmins() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("is_active", true);

  if (error) return 0;
  return count ?? 0;
}

async function getTargetProfile(id: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requester = await getAuthenticatedProfile(request);
  if (!requester) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(requester)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await getTargetProfile(params.id);
  if (!target) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  }

  const body = (await request.json()) as UpdatePayload;
  const nextRole = body.role ?? normalizeRole(target.role);
  const nextActive = typeof body.is_active === "boolean" ? body.is_active : target.is_active !== false;

  if (!isAllowedUserRole(nextRole)) {
    return NextResponse.json({ error: "role ไม่ถูกต้อง" }, { status: 400 });
  }

  const demotesOrDisablesSuperAdmin =
    target.role === "super_admin" && (nextRole !== "super_admin" || !nextActive);
  if (demotesOrDisablesSuperAdmin && (await countActiveSuperAdmins()) <= 1) {
    return NextResponse.json(
      { error: "ไม่สามารถแก้ไข super_admin คนสุดท้ายให้หมดสิทธิ์หรือปิดใช้งานได้" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(params.id, {
    app_metadata: { role: nextRole },
  });
  if (authError) {
    return NextResponse.json({ error: "ไม่สามารถอัปเดต Auth metadata ได้" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("profiles")
    .update({
      full_name: body.full_name?.trim() || target.full_name || target.email,
      role: nextRole,
      is_active: nextActive,
      status: nextActive ? "active" : "inactive",
    })
    .eq("id", params.id)
    .select("id,email,full_name,role,is_active,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "ไม่สามารถอัปเดตผู้ใช้งานได้" }, { status: 400 });
  }

  return NextResponse.json({ user: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requester = await getAuthenticatedProfile(request);
  if (!requester) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(requester)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await getTargetProfile(params.id);
  if (!target) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  }

  if (target.role === "super_admin" && target.is_active !== false && (await countActiveSuperAdmins()) <= 1) {
    return NextResponse.json(
      { error: "ไม่สามารถปิดใช้งาน super_admin คนสุดท้ายได้" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: false, status: "inactive" })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: "ไม่สามารถปิดใช้งานผู้ใช้งานได้" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
