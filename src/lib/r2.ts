import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

type R2Config =
  | { ok: true; bucket: string; endpoint: string; accessKeyId: string; secretAccessKey: string }
  | { ok: false; missing: string[] };

const REQUIRED_ENV = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
  "NEXT_PUBLIC_STUDENT_WORKS_STORAGE_BASE_URL",
] as const;

let client: S3Client | null = null;

export class R2ConfigError extends Error {
  constructor() {
    super("ตั้งค่า Cloudflare R2 ยังไม่ครบ");
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

export function getR2ConfigStatus(): R2Config {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    bucket: process.env.R2_BUCKET_NAME?.trim() || "student-works",
    endpoint: process.env.R2_ENDPOINT!.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
  };
}

function getClient(config: Extract<R2Config, { ok: true }>) {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return client;
}

function isSafeR2Key(key: string) {
  if (!key || key.length > 512 || key.startsWith("/") || key.includes("\\")) return false;
  if (!key.toLowerCase().endsWith(".pdf")) return false;
  if (/[\u0000-\u001f\u007f]/.test(key)) return false;

  const segments = key.split("/");
  return segments.every((segment) => segment && segment !== "." && segment !== "..");
}

function sanitizeErrorMessage(message: unknown) {
  if (typeof message !== "string" || !message.trim()) return "R2 upload failed";
  return message.replace(/[A-Za-z0-9_+/-]{24,}/g, "[redacted]");
}

function getErrorStringValue(error: unknown, key: string) {
  if (!error || typeof error !== "object") return null;
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function getR2UploadErrorCode(error: unknown): R2UploadErrorCode {
  const rawCode = getErrorStringValue(error, "Code") ?? getErrorStringValue(error, "code");
  const name = error instanceof Error ? error.name : null;
  const candidate = rawCode ?? name;

  if (
    candidate === "AccessDenied" ||
    candidate === "InvalidAccessKeyId" ||
    candidate === "SignatureDoesNotMatch" ||
    candidate === "NoSuchBucket"
  ) {
    return candidate;
  }

  return "Unknown";
}

function getHttpStatusCode(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const metadata = (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata;
  return typeof metadata?.httpStatusCode === "number" ? metadata.httpStatusCode : null;
}

function toR2UploadError(error: unknown, bucket: string, key: string) {
  const details: R2UploadErrorDetails = {
    name: error instanceof Error ? error.name : "UnknownError",
    code: getR2UploadErrorCode(error),
    httpStatusCode: getHttpStatusCode(error),
    message: sanitizeErrorMessage(error instanceof Error ? error.message : null),
    bucket,
    key,
  };

  // บันทึกเฉพาะข้อมูลที่ปลอดภัย ห้ามบันทึก access key หรือ secret key
  console.error("Student work PDF upload failed", details);

  return new R2UploadError(details);
}

async function uploadPdfToR2({ key, body, contentType }: UploadStudentWorkPdfParams) {
  const config = getR2ConfigStatus();
  if (!config.ok) {
    // เก็บเฉพาะชื่อ env ที่ขาดเพื่อดีบัก โดยไม่แสดงค่าลับ
    console.warn("Cloudflare R2 config missing:", config.missing.join(", "));
    throw new R2ConfigError();
  }

  if (!isSafeR2Key(key)) {
    throw new Error("R2 key ไม่ปลอดภัย");
  }

  try {
    await getClient(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType || "application/pdf",
      })
    );
  } catch (error) {
    throw toR2UploadError(error, config.bucket, key);
  }

  return key;
}

export async function uploadStudentWorkPdf(params: UploadStudentWorkPdfParams) {
  return uploadPdfToR2(params);
}

export async function uploadTeacherWorkPdf(params: UploadStudentWorkPdfParams) {
  return uploadPdfToR2(params);
}
