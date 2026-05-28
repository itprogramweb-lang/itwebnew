import { NextRequest, NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { getAuthenticatedProfile } from "@/lib/serverAuth";
import { R2ConfigError, R2UploadError, uploadStudentWorkPdf } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_PDF_SIZE = 25 * 1024 * 1024;

async function requireAuth(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 }) };
  if (!can(profile.role, "manage_student_works")) {
    return { error: NextResponse.json({ error: "ไม่มีสิทธิ์จัดการผลงานนักศึกษา" }, { status: 403 }) };
  }
  return { profile };
}

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!'@+=`~\s]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizePdfFilename(file: File) {
  const original = file.name.split(/[/\\]/).pop() || "";
  const withoutExt = original.replace(/\.pdf$/i, "");
  const safeBase =
    withoutExt
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "student-work";

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

    const workType = cleanText(formData.get("work_type"));
    const courseId = cleanText(formData.get("course_id"));
    const academicYear = cleanText(formData.get("academic_year"));

    if (workType !== "course" && workType !== "final_project") {
      return NextResponse.json({ error: "ประเภทผลงานไม่ถูกต้อง" }, { status: 400 });
    }
    if (!academicYear) {
      return NextResponse.json({ error: "กรุณากรอกปีการศึกษา" }, { status: 400 });
    }
    if (workType === "course" && !courseId) {
      return NextResponse.json({ error: "กรุณากรอกรหัสวิชา" }, { status: 400 });
    }

    const safeFilename = sanitizePdfFilename(file);
    const safeYear = sanitizeSegment(academicYear);
    const safeCourseId = sanitizeSegment(courseId);

    if (!safeYear || (workType === "course" && !safeCourseId)) {
      return NextResponse.json(
        { error: workType === "course" ? "กรุณากรอกรหัสวิชา" : "กรุณากรอกปีการศึกษา" },
        { status: 400 }
      );
    }

    const key =
      workType === "course"
        ? `course/${safeCourseId}/${safeYear}/${safeFilename}`
        : `final-projects/${safeYear}/${safeFilename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfUrl = await uploadStudentWorkPdf({
      key,
      body: buffer,
      contentType: "application/pdf",
    });

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

    console.error("Student work PDF upload failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "อัปโหลดไฟล์ PDF ไม่สำเร็จ" }, { status: 500 });
  }
}
