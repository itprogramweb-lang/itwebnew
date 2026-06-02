import { getAuthHeaders } from "./http";
import type { NavigationItem, NavigationLocation } from "@/types";

export type NavigationItemPayload = Partial<
  Pick<
    NavigationItem,
    | "label"
    | "href"
    | "type"
    | "parent_id"
    | "sort_order"
    | "is_active"
    | "is_external"
    | "location"
    | "target"
    | "description"
  >
>;

type NavigationListResponse = {
  navigation?: NavigationItem[];
  error?: string;
  setup_required?: boolean;
  message?: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) throw new Error(data.error || data.message || "เกิดข้อผิดพลาด");
  return data;
}

export async function fetchNavigationItems(): Promise<NavigationItem[]> {
  const data = await request<NavigationListResponse>("/api/admin/navigation");
  return data.navigation ?? [];
}

export async function createNavigationItem(payload: NavigationItemPayload): Promise<NavigationItem> {
  const data = await request<{ navigation_item: NavigationItem }>("/api/admin/navigation", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.navigation_item;
}

export async function updateNavigationItem(
  id: string,
  payload: NavigationItemPayload
): Promise<NavigationItem> {
  const data = await request<{ navigation_item: NavigationItem }>(
    `/api/admin/navigation/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  return data.navigation_item;
}

export async function hideNavigationItem(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/admin/navigation/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function deleteNavigationItem(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/admin/navigation/${encodeURIComponent(id)}?mode=hard`, {
    method: "DELETE",
  });
}

export async function resetNavigationItems(payload?: {
  location?: NavigationLocation | "all";
}): Promise<NavigationItem[]> {
  const data = await request<{ ok: boolean; reset_count: number; navigation: NavigationItem[] }>(
    "/api/admin/navigation/reset",
    {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }
  );
  return data.navigation ?? [];
}
