import { getAuthToken } from "./http";

export type PagesResponse = {
  pages?: unknown[];
  error?: string;
};

export async function loadPages(): Promise<PagesResponse> {
  const token = await getAuthToken();
  const res = await fetch("/api/admin/pages", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = (await res.json()) as PagesResponse;
  if (!res.ok) throw new Error((json.error as string) ?? "โหลดไม่สำเร็จ");
  return json;
}

export async function savePage(form: Record<string, unknown>): Promise<unknown> {
  const token = await getAuthToken();
  const res = await fetch("/api/admin/pages", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(form),
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json.error as string) ?? "บันทึกไม่สำเร็จ");
  return json;
}
