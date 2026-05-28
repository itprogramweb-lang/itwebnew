import { getAuthHeaders } from "./http";
import type { TeacherWorkRow } from "@/lib/supabase/queries";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || "เกิดข้อผิดพลาด");
  return data;
}

export const teacherWorksApi = {
  async list(): Promise<TeacherWorkRow[]> {
    const data = await request<{ works: TeacherWorkRow[] }>("/api/admin/teacher-works");
    return data.works;
  },

  async create(payload: Record<string, unknown>): Promise<TeacherWorkRow> {
    const data = await request<{ work: TeacherWorkRow }>("/api/admin/teacher-works", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return data.work;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<TeacherWorkRow> {
    const data = await request<{ work: TeacherWorkRow }>("/api/admin/teacher-works", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    return data.work;
  },

  async remove(id: string): Promise<void> {
    await request<{ ok: boolean }>(`/api/admin/teacher-works?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
