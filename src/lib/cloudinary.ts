import "server-only";

import { uploadToSiteMedia } from "@/lib/storageUpload";

const IMAGE_PREFIX_BY_FOLDER: Record<string, string> = {
  uploads: "uploads/images/uploads",
  logos: "uploads/images/logos",
  news: "uploads/images/news",
  "news/content": "uploads/images/news/content",
  apply: "uploads/images/apply",
  programs: "uploads/images/programs",
  staff: "uploads/images/staff",
  "student-works": "uploads/images/student-works",
  "teacher-works": "uploads/images/teacher-works",
  "hero-slides": "uploads/images/hero-slides",
  "page-heroes": "uploads/images/page-heroes",
  facilities: "uploads/images/facilities",
  "facilities/gallery": "uploads/images/facilities/gallery",
  complaints: "uploads/complaints/attachments",
  "line-news": "uploads/line-news/covers",
};

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export async function uploadToCloudinary(
  buffer: Buffer,
  options: { folder?: string; publicId?: string; contentType?: string } = {}
): Promise<CloudinaryUploadResult> {
  const folder = options.folder?.trim() || "uploads";
  const prefix = IMAGE_PREFIX_BY_FOLDER[folder];
  if (!prefix) {
    throw new Error("Unsupported image upload folder");
  }
  if (!options.contentType) {
    throw new Error("Missing image content type");
  }

  const uploaded = await uploadToSiteMedia({
    body: buffer,
    contentType: options.contentType,
    prefix,
    filenameHint: options.publicId,
  });

  return {
    secure_url: uploaded.publicUrl,
    public_id: uploaded.objectPath,
    width: 0,
    height: 0,
    format: uploaded.extension,
    bytes: uploaded.bytes,
  };
}
