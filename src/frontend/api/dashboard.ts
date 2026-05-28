import { getAuthHeaders } from "./http";

export type DashboardResponse = {
  counts?: {
    heroSlides: number;
    staff: number;
    programs: number;
    studentWorks: number;
    teacherWorks: number;
    complaints: number;
    newComplaints: number;
    news: number;
  };
  recent?: {
    complaints: {
      id: string;
      tracking_code: string | null;
      complaint_type: string | null;
      title: string;
      status: string | null;
      created_at: string | null;
    }[];
    news: {
      id: string;
      title: string;
      category: string | null;
      status: string | null;
      published_at: string | null;
      created_at: string | null;
    }[];
  };
  error?: string;
};

export async function loadDashboard(): Promise<DashboardResponse> {
  const headers = await getAuthHeaders();
  const res = await fetch("/api/admin/dashboard", { headers });
  const json = (await res.json()) as DashboardResponse;
  if (!res.ok) throw new Error(json.error || "ไม่สามารถโหลดข้อมูลภาพรวมได้");
  return json;
}
