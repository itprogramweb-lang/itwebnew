import { getAuthHeaders } from "./http";

export type ProgramsApiResponse = {
  programs?: unknown[];
  program?: unknown;
  error?: string;
};

export async function loadPrograms(): Promise<ProgramsApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/programs", { headers });
  const data = (await res.json()) as ProgramsApiResponse;
  if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดหลักสูตรได้");
  return data;
}

export async function saveProgram(payload: Record<string, unknown>, id?: string): Promise<ProgramsApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/programs", {
    method: id ? "PATCH" : "POST",
    headers,
    body: JSON.stringify(id ? { id, ...payload } : payload),
  });
  const data = (await res.json()) as ProgramsApiResponse;
  if (!res.ok || !data.program) throw new Error(data.error || "ไม่สามารถบันทึกหลักสูตรได้");
  return data;
}

export async function deleteProgram(id: string): Promise<ProgramsApiResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch(`/api/admin/programs?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers,
  });
  const data = (await res.json()) as ProgramsApiResponse;
  if (!res.ok || !data.program) throw new Error(data.error || "ไม่สามารถซ่อนหลักสูตรได้");
  return data;
}
