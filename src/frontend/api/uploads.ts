import { getAuthToken } from "./http";

export type UploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  error?: string;
};

export async function uploadImage(file: File, folder: string): Promise<UploadResult> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/admin/cloudinary/upload", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = (await res.json()) as UploadResult;
  if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
  return data;
}
