import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";
import { getAuthenticatedProfile, type AdminProfile } from "@/lib/serverAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { R2ConfigError, R2UploadError, uploadTeacherWorkPdf } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_PDF_SIZE = 25 * 1024 * 1024;

type TeacherWorkAccessRow = {
  id: string;
  teacher_name: string | null;
};

async function requireAuth(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 }) };
  if (
    !hasPermission(profile.role, "manage_teacher_works") &&
    !hasPermission(profile.role, "edit_own_teacher_works")
  ) {
    return { error: NextResponse.json({ error: "ไม่มีสิทธิ์อัปโหลดไฟล์ผลงานอาจารย์" }, { status: 403 }) };
  }
  return { profile };
}

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizedName(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLocaleLowerCase("th") ?? "";
}

function isOwnTeacherWork(profile: AdminProfile, work: TeacherWorkAccessRow) {
  const profileName = normalizedName(profile.full_name);
  return !!profileName && normalizedName(work.teacher_name) === profileName;
}

function canManageAllTeacherWorks(profile: AdminProfile) {
  return hasPermission(profile.role, "manage_teacher_works");
}

async function requireTeacherWorkUploadAccess(profile: AdminProfile, workId: string) {
  const admin = createSupabaseAdminClient();
  const { data: work, error } = await admin
    .from("teacher_works")
    .select("id,teacher_name")
    .eq("id", workId)
    .maybeSingle<TeacherWorkAccessRow>();

  if (error) return { error: NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 }) };
  if (!work) return { error: NextResponse.json({ error: "ไม่พบผลงาน" }, { status: 404 }) };

  if (canManageAllTeacherWorks(profile)) return { admin, work };
  if (hasPermission(profile.role, "edit_own_teacher_works") && isOwnTeacherWork(profile, work)) {
    return { admin, work };
  }

  return { error: NextResponse.json({ error: "ไม่มีสิทธิ์อัปโหลดไฟล์ผลงานนี้" }, { status: 403 }) };
}

function sanitizeSegment(value: string) {
  const normalized = value
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!`'=+@]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized.slice(0, 80);
}

function sanitizePdfFilename(file: File) {
  const base = file.name
    .replace(/\.pdf$/i, "")
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!`'=+@]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  const safeBase = base || "teacher-work";
  return `${Date.now()}-${safeBase}.pdf`;
}

function getR2UploadErrorMessage(error: R2UploadError) {
  switch (error.details.code) {
    case "AccessDenied":
      return "อัปโหลดไฟล์ PDF ไม่สำเร็จ: R2 API Token ไม่มีสิทธิ์เขียนไฟล์ใน bucket นี้";
    case "InvalidAccessKeyId":
      return "อัปโหลดไฟล์ PDF ไม่สำเร็จ: R2 Access Key ID ไม่ถูกต้อง";
    case "SignatureDoesNotMatch":
      return "อัปโหลดไฟล์ PDF ไม่สำเร็จ: Access Key และ Secret Key ของ R2 ไม่ตรงกัน";
    case "NoSuchBucket":
      return "อัปโหลดไฟล์ PDF ไม่สำเร็จ: ไม่พบ bucket ของ Cloudflare R2";
    default:
      return "อัปโหลดไฟล์ PDF ไม่สำเร็จ";
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const workId = cleanText(formData.get("work_id") ?? formData.get("id"));

    if (!workId) {
      return NextResponse.json({ error: "ไม่พบ work_id" }, { status: 400 });
    }

    const access = await requireTeacherWorkUploadAccess(auth.profile, workId);
    if (access.error) return access.error;

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "ไม่พบไฟล์ PDF" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PDF เท่านั้น" }, { status: 400 });
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: "ไฟล์ PDF มีขนาดใหญ่เกินกำหนด" }, { status: 400 });
    }

    const year = sanitizeSegment(cleanText(formData.get("year"))) || "general";
    const safeFilename = sanitizePdfFilename(file);
    const key = `teacher-works/${year}/${safeFilename}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfUrl = await uploadTeacherWorkPdf({
      key,
      body: buffer,
      contentType: "application/pdf",
    });

    const { error: updateError } = await access.admin
      .from("teacher_works")
      .update({ pdf_url: pdfUrl, pdf_filename: safeFilename })
      .eq("id", workId);

    if (updateError) {
      return NextResponse.json({ error: "อัปเดตข้อมูล PDF ไม่สำเร็จ" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      pdf_url: pdfUrl,
      pdf_filename: safeFilename,
    });
  } catch (error) {
    if (error instanceof R2ConfigError) {
      return NextResponse.json({ error: "ตั้งค่า Cloudflare R2 ยังไม่ครบ" }, { status: 500 });
    }
    if (error instanceof R2UploadError) {
      return NextResponse.json({ error: getR2UploadErrorMessage(error) }, { status: 500 });
    }

    console.error("Teacher work PDF upload failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "อัปโหลดไฟล์ PDF ไม่สำเร็จ" }, { status: 500 });
  }
}
