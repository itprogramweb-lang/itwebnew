import "server-only";

import crypto from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const SITE_MEDIA_BUCKET = "site-media";

const IMAGE_CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type UploadSiteMediaParams = {
  body: Buffer | Uint8Array;
  contentType: string;
  prefix: string;
  filenameHint?: string;
};

export type SiteMediaUploadResult = {
  bucket: string;
  objectPath: string;
  publicUrl: string;
  contentType: string;
  bytes: number;
  extension: string;
};

export class SiteMediaConfigError extends Error {
  constructor(message = "Missing Supabase storage env vars.") {
    super(message);
    this.name = "SiteMediaConfigError";
  }
}

export class SiteMediaUploadError extends Error {
  causeDetails?: unknown;

  constructor(message: string, causeDetails?: unknown) {
    super(message);
    this.name = "SiteMediaUploadError";
    this.causeDetails = causeDetails;
  }
}

function sanitizeSegment(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function sanitizePrefix(prefix: string) {
  const normalized = prefix.replace(/\\/g, "/").trim().replace(/^\/+|\/+$/g, "");
  if (!normalized) {
    throw new SiteMediaUploadError("Storage prefix is required");
  }

  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new SiteMediaUploadError("Storage prefix is not safe");
  }

  const sanitizedSegments = segments.map(sanitizeSegment);
  if (sanitizedSegments.some((segment) => !segment)) {
    throw new SiteMediaUploadError("Storage prefix is not safe");
  }

  return sanitizedSegments.join("/");
}

function resolveImageExtension(contentType: string) {
  const extension = IMAGE_CONTENT_TYPE_TO_EXTENSION[contentType];
  if (!extension) {
    throw new SiteMediaUploadError("Unsupported image content type");
  }
  return extension;
}

function resolvePdfExtension(contentType: string) {
  if (contentType !== "application/pdf") {
    throw new SiteMediaUploadError("Unsupported PDF content type");
  }
  return "pdf";
}

function resolveExtension(contentType: string) {
  if (contentType.startsWith("image/")) return resolveImageExtension(contentType);
  return resolvePdfExtension(contentType);
}

function ensureUploadInput(body: Buffer | Uint8Array, contentType: string) {
  if (!(body instanceof Uint8Array) || body.byteLength === 0) {
    throw new SiteMediaUploadError("Upload body is empty");
  }
  if (!contentType || /[\u0000-\u001f\u007f]/.test(contentType)) {
    throw new SiteMediaUploadError("Upload content type is invalid");
  }
}

function buildObjectPath(prefix: string, extension: string, filenameHint?: string) {
  const date = new Date().toISOString().slice(0, 10);
  const [year, month] = date.split("-");
  const safePrefix = sanitizePrefix(prefix);
  const safeHint = filenameHint ? sanitizeSegment(filenameHint) : "";
  const randomId = crypto.randomUUID();
  const baseName = safeHint ? `${safeHint}-${randomId}` : randomId;
  return `${safePrefix}/${year}/${month}/${baseName}.${extension}`;
}

function getConfiguredSupabaseOrigin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new SiteMediaConfigError();
  }

  try {
    return new URL(supabaseUrl).origin;
  } catch {
    throw new SiteMediaConfigError("Supabase URL is invalid");
  }
}

function ensurePublicUrl(value: string, expectedOrigin: string) {
  try {
    const url = new URL(value);
    if (!/^https?:$/i.test(url.protocol)) {
      throw new SiteMediaUploadError("Storage public URL protocol is invalid");
    }
    if (url.origin !== expectedOrigin) {
      throw new SiteMediaUploadError("Storage public URL origin is invalid");
    }
    if (!url.pathname.includes(`/storage/v1/object/public/${SITE_MEDIA_BUCKET}/`)) {
      throw new SiteMediaUploadError("Storage public URL path is invalid");
    }
    return url.toString();
  } catch (error) {
    if (error instanceof SiteMediaUploadError) throw error;
    throw new SiteMediaUploadError("Storage public URL is invalid");
  }
}

export async function uploadToSiteMedia({
  body,
  contentType,
  prefix,
  filenameHint,
}: UploadSiteMediaParams): Promise<SiteMediaUploadResult> {
  ensureUploadInput(body, contentType);
  const extension = resolveExtension(contentType);
  const objectPath = buildObjectPath(prefix, extension, filenameHint);
  const expectedOrigin = getConfiguredSupabaseOrigin();

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    throw new SiteMediaConfigError(
      error instanceof Error ? error.message : "Missing Supabase storage env vars."
    );
  }

  const uploadResult = await admin.storage.from(SITE_MEDIA_BUCKET).upload(objectPath, body, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });

  if (uploadResult.error) {
    throw new SiteMediaUploadError("Storage upload failed", uploadResult.error);
  }

  const publicUrlResult = admin.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(objectPath);
  const publicUrl = ensurePublicUrl(publicUrlResult.data.publicUrl, expectedOrigin);

  return {
    bucket: SITE_MEDIA_BUCKET,
    objectPath,
    publicUrl,
    contentType,
    bytes: body.byteLength,
    extension,
  };
}
