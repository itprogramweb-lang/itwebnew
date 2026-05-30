import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

type CourseRow = {
  id: string;
  course_id: string;
  course_name: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

type CoursePayloadResult =
  | { error: string }
  | {
      payload: {
        course_id: string;
        course_name: string;
        sort_order: number;
        is_active: boolean;
      };
    };

const SETUP_REQUIRED_MESSAGE = "ยังไม่ได้สร้างตารางรายวิชาใน Supabase";
const PROTECTED_COURSE_IDS = new Set([
  "09-142-203",
  "09-142-204",
  "09-142-205",
  "09-142-214",
  "09-142-302",
  "09-142-306",
  "09-142-313",
  "09-142-316",
  "09-142-321",
  "09-142-325",
  "09-142-361",
  "09-142-364",
  "09-142-365",
  "09-142-393",
  "09-142-394",
  "09-142-415",
  "09-142-417",
  "09-142-433",
  "09-142-460",
  "09-142-461",
  "09-143-301",
  "09-143-322",
  "09-143-420",
  "09-143-302",
  "09-143-439",
  "09-143-497",
  "09-143-209",
  "09-143-211",
  "09-143-362",
  "09-144-301",
  "09-144-402",
  "09-144-403",
  "09-144-304",
  "09-144-305",
  "09-144-406",
  "09-144-407",
  "09-144-408",
]);

async function requireCourseManager(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!hasPermission(profile.role, "manage_student_works")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { profile };
}

async function requireCourseReader(request: NextRequest) {
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

function isMissingCoursesTable(error: SupabaseError | null) {
  return error?.code === "42P01" || /relation .*courses.* does not exist/i.test(error?.message ?? "");
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanSortOrder(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

function safeCourseError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function getWorkCounts(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const { data } = await admin
    .from("student_works")
    .select("course_id")
    .eq("work_type", "course")
    .not("course_id", "is", null)
    .returns<Pick<CourseRow, "course_id">[]>();

  const counts = new Map<string, number>();
  for (const work of data ?? []) {
    if (!work.course_id) continue;
    counts.set(work.course_id, (counts.get(work.course_id) ?? 0) + 1);
  }
  return counts;
}

async function countLinkedWorks(admin: ReturnType<typeof createSupabaseAdminClient>, courseId: string) {
  const { count, error } = await admin
    .from("student_works")
    .select("id", { count: "exact", head: true })
    .eq("work_type", "course")
    .eq("course_id", courseId);

  if (error) return 0;
  return count ?? 0;
}

async function countLinkedWorksForDelete(admin: ReturnType<typeof createSupabaseAdminClient>, courseId: string) {
  const { count, error } = await admin
    .from("student_works")
    .select("id", { count: "exact", head: true })
    .eq("work_type", "course")
    .eq("course_id", courseId);

  if (error) throw error;
  return count ?? 0;
}

function toPayload(body: Record<string, unknown>): CoursePayloadResult {
  const courseId = cleanText(body.course_id);
  const courseName = cleanText(body.course_name);
  const sortOrder = cleanSortOrder(body.sort_order);

  if (!courseId) return { error: "กรุณากรอกรหัสวิชา" as const };
  if (!courseName) return { error: "กรุณากรอกชื่อวิชา" as const };
  if (sortOrder === null) return { error: "ลำดับต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป" as const };

  return {
    payload: {
      course_id: courseId,
      course_name: courseName,
      sort_order: sortOrder,
      is_active: body.is_active !== false,
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireCourseReader(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("courses")
    .select("id,course_id,course_name,sort_order,is_active,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("course_id", { ascending: true })
    .returns<CourseRow[]>();

  if (isMissingCoursesTable(error)) {
    return NextResponse.json({ setup_required: true, message: SETUP_REQUIRED_MESSAGE, courses: [] });
  }
  if (error) return NextResponse.json({ error: "โหลดรายวิชาไม่สำเร็จ" }, { status: 500 });

  const counts = await getWorkCounts(admin);
  return NextResponse.json({
    setup_required: false,
    courses: (data ?? []).map((course) => ({
      ...course,
      work_count: counts.get(course.course_id) ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireCourseManager(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = toPayload(body);
  if ("error" in parsed) return safeCourseError(parsed.error);
  const payload = parsed.payload;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("courses")
    .insert(payload)
    .select("id,course_id,course_name,sort_order,is_active,created_at,updated_at")
    .single<CourseRow>();

  if (isMissingCoursesTable(error)) return safeCourseError(SETUP_REQUIRED_MESSAGE, 503);
  if (error?.code === "23505") return safeCourseError("รหัสวิชานี้มีอยู่แล้ว");
  if (error) return NextResponse.json({ error: "เพิ่มรายวิชาไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ course: { ...data, work_count: 0 } }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCourseManager(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanText(body.id);
  if (!id) return safeCourseError("ไม่พบรหัสรายการ");

  const parsed = toPayload(body);
  if ("error" in parsed) return safeCourseError(parsed.error);
  const payload = parsed.payload;

  const admin = createSupabaseAdminClient();
  const { data: current, error: currentError } = await admin
    .from("courses")
    .select("id,course_id")
    .eq("id", id)
    .maybeSingle<Pick<CourseRow, "id" | "course_id">>();

  if (isMissingCoursesTable(currentError)) return safeCourseError(SETUP_REQUIRED_MESSAGE, 503);
  if (currentError || !current) return safeCourseError("ไม่พบรายวิชา", 404);

  if (current.course_id !== payload.course_id) {
    const linkedCount = await countLinkedWorks(admin, current.course_id);
    if (linkedCount > 0) {
      return safeCourseError("ไม่สามารถเปลี่ยนรหัสวิชาได้ เพราะมีผลงานรายวิชาผูกอยู่ กรุณาแก้ชื่อวิชาหรือปิดใช้งานแทน");
    }
  }

  const { data, error } = await admin
    .from("courses")
    .update(payload)
    .eq("id", id)
    .select("id,course_id,course_name,sort_order,is_active,created_at,updated_at")
    .single<CourseRow>();

  if (error?.code === "23505") return safeCourseError("รหัสวิชานี้มีอยู่แล้ว");
  if (error) return NextResponse.json({ error: "บันทึกรายวิชาไม่สำเร็จ" }, { status: 500 });

  const linkedCount = await countLinkedWorks(admin, data.course_id);
  return NextResponse.json({ course: { ...data, work_count: linkedCount } });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCourseManager(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = cleanText(searchParams.get("id"));
  if (!id) return safeCourseError("ไม่พบรหัสรายการ");

  const admin = createSupabaseAdminClient();
  const { data: current, error: currentError } = await admin
    .from("courses")
    .select("id,course_id")
    .eq("id", id)
    .maybeSingle<Pick<CourseRow, "id" | "course_id">>();

  if (isMissingCoursesTable(currentError)) return safeCourseError(SETUP_REQUIRED_MESSAGE, 503);
  if (currentError || !current) return safeCourseError("ไม่พบรายวิชา", 404);

  if (PROTECTED_COURSE_IDS.has(current.course_id)) {
    return safeCourseError("รายวิชาเดิมไม่สามารถลบได้", 403);
  }

  let linkedCount = 0;
  try {
    linkedCount = await countLinkedWorksForDelete(admin, current.course_id);
  } catch {
    return NextResponse.json({ error: "ตรวจสอบผลงานที่ผูกกับรายวิชาไม่สำเร็จ" }, { status: 500 });
  }

  if (linkedCount > 0) {
    return safeCourseError("มีผลงานรายวิชาใช้งานอยู่ ไม่สามารถลบได้", 400);
  }

  const { error } = await admin.from("courses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "ลบรายวิชาไม่สำเร็จ" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    deleted: true,
    message: "ลบรายวิชาเรียบร้อยแล้ว",
  });
}
