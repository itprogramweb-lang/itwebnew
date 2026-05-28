import { getAuthHeaders } from "./http";

type Slide = Record<string, unknown>;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || "เกิดข้อผิดพลาด");
  return data;
}

export const heroSlidesApi = {
  async list(): Promise<Slide[]> {
    const data = await request<{ slides: Slide[] }>("/api/admin/hero-slides");
    return data.slides;
  },

  async create(payload: Record<string, unknown>): Promise<Slide> {
    const data = await request<{ slide: Slide }>("/api/admin/hero-slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.slide;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<Slide> {
    const data = await request<{ slide: Slide }>("/api/admin/hero-slides", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    return data.slide;
  },

  async remove(id: string): Promise<void> {
    await request<{ ok: boolean }>(`/api/admin/hero-slides?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
