import { getAuthHeaders } from "./http";
import type { StaffMemberRow } from "@/lib/supabase/queries";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();

  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });

  const data = (await res.json()) as T & { error?: string };

  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "เกิดข้อผิดพลาด");
  }

  return data;
}

export const staffApi = {
  async list(): Promise<StaffMemberRow[]> {
    const data = await request<{ staff: StaffMemberRow[] }>("/api/admin/staff");
    return data.staff;
  },

  async create(payload: Record<string, unknown>): Promise<StaffMemberRow> {
    const data = await request<{ member: StaffMemberRow }>("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return data.member;
  },

  async update(id: string, payload: Record<string, unknown>): Promise<StaffMemberRow> {
    const data = await request<{ member: StaffMemberRow }>("/api/admin/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });

    return data.member;
  },

  // ซ่อนบุคลากร: soft delete
  async hide(id: string): Promise<void> {
    await request<{ ok: boolean }>(`/api/admin/staff?id=${encodeURIComponent(id)}&mode=hide`, {
      method: "DELETE",
    });
  },

  // ลบบุคลากรถาวร: hard delete
  async deletePermanent(id: string): Promise<void> {
    await request<{ ok: boolean }>(`/api/admin/staff?id=${encodeURIComponent(id)}&mode=delete`, {
      method: "DELETE",
    });
  },

  // เก็บไว้กันโค้ดเก่าเรียกใช้ remove
  async remove(id: string): Promise<void> {
    return this.hide(id);
  },
};