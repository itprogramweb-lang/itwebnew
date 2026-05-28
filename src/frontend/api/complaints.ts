import { getAuthHeaders } from "./http";

export type ComplaintsApiResponse = {
  complaints?: unknown[];
  complaint?: unknown;
  permissions?: { canUpdate: boolean };
  error?: string;
};

export async function loadComplaints(): Promise<ComplaintsApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/complaints", { headers });
  const data = (await res.json()) as ComplaintsApiResponse;
  if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดข้อร้องเรียนได้");
  return data;
}

export async function updateComplaint(payload: {
  id: string;
  status: string;
  assigned_to: string;
  internal_note: string;
}): Promise<ComplaintsApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/complaints", {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as ComplaintsApiResponse;
  if (!res.ok || !data.complaint) throw new Error(data.error || "ไม่สามารถบันทึกข้อร้องเรียนได้");
  return data;
}
