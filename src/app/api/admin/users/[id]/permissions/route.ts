import { NextRequest, NextResponse } from "next/server";
import {
  allPermissions,
  getBasePermissionsForRole,
  getEffectivePermissionsForProfile,
  isPermission,
  type Permission,
  type PermissionOverrideEffect,
  type UserPermissionOverride,
} from "@/lib/permissions";
import { loadUserPermissionOverridesResult } from "@/lib/permissionOverrides";
import { normalizeRole } from "@/lib/roles";
import { requireEffectivePermission } from "@/lib/serverAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type TargetProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
  status?: string | null;
};

type OverridePayload = {
  permission?: unknown;
  effect?: unknown;
};

const PERMISSION_TABLE_UNAVAILABLE =
  "ยังไม่ได้ติดตั้งตาราง custom permissions";
const PERMISSION_MANAGEMENT_NOT_CONFIGURED =
  "Permission management is not configured on the server.";

function isAdminClientConfigError(error: unknown) {
  return error instanceof Error && error.message.includes("Missing Supabase admin env vars");
}

function isPermissionOverrideEffect(value: unknown): value is PermissionOverrideEffect {
  return value === "allow" || value === "deny";
}

async function requirePermissionManager(request: NextRequest) {
  try {
    const auth = await requireEffectivePermission(request, "manage_permissions");
    if (auth.error) return { error: auth.error, requester: undefined };
    return { requester: auth.profile, error: undefined };
  } catch (error) {
    if (isAdminClientConfigError(error)) {
      return {
        error: NextResponse.json(
          { error: PERMISSION_MANAGEMENT_NOT_CONFIGURED },
          { status: 500 }
        ),
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
        error: NextResponse.json(
          { error: PERMISSION_MANAGEMENT_NOT_CONFIGURED },
          { status: 500 }
        ),
      };
    }
    throw error;
  }
}

async function getTargetProfile(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string
) {
  const { data, error } = await admin
    .from("profiles")
    .select("id,email,full_name,role,is_active,status")
    .eq("id", id)
    .maybeSingle();

  if (error) return { error };
  return { target: data as TargetProfile | null };
}

function safeUser(profile: TargetProfile) {
  return {
    id: profile.id,
    email: profile.email ?? "",
    full_name: profile.full_name ?? "",
    role: normalizeRole(profile.role),
    is_active: profile.is_active !== false,
  };
}

function permissionResponse(
  target: TargetProfile,
  overrides: readonly UserPermissionOverride[],
  warning?: string
) {
  const basePermissions = [...getBasePermissionsForRole(target.role)];
  const effectivePermissions = getEffectivePermissionsForProfile(target, overrides);

  return {
    user: safeUser(target),
    base_permissions: basePermissions,
    overrides,
    effective_permissions: effectivePermissions,
    all_permissions: [...allPermissions],
    ...(warning ? { warning } : {}),
  };
}

function validateOverrides(value: unknown):
  | { overrides: UserPermissionOverride[] }
  | { error: NextResponse } {
  if (!Array.isArray(value)) {
    return {
      error: NextResponse.json(
        { error: "รูปแบบ overrides ไม่ถูกต้อง" },
        { status: 400 }
      ),
    };
  }

  const seen = new Set<Permission>();
  const overrides: UserPermissionOverride[] = [];

  for (const item of value) {
    const override = item as OverridePayload;

    if (!isPermission(override.permission)) {
      return {
        error: NextResponse.json(
          { error: "permission ไม่ถูกต้องหรือไม่อยู่ในระบบ" },
          { status: 400 }
        ),
      };
    }

    if (!isPermissionOverrideEffect(override.effect)) {
      return {
        error: NextResponse.json(
          { error: "effect ต้องเป็น allow หรือ deny เท่านั้น" },
          { status: 400 }
        ),
      };
    }

    if (seen.has(override.permission)) {
      return {
        error: NextResponse.json(
          { error: "มี permission ซ้ำในรายการ overrides" },
          { status: 400 }
        ),
      };
    }

    seen.add(override.permission);
    overrides.push({
      permission: override.permission,
      effect: override.effect,
    });
  }

  return { overrides };
}

async function readStoredOverrides(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string
) {
  const { data, error } = await admin
    .from("user_permission_overrides")
    .select("permission,effect")
    .eq("user_id", userId);

  if (error) return { error };

  const overrides = (data ?? [])
    .map((row) => ({
      permission: row.permission,
      effect: row.effect,
    }))
    .filter(
      (override): override is UserPermissionOverride =>
        isPermission(override.permission) && isPermissionOverrideEffect(override.effect)
    );

  return { overrides };
}

