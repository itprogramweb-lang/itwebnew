import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile, type AdminProfile } from "@/lib/serverAuth";

type StudentWorkAccessRow = {
  id: string;
  advisor_name: string | null;
};

type SupabaseMutationError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type SanitizedStudentWorkPayload =
  | { error: string; payload?: never }
  | { error?: never; payload: Record<string, unknown> };

async function requireAuth(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (
    !hasPermission(profile.role, "manage_student_works") &&
    !hasPermission(profile.role, "edit_advised_student_works")
  ) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { profile };
}

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function cleanOptionalText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return cleanText(v);
}

function cleanStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanBoolean(v: unknown, fallback: boolean) {
  return typeof v === "boolean" ? v : fallback;
}

function cleanNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizedName(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLocaleLowerCase("th") ?? "";
}

function teacherProfileName(profile: AdminProfile) {
  return normalizedName(profile.full_name);
}

function isAdvisedStudentWork(profile: AdminProfile, work: StudentWorkAccessRow) {
  const profileName = teacherProfileName(profile);
  return !!profileName && normalizedName(work.advisor_name) === profileName;
}

function canManageAllStudentWorks(profile: AdminProfile) {
  return hasPermission(profile.role, "manage_student_works");
}

async function fetchStudentWorkForAccess(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string
) {
  const { data, error } = await admin
    .from("student_works")
    .select("id,advisor_name")
    .eq("id", id)
    .maybeSingle<StudentWorkAccessRow>();

  return { data, error };
}

async function requireStudentWorkMutationAccess(
  profile: AdminProfile,
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string
) {
  const { data: work, error } = await fetchStudentWorkForAccess(admin, id);
  if (error) return { error: NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 }) };
  if (!work) return { error: NextResponse.json({ error: "ไม่พบผลงาน" }, { status: 404 }) };

  if (canManageAllStudentWorks(profile)) return { work };
  if (hasPermission(profile.role, "edit_advised_student_works") && isAdvisedStudentWork(profile, work)) {
    return { work };
  }

  return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

