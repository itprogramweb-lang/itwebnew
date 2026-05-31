import { getAuthHeaders } from "./http";

export type UsersApiResponse = {
  users?: unknown[];
  user?: unknown;
  error?: string;
};

export type PermissionOverrideEffect = "allow" | "deny";

export type UserPermissionOverride = {
  permission: string;
  effect: PermissionOverrideEffect;
};

export type UserPermissionsResponse = {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
  };
  base_permissions: string[];
  overrides: UserPermissionOverride[];
  effective_permissions: string[];
  all_permissions: string[];
  warning?: string;
  audit_warning?: string;
  error?: string;
};

export class UsersApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UsersApiError";
    this.status = status;
  }
}

export async function loadUsers(): Promise<UsersApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/users", { headers });
  const data = await res.json() as UsersApiResponse;
  if (!res.ok) throw new Error((data.error as string) || "ไม่สามารถโหลดผู้ใช้งานได้");
  return data;
}

export async function createUser(form: Record<string, unknown>): Promise<UsersApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers,
    body: JSON.stringify(form),
  });
  const data = await res.json() as UsersApiResponse;
  if (!res.ok) throw new Error((data.error as string) || "ไม่สามารถบันทึกผู้ใช้งานได้");
  return data;
}

export async function updateUser(id: string, patch: Record<string, unknown>): Promise<UsersApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patch),
  });
  const data = await res.json() as UsersApiResponse;
  if (!res.ok) throw new Error((data.error as string) || "ไม่สามารถบันทึกผู้ใช้งานได้");
  return data;
}

export async function deactivateUser(id: string): Promise<UsersApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ is_active: false }),
  });
  const data = await res.json() as UsersApiResponse;
  if (!res.ok) throw new Error((data.error as string) || "ไม่สามารถปิดใช้งานผู้ใช้ได้");
  return data;
}

export async function deleteUserPermanently(id: string): Promise<UsersApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json() as UsersApiResponse;
  if (!res.ok) throw new Error((data.error as string) || "ไม่สามารถลบผู้ใช้ถาวรได้");
  return data;
}

export async function getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/users/${userId}/permissions`, { headers });
  const data = (await res.json()) as UserPermissionsResponse;
  if (!res.ok) {
    throw new UsersApiError(data.error || "ไม่สามารถโหลด custom permissions ได้", res.status);
  }
  return data;
}

export async function updateUserPermissions(
  userId: string,
  overrides: UserPermissionOverride[]
): Promise<UserPermissionsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/users/${userId}/permissions`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ overrides }),
  });
  const data = (await res.json()) as UserPermissionsResponse;
  if (!res.ok) {
    throw new UsersApiError(data.error || "ไม่สามารถบันทึก custom permissions ได้", res.status);
  }
  return data;
}