async function replaceOverrides(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  targetUserId: string,
  actorUserId: string,
  overrides: readonly UserPermissionOverride[],
  previousOverrides: readonly UserPermissionOverride[]
) {
  const { error: deleteError } = await admin
    .from("user_permission_overrides")
    .delete()
    .eq("user_id", targetUserId);

  if (deleteError) return { error: deleteError };

  if (overrides.length === 0) return { ok: true };

  const rows = overrides.map((override) => ({
    user_id: targetUserId,
    permission: override.permission,
    effect: override.effect,
    created_by: actorUserId,
    updated_by: actorUserId,
  }));

  const { error: insertError } = await admin
    .from("user_permission_overrides")
    .insert(rows);

  if (!insertError) return { ok: true };

  if (previousOverrides.length > 0) {
    const restoreRows = previousOverrides.map((override) => ({
      user_id: targetUserId,
      permission: override.permission,
      effect: override.effect,
      created_by: actorUserId,
      updated_by: actorUserId,
    }));
    const { error: restoreError } = await admin
      .from("user_permission_overrides")
      .insert(restoreRows);

    if (restoreError) {
      console.warn("Permission override restore failed after write error.");
    }
  }

  return { error: insertError };
}

async function insertAuditLog(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  targetUserId: string,
  actorUserId: string,
  previousCount: number,
  newCount: number
) {
  const { error } = await admin.from("user_permission_audit_logs").insert({
    target_user_id: targetUserId,
    actor_user_id: actorUserId,
    action: "bulk_replace_overrides",
    metadata: {
      previous_count: previousCount,
      new_count: newCount,
    },
  });

  return error;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermissionManager(request);
  if (auth.error) return auth.error;

  const adminResult = getAdminClientOrResponse();
  if (adminResult.error) return adminResult.error;
  const admin = adminResult.admin;

  const targetResult = await getTargetProfile(admin, params.id);
  if (targetResult.error) {
    return NextResponse.json({ error: "ไม่สามารถโหลดผู้ใช้งานได้" }, { status: 500 });
  }
  if (!targetResult.target) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  }

  const overrideResult = await loadUserPermissionOverridesResult(params.id);
  const warning = overrideResult.unavailable
    ? "permission override table is not available; using role-based permissions"
    : undefined;

  return NextResponse.json(
    permissionResponse(targetResult.target, overrideResult.overrides, warning)
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requirePermissionManager(request);
  if (auth.error) return auth.error;

  const adminResult = getAdminClientOrResponse();
  if (adminResult.error) return adminResult.error;
  const admin = adminResult.admin;

  const targetResult = await getTargetProfile(admin, params.id);
  if (targetResult.error) {
    return NextResponse.json({ error: "ไม่สามารถโหลดผู้ใช้งานได้" }, { status: 500 });
  }
  const target = targetResult.target;
  if (!target) {
    return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
  }

  if (normalizeRole(target.role) === "super_admin") {
    return NextResponse.json(
      { error: "ไม่สามารถปรับสิทธิ์ custom ของ Super Admin ได้" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON body ไม่ถูกต้อง" }, { status: 400 });
  }

  const overridesValue = (body as { overrides?: unknown })?.overrides;
  const validation = validateOverrides(overridesValue);
  if ("error" in validation) return validation.error;
  const { overrides } = validation;

  const isSelfUpdate = auth.requester.id === params.id;
  if (
    isSelfUpdate &&
    overrides.some(
      (override) =>
        override.effect === "deny" &&
        (override.permission === "manage_permissions" ||
          override.permission === "manage_users")
    )
  ) {
    return NextResponse.json(
      { error: "ไม่สามารถลดสิทธิ์สำคัญของบัญชีตัวเองได้" },
      { status: 400 }
    );
  }

  const previousResult = await readStoredOverrides(admin, params.id);
  if (previousResult.error) {
    return NextResponse.json(
      { error: PERMISSION_TABLE_UNAVAILABLE },
      { status: 409 }
    );
  }
  const previousOverrides = previousResult.overrides ?? [];

  const replaceResult = await replaceOverrides(
    admin,
    params.id,
    auth.requester.id,
    overrides,
    previousOverrides
  );

  if (replaceResult.error) {
    return NextResponse.json(
      { error: "ไม่สามารถบันทึก custom permissions ได้" },
      { status: 500 }
    );
  }

  const auditError = await insertAuditLog(
    admin,
    params.id,
    auth.requester.id,
    previousOverrides.length,
    overrides.length
  );
  const auditWarning = auditError
    ? "บันทึก custom permissions สำเร็จ แต่ไม่สามารถเขียน audit log ได้"
    : undefined;

  return NextResponse.json({
    ...permissionResponse(target, overrides),
    ...(auditWarning ? { audit_warning: auditWarning } : {}),
  });
}
