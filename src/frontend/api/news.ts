import { getAuthHeaders } from "./http";

export type NewsApiResponse = {
  news?: unknown[];
  newsItem?: unknown;
  error?: string;
};

export async function loadNews(): Promise<NewsApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/news", { headers });
  const data = (await res.json()) as NewsApiResponse;
  if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดข่าวได้");
  return data;
}

export async function saveNews(payload: Record<string, unknown>, id?: string): Promise<NewsApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/news", {
    method: id ? "PATCH" : "POST",
    headers,
    body: JSON.stringify(id ? { id, ...payload } : payload),
  });
  const data = (await res.json()) as NewsApiResponse;
  if (!res.ok || !data.newsItem) throw new Error(data.error || "ไม่สามารถบันทึกข่าวได้");
  return data;
}

export async function deleteNews(id: string): Promise<NewsApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/news?id=${encodeURIComponent(id)}`, { method: "DELETE", headers });
  const data = (await res.json()) as NewsApiResponse;
  if (!res.ok || !data.newsItem) throw new Error(data.error || "ไม่สามารถซ่อนข่าวได้");
  return data;
}
