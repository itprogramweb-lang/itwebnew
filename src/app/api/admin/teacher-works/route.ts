import { NextRequest, NextResponse } from "next/server";
import { hasPermissionFromList } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  getAuthenticatedProfileWithPermissions,
  type AdminProfileWithPermissions,
} from "@/lib/serverAuth";

type TeacherWorkAccessRow = {
  id: string;
  teacher_name: string | null;
};

type SupabaseMutationError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

async function requireAuth(request: NextRequest) {
  const profile = await getAuthenticatedProfileWithPermissions(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (
    !hasPermissionFromList(profile.effectivePermissions, "manage_teacher_works") &&
    !hasPermissionFromList(profile.effectivePermissions, "edit_own_teacher_works")
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

function cleanBoolean(v: unknown, fallback: boolean) {
  return typeof v === "boolean" ? v : fallback;
}

function normalizedName(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLocaleLowerCase("th") ?? "";
}

function teacherProfileName(profile: AdminProfileWithPermissions) {
  return normalizedName(profile.full_name);
}

function isOwnTeacherWork(profile: AdminProfileWithPermissions, work: TeacherWorkAccessRow) {
  const profileName = teacherProfileName(profile);
  return !!profileName && normalizedName(work.teacher_name) === profileName;
}

function canManageAllTeacherWorks(profile: AdminProfileWithPermissions) {
  return hasPermissionFromList(profile.effectivePermissions, "manage_teacher_works");
}

async function fetchTeacherWorkForAccess(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string
) {
  const { data, error } = await admin
    .from("teacher_works")
    .select("id,teacher_name")
    .eq("id", id)
    .maybeSingle<TeacherWorkAccessRow>();

  return { data, error };
}

async function requireTeacherWorkMutationAccess(
  profile: AdminProfileWithPermissions,
  admin: ReturnType<typeof createSupabaseAdminClient>,
  id: string
) {
  const { data: work, error } = await fetchTeacherWorkForAccess(admin, id);
  if (error) return { error: NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 }) };
  if (!work) return { error: NextResponse.json({ error: "ไม่พบผลงาน" }, { status: 404 }) };

  if (canManageAllTeacherWorks(profile)) return { work };
  if (
    hasPermissionFromList(profile.effectivePermissions, "edit_own_teacher_works") &&
    isOwnTeacherWork(profile, work)
  ) {
    return { work };
  }

  return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

function isSafePdfPath(v: string) {
  if (/[\u0000-\u001f\u007f]/.test(v)) return false;
  if (v.startsWith("//")) return false;
  if (!v.toLowerCase().endsWith(".pdf")) return false;
  if (v.startsWith("/")) return !v.split("/").some((part) => part === "." || part === "..");
  if (/^https?:\/\//i.test(v)) {
    try {
      const url = new URL(v);
      return !url.pathname.split("/").some((part) => part === "." || part === "..");
    } catch {
      return false;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return false;
  if (v.includes("\\")) return false;
  return !v.split("/").some((part) => part === "." || part === "..");
}

function isMissingContentHtmlColumn(error: SupabaseMutationError | null | undefined) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""} ${error?.hint ?? ""}`;
  return error?.code === "PGRST204" && text.includes("content_html");
}

function buildTeacherWorkPayload(body: Record<string, unknown>) {
  const title = cleanText(body.title);
  if (!title) return { error: "กรุณากรอกชื่อผลงาน" };

  const pdfUrl = cleanOptionalText(body.pdf_url);
  if (pdfUrl && !isSafePdfPath(pdfUrl)) {
    return { error: "URL หรือ path ไฟล์ PDF ไม่ถูกต้อง" };
  }

  return {
    payload: {
      title,
      description: cleanOptionalText(body.description),
      content_html: cleanOptionalText(body.content_html),
      category: cleanOptionalText(body.category),
      year: cleanOptionalText(body.year),
      teacher_name: cleanOptionalText(body.teacher_name),
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
      is_featured: cleanBoolean(body.is_featured, false),
      is_active: cleanBoolean(body.is_active, true),
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("teacher_works")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false });

  if (!canManageAllTeacherWorks(auth.profile)) {
    const profileName = auth.profile.full_name?.trim();
    if (!profileName) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    query = query.eq("teacher_name", profileName);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ works: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const sanitized = buildTeacherWorkPayload(body);
  if ("error" in sanitized) return NextResponse.json({ error: sanitized.error }, { status: 400 });

  if (!canManageAllTeacherWorks(auth.profile)) {
    const profileName = auth.profile.full_name?.trim();
    if (!profileName) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    sanitized.payload.teacher_name = profileName;
  }

  const admin = createSupabaseAdminClient();
  let payload: Record<string, unknown> = sanitized.payload;
  let { data, error } = await admin
    .from("teacher_works")
    .insert(payload)
    .select("*")
    .single();

  if (error && isMissingContentHtmlColumn(error)) {
    const { content_html: _contentHtml, ...fallbackPayload } = payload;
    payload = fallbackPayload;
    const retry = await admin.from("teacher_works").insert(payload).select("*").single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: "เพิ่มผลงานไม่สำเร็จ: " + error.message }, { status: 500 });
  return NextResponse.json({ work: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanText(body.id);
  if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });

  const sanitized = buildTeacherWorkPayload(body);
  if ("error" in sanitized) return NextResponse.json({ error: sanitized.error }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const access = await requireTeacherWorkMutationAccess(auth.profile, admin, id);
  if (access.error) return access.error;

  if (!canManageAllTeacherWorks(auth.profile)) {
    sanitized.payload.teacher_name = auth.profile.full_name?.trim() ?? null;
  }

  let payload: Record<string, unknown> = sanitized.payload;
  let { data, error } = await admin
    .from("teacher_works")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error && isMissingContentHtmlColumn(error)) {
    const { content_html: _contentHtml, ...fallbackPayload } = payload;
    payload = fallbackPayload;
    const retry = await admin.from("teacher_works").update(payload).eq("id", id).select("*").single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + error.message }, { status: 500 });
  return NextResponse.json({ work: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = cleanText(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const access = await requireTeacherWorkMutationAccess(auth.profile, admin, id);
  if (access.error) return access.error;

  const { error } = await admin
    .from("teacher_works")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "ลบผลงานไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
