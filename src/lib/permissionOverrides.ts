import {
  isPermission,
  type PermissionOverrideEffect,
  type UserPermissionOverride,
} from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type PermissionOverrideRow = {
  permission: string | null;
  effect: string | null;
};

export type PermissionOverrideLoadResult = {
  overrides: UserPermissionOverride[];
  unavailable: boolean;
};

function isPermissionOverrideEffect(value: unknown): value is PermissionOverrideEffect {
  return value === "allow" || value === "deny";
}

function normalizePermissionOverride(
  row: PermissionOverrideRow
): UserPermissionOverride | null {
  if (!isPermission(row.permission)) return null;
  if (!isPermissionOverrideEffect(row.effect)) return null;

  return {
    permission: row.permission,
    effect: row.effect,
  };
}

export async function loadUserPermissionOverrides(
  userId: string | null | undefined
): Promise<UserPermissionOverride[]> {
  const result = await loadUserPermissionOverridesResult(userId);
  return result.overrides;
}

export async function loadUserPermissionOverridesResult(
  userId: string | null | undefined
): Promise<PermissionOverrideLoadResult> {
  if (!userId) return { overrides: [], unavailable: false };

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("user_permission_overrides")
      .select("permission,effect")
      .eq("user_id", userId);

    if (error || !data) {
      console.warn("Permission overrides unavailable; falling back to role permissions.");
      return { overrides: [], unavailable: true };
    }

    const overrides = data
      .map((row) => normalizePermissionOverride(row))
      .filter((override): override is UserPermissionOverride => override !== null);

    return { overrides, unavailable: false };
  } catch {
    console.warn("Permission overrides unavailable; falling back to role permissions.");
    return { overrides: [], unavailable: true };
  }
}
