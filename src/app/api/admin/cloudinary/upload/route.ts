import { NextRequest, NextResponse } from "next/server";
import { hasPermissionFromList, type Permission } from "@/lib/permissions";
import { getAuthenticatedProfileWithPermissions } from "@/lib/serverAuth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FOLDERS = new Set([
  "uploads",
  "logos",
  "news",
  "news/content",
  "apply",
  "programs",
  "staff",
  "student-works",
  "teacher-works",
  "hero-slides",
  "page-heroes",

  // เพิ่มใหม่
  "facilities",
  "facilities/gallery",
]);

const GENERIC_UPLOAD_PERMISSIONS: readonly Permission[] = [
  "manage_settings",
  "manage_pages",
  "manage_news",
  "manage_hero_slides",
  "manage_staff",
  "manage_student_works",
  "manage_teacher_works",
  "edit_advised_student_works",
  "edit_own_teacher_works",
];

function folderPermissions(folder: string): readonly Permission[] {
  if (folder === "logos") return ["manage_settings"];
  if (folder === "news" || folder === "news/content") return ["manage_news"];
  if (folder === "hero-slides") return ["manage_hero_slides"];
  if (folder === "programs") return ["manage_programs"];
  if (folder === "staff") return ["manage_staff"];
  if (folder === "student-works") {
    return ["manage_student_works", "edit_advised_student_works"];
  }
  if (folder === "teacher-works") {
    return ["manage_teacher_works", "edit_own_teacher_works"];
  }
  if (folder === "page-heroes" || folder === "apply") return ["manage_pages"];
  if (folder === "facilities" || folder === "facilities/gallery") {
    return ["manage_staff"];
  }
  return GENERIC_UPLOAD_PERMISSIONS;
}

function hasAnyUploadPermission(
  effectivePermissions: readonly Permission[],
  permissions: readonly Permission[]
) {
  return permissions.some((permission) =>
    hasPermissionFromList(effectivePermissions, permission)
  );
}

export async function POST(request: NextRequest) {
  const profile = await getAuthenticatedProfileWithPermissions(request);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const canUpload = hasAnyUploadPermission(
    profile.effectivePermissions,
    folderPermissions(folder)
  );
  if (!canUpload) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
