import "server-only";

import { hasEffectivePermission } from "@/lib/permissions";
import { loadUserPermissionOverrides } from "@/lib/permissionOverrides";
import { isProfileActive, normalizeRole, type ProfileRow } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { UserRole } from "@/types";

type LineConnectionLookupRow = {
  user_id: string;
};

export type LineNewsPermissionResult =
  | { status: "not_linked" }
  | {
      status: "authorized";
      profile: ProfileRow & { role: UserRole };
      lineUserId: string;
    }
  | {
      status: "forbidden";
      profile: ProfileRow & { role: UserRole };
      lineUserId: string;
    };

export async function resolveLineNewsManager(
  lineUserId: string | null | undefined
): Promise<LineNewsPermissionResult> {
  if (!lineUserId) return { status: "not_linked" };

  const admin = createSupabaseAdminClient();
  const { data: connection, error: connectionError } = await admin
    .from("user_line_connections")
    .select("user_id")
    .eq("line_user_id", lineUserId)
    .is("revoked_at", null)
    .maybeSingle<LineConnectionLookupRow>();

  if (connectionError || !connection?.user_id) {
    return { status: "not_linked" };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,email,full_name,role,is_active,status,created_at")
    .eq("id", connection.user_id)
    .maybeSingle<ProfileRow>();

  if (profileError || !profile || !isProfileActive(profile)) {
    return { status: "not_linked" };
  }

  const normalizedProfile = {
    ...profile,
    role: normalizeRole(profile.role),
  };
  const overrides = await loadUserPermissionOverrides(profile.id);
  const canManageNews = hasEffectivePermission(
    normalizedProfile,
    "manage_news",
    overrides
  );

  if (!canManageNews) {
    return {
      status: "forbidden",
      profile: normalizedProfile,
      lineUserId,
    };
  }

  return {
    status: "authorized",
    profile: normalizedProfile,
    lineUserId,
  };
}
