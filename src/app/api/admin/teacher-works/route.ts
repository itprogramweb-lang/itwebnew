import { NextRequest, NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

async function requireAuth(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!can(profile.role, "manage_teacher_works")) {
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
  const { data, error } = await admin
    .from("teacher_works")
    .select("*")
    .order("is_featured", { ascending: false });

  if (error) return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ works: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const sanitized = buildTeacherWorkPayload(body);
  if ("error" in sanitized) return NextResponse.json({ error: sanitized.error }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("teacher_works")
    .insert(sanitized.payload)
    .select("*")
    .single();

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
  const { data, error } = await admin
    .from("teacher_works")
    .update(sanitized.payload)
    .eq("id", id)
    .select("*")
    .single();

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
  const { error } = await admin
    .from("teacher_works")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "ซ่อนผลงานไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
