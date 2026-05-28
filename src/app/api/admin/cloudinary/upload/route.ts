import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedProfile } from "@/lib/serverAuth";
import { can } from "@/lib/permissions";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FOLDERS = new Set([
  "uploads",
  "logos",
  "news",
  "apply",
  "programs",
  "staff",
  "student-works",
  "teacher-works",
  "hero-slides",
  "page-heroes",
]);

export async function POST(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canUpload = [
    "super_admin",
    "website_admin",
    "staff",
    "teacher",
  ].includes(profile.role);
  if (!canUpload) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถอ่าน form data ได้" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const rawFolder =
    (formData.get("folder") as string) ||
    request.nextUrl.searchParams.get("folder") ||
    "uploads";
  const folder = ALLOWED_FOLDERS.has(rawFolder) ? rawFolder : "uploads";

  if (!file) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "รองรับเฉพาะ JPG, PNG, WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "ขนาดไฟล์ต้องไม่เกิน 5MB" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, { folder });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json(
      { error: `อัปโหลดไม่สำเร็จ: ${message}` },
      { status: 500 }
    );
  }
}