function isSafePdfPath(v: string) {
  if (/[\u0000-\u001f\u007f]/.test(v)) return false;
  if (v.startsWith("//")) return false;
  if (!v.toLowerCase().endsWith(".pdf")) return false;
  if (v.startsWith("/")) return !v.split("/").some((part) => part === "." || part === "..");
  if (v.startsWith("http://") || v.startsWith("https://")) {
    try {
      return new URL(v).pathname.toLowerCase().endsWith(".pdf");
    } catch {
      return false;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return false;
  if (v.includes("\\")) return false;
  return !v.split("/").some((part) => !part || part === "." || part === "..");
}

function isMissingImageCropSettingsColumn(error: SupabaseMutationError | null | undefined) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`;
  return error?.code === "PGRST204" && text.includes("image_crop_settings");
}

function logStudentWorkMutationError(action: string, error: SupabaseMutationError) {
  console.error("student_works mutation failed", {
    action,
    code: error.code,
    message: error.message,
    details: error.details,
  });
}

function sanitizeStudentWorkPayload(body: Record<string, unknown>): SanitizedStudentWorkPayload {
  const workType = body.work_type ?? "final_project";
  if (workType !== "course" && workType !== "final_project") {
    return { error: "ประเภทผลงานไม่ถูกต้อง" };
  }

  const title = cleanText(body.title);
  if (!title) return { error: "กรุณากรอกชื่อผลงาน" };

  const academicYear = cleanText(body.academic_year);
  if (!academicYear) return { error: "กรุณากรอกปีการศึกษา" };

  const courseId = cleanOptionalText(body.course_id);
  const courseName = cleanOptionalText(body.course_name);

  if (workType === "course") {
    if (!courseId) return { error: "กรุณากรอกรหัสวิชา" };
    if (!courseName) return { error: "กรุณากรอกชื่อวิชา" };
  }

  const pdfUrl = cleanOptionalText(body.pdf_url);
  if (pdfUrl && !isSafePdfPath(pdfUrl)) {
    return { error: "URL หรือ path ไฟล์ PDF ไม่ถูกต้อง" };
  }

  const payload: Record<string, unknown> = {
    title,
    description: cleanOptionalText(body.description),
    category: cleanOptionalText(body.category),
    academic_year: academicYear,
    work_type: workType,
    // ถ้าเป็นโปรเจกต์จบ ไม่ต้องเก็บข้อมูลรายวิชา
    course_id: workType === "course" ? courseId : null,
    course_name: workType === "course" ? courseName : null,
    students: cleanStringArray(body.students),
    advisor_name: cleanOptionalText(body.advisor_name),
    technologies: cleanStringArray(body.technologies),
    image_url: cleanOptionalText(body.image_url),
    image_alt: cleanOptionalText(body.image_alt),
    image_crop_settings:
      body.image_crop_settings && typeof body.image_crop_settings === "object"
        ? body.image_crop_settings
        : {},
    pdf_url: pdfUrl,
    pdf_filename: cleanOptionalText(body.pdf_filename),
    project_url: cleanOptionalText(body.project_url),
    external_url: cleanOptionalText(body.external_url),
    source_type: cleanOptionalText(body.source_type) ?? "internal",
    source_system: cleanOptionalText(body.source_system),
    sort_order: cleanNumber(body.sort_order),
    is_featured: cleanBoolean(body.is_featured, false),
    is_active: cleanBoolean(body.is_active, true),
  };

  if (Object.prototype.hasOwnProperty.call(body, "slug")) {
    payload.slug = cleanOptionalText(body.slug);
  }

  return {
    payload,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("student_works")
    .select("*")
    .order("created_at", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false });

  if (!canManageAllStudentWorks(auth.profile)) {
    const profileName = auth.profile.full_name?.trim();
    if (!profileName) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    query = query.eq("advisor_name", profileName);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ works: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const sanitized = sanitizeStudentWorkPayload(body);
  if ("error" in sanitized) return NextResponse.json({ error: sanitized.error }, { status: 400 });

  if (!canManageAllStudentWorks(auth.profile)) {
    const profileName = auth.profile.full_name?.trim();
    if (!profileName) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    sanitized.payload.advisor_name = profileName;
  }

  const admin = createSupabaseAdminClient();
  let payload = sanitized.payload;
  let { data, error } = await admin
    .from("student_works")
    .insert(payload)
    .select("*")
    .single();

  if (error && isMissingImageCropSettingsColumn(error)) {
    const { image_crop_settings: _imageCropSettings, ...fallbackPayload } = payload;
    payload = fallbackPayload;
    const retry = await admin.from("student_works").insert(payload).select("*").single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    logStudentWorkMutationError("create", error);
    return NextResponse.json({ error: "เพิ่มผลงานไม่สำเร็จ" }, { status: 500 });
  }
  return NextResponse.json({ work: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanText(body.id);
  if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });

  const { id: _id, ...rawPayload } = body;
  const sanitized = sanitizeStudentWorkPayload(rawPayload);
  if ("error" in sanitized) return NextResponse.json({ error: sanitized.error }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const access = await requireStudentWorkMutationAccess(auth.profile, admin, id);
  if (access.error) return access.error;

  let payload = sanitized.payload;
  if (!canManageAllStudentWorks(auth.profile)) {
    payload.advisor_name = auth.profile.full_name?.trim() ?? null;
  }

  let { data, error } = await admin
    .from("student_works")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error && isMissingImageCropSettingsColumn(error)) {
    const { image_crop_settings: _imageCropSettings, ...fallbackPayload } = payload;
    payload = fallbackPayload;
    const retry = await admin.from("student_works").update(payload).eq("id", id).select("*").single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    logStudentWorkMutationError("update", error);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
  return NextResponse.json({ work: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = cleanText(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const access = await requireStudentWorkMutationAccess(auth.profile, admin, id);
  if (access.error) return access.error;

  const { error } = await admin
    .from("student_works")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "ซ่อนผลงานไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
