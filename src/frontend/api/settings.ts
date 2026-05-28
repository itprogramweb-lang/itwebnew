import { getAuthHeaders } from "./http";

export type SiteSettingsResponse = {
  settings: (Record<string, unknown> & { id: string }) | null;
  error?: string;
};

export async function loadSettings(): Promise<SiteSettingsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/settings", { headers });
  const data = (await res.json()) as SiteSettingsResponse;
  if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดข้อมูลเว็บไซต์ได้");
  return data;
}

export async function saveSettings(form: Record<string, unknown>): Promise<SiteSettingsResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers,
    body: JSON.stringify(form),
  });
  const data = (await res.json()) as SiteSettingsResponse;
  if (!res.ok) throw new Error(data.error || "บันทึกข้อมูลเว็บไซต์ไม่สำเร็จ");
  return data;
}
