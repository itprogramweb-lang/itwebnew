import "server-only";

import { uploadToCloudinary } from "@/lib/cloudinary";

export const LINE_NEWS_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const LINE_NEWS_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

export type LineNewsImageValidationResult =
  | { ok: true }
  | { ok: false; reason: "invalid_type" | "too_large" };

export function validateLineNewsImage(input: {
  contentType: string;
  size: number;
}): LineNewsImageValidationResult {
  if (
    !LINE_NEWS_IMAGE_ALLOWED_TYPES.includes(
      input.contentType as (typeof LINE_NEWS_IMAGE_ALLOWED_TYPES)[number]
    )
  ) {
    return { ok: false, reason: "invalid_type" };
  }

  if (input.size > LINE_NEWS_IMAGE_MAX_SIZE) {
    return { ok: false, reason: "too_large" };
  }

  return { ok: true };
}

export async function uploadLineNewsCoverImage(buffer: Buffer) {
  return uploadToCloudinary(buffer, { folder: "news" });
}
