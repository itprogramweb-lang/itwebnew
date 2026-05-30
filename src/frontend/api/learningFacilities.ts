import { getAuthHeaders } from "./http";

export type LearningFacilityGalleryImage = {
  url: string;
  alt?: string | null;
  caption?: string | null;
  sort_order?: number;
};

export type LearningFacilityRow = {
  id: string;
  type: string;
  title: string;
  slug: string | null;

  short_description: string | null;
  description: string | null;

  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_image_crop: unknown | null;

  gallery_images: LearningFacilityGalleryImage[] | null;

  location: string | null;
  capacity: string | null;

  highlights: string[] | null;
  equipment_list: string[] | null;

  is_featured: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;

  created_at: string | null;
  updated_at: string | null;
};

export type LearningFacilitiesApiResponse = {
  facilities?: LearningFacilityRow[];
  facility?: LearningFacilityRow;
  error?: string;
};

export async function loadLearningFacilities(): Promise<LearningFacilitiesApiResponse> {
  const headers = await getAuthHeaders();

  const res = await fetch("/api/admin/learning-facilities", {
    headers,
  });

  const data = (await res.json()) as LearningFacilitiesApiResponse;

  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถโหลดข้อมูลได้");
  }

  return data;
}

export async function saveLearningFacility(
  payload: Record<string, unknown>,
  id?: string
): Promise<LearningFacilitiesApiResponse> {
  const headers = await getAuthHeaders();

  const res = await fetch("/api/admin/learning-facilities", {
    method: id ? "PATCH" : "POST",
    headers,
    body: JSON.stringify(id ? { id, ...payload } : payload),
  });

  const data = (await res.json()) as LearningFacilitiesApiResponse;

  if (!res.ok || !data.facility) {
    throw new Error(data.error || "ไม่สามารถบันทึกข้อมูลได้");
  }

  return data;
}

export async function deleteLearningFacility(
  id: string,
  mode: "hide" | "delete" = "hide"
): Promise<LearningFacilitiesApiResponse> {
  const headers = await getAuthHeaders();

  const res = await fetch(
    `/api/admin/learning-facilities?id=${encodeURIComponent(id)}&mode=${mode}`,
    {
      method: "DELETE",
      headers,
    }
  );

  const data = (await res.json()) as LearningFacilitiesApiResponse;

  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถลบ/ซ่อนข้อมูลได้");
  }

  return data;
}