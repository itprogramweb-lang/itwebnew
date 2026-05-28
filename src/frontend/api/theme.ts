import { getAuthHeaders } from "./http";

type ThemeSettings = {
  id: string;
  theme: Record<string, unknown>;
  design_tokens: Record<string, unknown>;
} | null;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || "เกิดข้อผิดพลาด");
  return data;
}

export const themeApi = {
  async load(): Promise<ThemeSettings> {
    const data = await request<{ settings: ThemeSettings }>("/api/admin/theme");
    return data.settings;
  },

  async save(payload: { theme: Record<string, unknown>; design_tokens: Record<string, unknown> }): Promise<void> {
    await request<{ ok: boolean }>("/api/admin/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};
