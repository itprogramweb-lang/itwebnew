import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isAllowedUserRole, requireEffectivePermission } from "@/lib/serverAuth";
import { normalizeRole } from "@/lib/roles";

type UpdatePayload = {
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
};

const USER_MANAGEMENT_NOT_CONFIGURED = "User management is not configured on the server.";

function isAdminClientConfigError(error: unknown) {
  return error instanceof Error && error.message.includes("Missing Supabase admin env vars");
}

async function requireUserManager(request: NextRequest) {
  try {
    const auth = await requireEffectivePermission(request, "manage_users");
    if (auth.error) return { error: auth.error, requester: undefined };
    return { requester: auth.profile, error: undefined };
  } catch (error) {
    if (isAdminClientConfigError(error)) {
      return {
        error: NextResponse.json({ error: USER_MANAGEMENT_NOT_CONFIGURED }, { status: 500 }),
      };
    }
    throw error;
  }
}

function getAdminClientOrResponse() {
  try {
    return { admin: createSupabaseAdminClient() };
  } catch (error) {
    if (isAdminClientConfigError(error)) {
      return {
        error: NextResponse.json({ error: USER_MANAGEMENT_NOT_CONFIGURED }, { status: 500 }),
      };
    }
    throw error;
  }
}

const superAdminRoleValues = ["super_admin", "superadmin", "super-admin"];

async function countActiveSuperAdmins(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  excludeId?: string
) {
  let query = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", superAdminRoleValues)
    .eq("is_active", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;

  if (error) return 0;
  return count ?? 0;
}

async function getTargetProfile(admin: ReturnType<typeof createSupabaseAdminClient>, id: string) {
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
  const auth = await requireUserManager(request);
  if (auth.error) return auth.error;

  const adminResult = getAdminClientOrResponse();
  if (adminResult.error) return adminResult.error;
  const admin = adminResult.admin;

  const target = await getTargetProfile(admin, params.id);
  if (!target) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  }

  const body = (await request.json()) as UpdatePayload;
  const nextRole = body.role ?? normalizeRole(target.role);
  const nextActive = typeof body.is_active === "boolean" ? body.is_active : target.is_active !== false;

  if (!isAllowedUserRole(nextRole)) {
    return NextResponse.json({ error: "role ไม่ถูกต้อง" }, { status: 400 });
  }

  const targetRole = normalizeRole(target.role);
  const demotesOrDisablesSuperAdmin =
    targetRole === "super_admin" && target.is_active !== false && (nextRole !== "super_admin" || !nextActive);
  if (demotesOrDisablesSuperAdmin && (await countActiveSuperAdmins(admin, params.id)) <= 0) {
    return NextResponse.json(
      { error: "ไม่สามารถแก้ไข super_admin คนสุดท้ายให้หมดสิทธิ์หรือปิดใช้งานได้" },
      { status: 400 }
    );
  }

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
  const auth = await requireUserManager(request);
  if (auth.error) return auth.error;

  const adminResult = getAdminClientOrResponse();
  if (adminResult.error) return adminResult.error;
  const admin = adminResult.admin;

  const target = await getTargetProfile(admin, params.id);
  if (!target) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  }

  if (auth.requester.id === params.id) {
    return NextResponse.json(
      { error: "ไม่สามารถลบบัญชีของตัวเองได้" },
      { status: 400 }
    );
  }

  const targetRole = normalizeRole(target.role);
  if (targetRole === "super_admin" && target.is_active !== false && (await countActiveSuperAdmins(admin, params.id)) <= 0) {
    return NextResponse.json(
      { error: "ไม่สามารถลบ super admin คนสุดท้ายได้" },
      { status: 400 }
    );
  }

  const { error: authError } = await admin.auth.admin.deleteUser(params.id);
  if (authError) {
    return NextResponse.json({ error: "ไม่สามารถลบบัญชี Auth ได้" }, { status: 400 });
  }

  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", params.id);

  if (profileError) {
    return NextResponse.json({ error: "ลบบัญชี Auth แล้ว แต่ไม่สามารถลบ profile ได้" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: true });
}
