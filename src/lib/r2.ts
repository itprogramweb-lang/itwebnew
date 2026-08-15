import "server-only";

import { uploadToSiteMedia } from "@/lib/storageUpload";

type UploadStudentWorkPdfParams = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
};

export type R2UploadErrorCode =
  | "AccessDenied"
  | "InvalidAccessKeyId"
  | "SignatureDoesNotMatch"
  | "NoSuchBucket"
  | "Unknown";

export type R2UploadErrorDetails = {
  name: string;
  code: R2UploadErrorCode;
  httpStatusCode: number | null;
  message: string;
  bucket: string;
  key: string;
};

export class R2ConfigError extends Error {
  constructor(message = "ตั้งค่าระบบจัดเก็บไฟล์ยังไม่ครบ") {
    super(message);
    this.name = "R2ConfigError";
  }
}

export class R2UploadError extends Error {
  details: R2UploadErrorDetails;

  constructor(details: R2UploadErrorDetails) {
    super(details.message);
    this.name = "R2UploadError";
    this.details = details;
  }
}

function isSafeR2Key(key: string) {
  if (!key || key.length > 512 || key.startsWith("/") || key.includes("\\")) return false;
  if (!key.toLowerCase().endsWith(".pdf")) return false;
  if (/[\u0000-\u001f\u007f]/.test(key)) return false;

  const segments = key.split("/");
  return segments.every((segment) => segment && segment !== "." && segment !== "..");
}

function sanitizeErrorMessage(message: unknown) {
  if (typeof message !== "string" || !message.trim()) return "Storage upload failed";
  return message.replace(/[A-Za-z0-9_+/-]{24,}/g, "[redacted]");
}

function toR2UploadError(error: unknown, key: string) {
  const details: R2UploadErrorDetails = {
    name: error instanceof Error ? error.name : "UnknownError",
    code: "Unknown",
    httpStatusCode: null,
    message: sanitizeErrorMessage(error instanceof Error ? error.message : null),
    bucket: "site-media",
    key,
  };

  return new R2UploadError(details);
}

async function uploadPdfToR2({ key, body, contentType }: UploadStudentWorkPdfParams) {
  if (!isSafeR2Key(key)) {
    throw new Error("Storage key ไม่ปลอดภัย");
  }

  try {
    const result = await uploadToSiteMedia({
      body,
      contentType: contentType || "application/pdf",
      prefix: `uploads/${key.replace(/\.pdf$/i, "")}`,
    });
    return result.publicUrl;
  } catch (error) {
    if (error instanceof Error && error.name === "SiteMediaConfigError") {
      throw new R2ConfigError();
    }
    throw toR2UploadError(error, key);
  }
}

export async function uploadStudentWorkPdf(params: UploadStudentWorkPdfParams) {
  return uploadPdfToR2(params);
}

export async function uploadTeacherWorkPdf(params: UploadStudentWorkPdfParams) {
  return uploadPdfToR2(params);
}
