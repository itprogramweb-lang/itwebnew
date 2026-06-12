import { createServerSupabaseClient } from "./server";

export type SiteSettingsRow = {
  id: string;
  site_name: string | null;
  faculty_name: string | null;
  university_name: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  facebook_url: string | null;
  line_url: string | null;
  theme: Record<string, unknown>;

  brand_name?: string | null;
  brand_short_name?: string | null;
  department_name_th?: string | null;
  department_name_en?: string | null;
  university_name_th?: string | null;
  university_name_en?: string | null;
  logo_alt?: string | null;
  logo_desktop_size?: number | null;
  logo_mobile_size?: number | null;
  logo_crop_preset?: string | null;
  logo_object_position?: string | null;
  show_logo?: boolean | null;
  show_brand_name?: boolean | null;

  loan_external_url?: string | null;
  welfare_external_url?: string | null;

  logo_fit_mode?: string | null;
  logo_pos_x?: number | null;
  logo_pos_y?: number | null;
  logo_zoom?: number | null;

  apply_hero_image_url?: string | null;
  apply_image_crop_settings?: Record<string, unknown> | null;
  apply_hero_template?: string | null;
  apply_title?: string | null;
  apply_eyebrow?: string | null;
  apply_description?: string | null;
  staff_intro_title?: string | null;
  staff_intro_description?: string | null;
  staff_position_order?: string | null;

  design_tokens?: Record<string, unknown> | null;
};
export type HeroSlideRow = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  primary_button_text: string | null;
  primary_button_url: string | null;
  secondary_button_text: string | null;
  secondary_button_url: string | null;
  right_items: unknown[];
  sort_order: number | null;
  is_active: boolean | null;
  settings: Record<string, unknown>;
};

export type PageSectionRow = {
  id: string;
  page_id: string | null;
  section_key: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  image_caption: string | null;
  button_text: string | null;
  button_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  settings: Record<string, unknown>;
};

export type StaffMemberRow = {
  id: string;
  full_name: string;
  position: string | null;
  role_type: string | null;
  education: string | null;
  expertise: string[] | null;
  email: string | null;
  phone: string | null;
  office: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  bio: string | null;
  user_id: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

export type ProgramRow = {
  id: string;
  level: string;
  title: string;
  degree_name: string | null;
  duration: string | null;
  credits: number | null;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  curriculum_url: string | null;
  details: Record<string, unknown>;
  is_active: boolean | null;
};

export type StudentWorkRow = {
  id: string;
  title: string;
  description: string | null;
  content_html: string | null;
  category: string | null;
  academic_year: string | null;
  work_type: string | null;
  course_id: string | null;
  course_name: string | null;
  students: string[] | null;
  advisor_name: string | null;
  technologies: string[] | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  pdf_url: string | null;
  pdf_filename: string | null;
  project_url: string | null;
  external_url: string | null;
  source_type: string | null;
  source_system: string | null;
  sort_order: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  slug: string | null;
};

export type LearningFacilityGalleryImage = {
  url: string;
  alt?: string | null;
  caption?: string | null;
  sort_order?: number;
};

export type LearningFacilityRow = {
  id: string;
  type: string;
  title: string;
  slug: string | null;

  short_description: string | null;
  description: string | null;

  cover_image_url: string | null;
  cover_image_alt: string | null;
  cover_image_crop: unknown | null;

  gallery_images: LearningFacilityGalleryImage[] | null;

  location: string | null;
  capacity: string | null;

  highlights: string[] | null;
  equipment_list: string[] | null;

  is_featured: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;

  created_at: string | null;
  updated_at: string | null;
};

export async function getLearningFacilities(): Promise<LearningFacilityRow[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("learning_facilities")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getLearningFacilities error:", error);
    return [];
  }

  return data ?? [];
}

export type CourseWorkSubject = {
  course_id: string;
  course_name: string;
  work_count: number;
  years: string[];
};

export type CourseWorkYear = {
  academic_year: string;
  work_count: number;
  advisor_names: string[];
};

type CourseCatalogItem = {
  course_id: string;
  course_name: string;
  sort_order: number;
};

type CourseCatalogRow = CourseCatalogItem & {
  is_active: boolean | null;
};

const courseWorkCatalog: Pick<CourseWorkSubject, "course_id" | "course_name">[] = [
  { course_id: "09-142-203", course_name: "การโปรแกรมเชิงวัตถุ" },
  { course_id: "09-142-204", course_name: "การวิเคราะห์และออกแบบระบบสารสนเทศ" },
  { course_id: "09-142-205", course_name: "ระบบจัดการฐานข้อมูล" },
  { course_id: "09-142-214", course_name: "ความมั่นคงทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-142-302", course_name: "ระบบฝังตัวและอินเทอร์เน็ตทุกสรรพสิ่ง" },
  { course_id: "09-142-306", course_name: "การพัฒนาเว็บยุคใหม่" },
  { course_id: "09-142-313", course_name: "สัมมนาทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-142-316", course_name: "โครงงานด้านเทคโนโลยีสารสนเทศ 1" },
  { course_id: "09-142-321", course_name: "การวิเคราะห์และออกแบบเครือข่าย" },
  { course_id: "09-142-325", course_name: "การสื่อสารแบบไร้สายและระบบเคลื่อนที่สมัยใหม่" },
  { course_id: "09-142-361", course_name: "การวิเคราะห์ข้อมูลขนาดใหญ่และการทำเหมืองข้อมูล" },
  { course_id: "09-142-364", course_name: "การโจมตีและป้องกันภัยคุกคามทางไซเบอร์" },
  { course_id: "09-142-365", course_name: "การสื่อสารระหว่างเซอร์วิส" },
  { course_id: "09-142-393", course_name: "การบริหารจัดการเครื่องแม่ข่าย" },
  { course_id: "09-142-394", course_name: "การบริหารจัดการโครงการเทคโนโลยีสารสนเทศ" },
  { course_id: "09-142-415", course_name: "มิติทางสังคมและจริยธรรมสำหรับนักเทคโนโลยีสารสนเทศ" },
  { course_id: "09-142-417", course_name: "โครงงานด้านเทคโนโลยีสารสนเทศ 2" },
  { course_id: "09-142-433", course_name: "เทคโนโลยีสื่อสารโทรคมนาคม" },
  { course_id: "09-142-460", course_name: "ปัญญาประดิษฐ์และการประยุกต์ใช้งาน" },
  { course_id: "09-142-461", course_name: "การพัฒนาแอพพลิเคชันบนอุปกรณ์เคลื่อนที่" },
  { course_id: "09-143-301", course_name: "การโปรแกรมสมัยใหม่" },
  { course_id: "09-143-322", course_name: "การพัฒนาระบบงานฐานข้อมูลโดยโปรแกรมประยุกต์" },
  { course_id: "09-143-420", course_name: "ระบบจัดการฐานข้อมูลขั้นสูง" },
  { course_id: "09-143-302", course_name: "เครือข่ายคอมพิวเตอร์ขั้นสูง" },
  { course_id: "09-143-439", course_name: "ระบบปฏิบัติการเครือข่าย" },
  { course_id: "09-143-497", course_name: "การโจมตีและป้องกันภัยคุกคามทางไซเบอร์ขั้นสูง" },
  { course_id: "09-143-209", course_name: "ปฏิสัมพันธ์ระหว่างมนุษย์และคอมพิวเตอร์" },
  { course_id: "09-143-211", course_name: "เครือข่ายในสำนักงาน" },
  { course_id: "09-143-362", course_name: "การเรียนรู้ด้วยเครื่องจักร" },
  { course_id: "09-144-301", course_name: "การเตรียมความพร้อมฝึกประสบการณ์วิชาชีพทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-144-402", course_name: "สหกิจศึกษาทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-144-403", course_name: "สหกิจศึกษาต่างประเทศทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-144-304", course_name: "ฝึกงานทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-144-305", course_name: "ฝึกงานต่างประเทศทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-144-406", course_name: "ปัญหาพิเศษจากสถานประกอบการทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-144-407", course_name: "ประสบการณ์ต่างประเทศทางเทคโนโลยีสารสนเทศ" },
  { course_id: "09-144-408", course_name: "การฝึกเฉพาะตำแหน่งทางเทคโนโลยีสารสนเทศ" },
];

const courseWorkCatalogOrder = new Map(courseWorkCatalog.map((course, index) => [course.course_id, index]));

const fallbackCourseCatalog: CourseCatalogItem[] = courseWorkCatalog.map((course, index) => ({
  ...course,
  sort_order: index + 1,
}));

export type TeacherWorkRow = {
  id: string;
  title: string;
  description: string | null;
  content_html: string | null;
  category: string | null;
  year: string | null;
  teacher_name: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  pdf_url: string | null;
  pdf_filename: string | null;
  project_url: string | null;
  external_url: string | null;
  source_type: string | null;
  source_system: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
};

export type NewsRow = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  content_html: string | null;
  slug: string | null;
  category: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  status: string | null;
  published_at: string | null;
  is_featured: boolean | null;
  sort_order: number | null;
  author_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PageSettingRow = {
  id: string;
  page_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  hero_image_crop_settings: Record<string, unknown> | null;
  hero_layout: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_external: boolean | null;
  settings: Record<string, unknown>;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PageSettingFallback = {
  title?: string;
  subtitle?: string;
  description?: string;
  eyebrow?: string;
  hero_image_url?: string;
  hero_image_alt?: string;
  hero_layout?: string;
  cta_label?: string;
  cta_url?: string;
  cta_external?: boolean;
};

export function normalizePageSetting(
  row: PageSettingRow | null,
  fallback: PageSettingFallback = {}
) {
  return {
    title: row?.title ?? fallback.title ?? null,
    subtitle: row?.subtitle ?? fallback.subtitle ?? fallback.eyebrow ?? null,
    description: row?.description ?? fallback.description ?? null,
    hero_image_url: row?.hero_image_url ?? fallback.hero_image_url ?? null,
    hero_image_alt: row?.hero_image_alt ?? fallback.hero_image_alt ?? null,
    hero_image_crop_settings: row?.hero_image_crop_settings ?? null,
    hero_layout: row?.hero_layout ?? fallback.hero_layout ?? "default",
    cta_label: row?.cta_label ?? fallback.cta_label ?? null,
    cta_url: row?.cta_url ?? fallback.cta_url ?? null,
    cta_external: row?.cta_external ?? fallback.cta_external ?? false,
    settings: row?.settings ?? {},
  };
}

function safeDecodeSlug(slug: string): string {
  try { return decodeURIComponent(slug); } catch { return slug; }
}

function throwQueryError(label: string, error: { message: string }) {
  throw new Error(`Supabase query failed: ${label}. ${error.message}`);
}

function normalizeStudentWorkRow(row: StudentWorkRow): StudentWorkRow {
  return {
    ...row,
    content_html: row.content_html ?? null,
    work_type: row.work_type ?? "final_project",
    course_id: row.course_id ?? null,
    course_name: row.course_name ?? null,
    pdf_url: row.pdf_url ?? null,
    pdf_filename: row.pdf_filename ?? null,
  };
}

function normalizeStudentWorkRows(rows: StudentWorkRow[] | null) {
  return (rows ?? []).map(normalizeStudentWorkRow);
}

function normalizeTeacherWorkRow(row: TeacherWorkRow): TeacherWorkRow {
  return {
    ...row,
    content_html: row.content_html ?? null,
    pdf_url: row.pdf_url ?? null,
    pdf_filename: row.pdf_filename ?? null,
  };
}

function normalizeTeacherWorkRows(rows: TeacherWorkRow[] | null) {
  return (rows ?? []).map(normalizeTeacherWorkRow);
}

function sortAcademicYearsDesc(years: string[]) {
  return [...years].sort((a, b) => b.localeCompare(a, "th"));
}

export async function getPageSetting(pageKey: string): Promise<PageSettingRow | null> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("page_settings")
    .select("*")
    .eq("page_key", pageKey)
    .eq("is_active", true)
    .maybeSingle<PageSettingRow>();
  return data ?? null;
}

export async function getAllPageSettings(): Promise<PageSettingRow[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("page_settings")
    .select("*")
    .order("sort_order", { ascending: true })
    .returns<PageSettingRow[]>();
  return data ?? [];
}

export async function getSiteSettings() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle<SiteSettingsRow>();

  if (error) throwQueryError("getSiteSettings", error);
  return data;
}

export async function getHeroSlides() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<HeroSlideRow[]>();

  if (error) throwQueryError("getHeroSlides", error);
  return data ?? [];
}

export async function getPageSections(slug: string) {
  const supabase = createServerSupabaseClient();
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle<{ id: string }>();

  if (pageError) throwQueryError("getPageSections: page", pageError);
  if (!page) return [];

  const { data, error } = await supabase
    .from("page_sections")
    .select("*")
    .eq("page_id", page.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<PageSectionRow[]>();

  if (error) throwQueryError("getPageSections: sections", error);
  return data ?? [];
}

export async function getStaffMembers() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<StaffMemberRow[]>();

  if (error) throwQueryError("getStaffMembers", error);
  return data ?? [];
}

export async function getPrograms() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("is_active", true)
    .returns<ProgramRow[]>();

  if (error) throwQueryError("getPrograms", error);
  return data ?? [];
}

export async function getStudentWorks() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("student_works")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<StudentWorkRow[]>();

  if (error) throwQueryError("getStudentWorks", error);
  return normalizeStudentWorkRows(data);
}

export async function getStudentWorkBySlug(slug: string) {
  const decoded = safeDecodeSlug(slug);
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("student_works")
    .select("*")
    .eq("slug", decoded)
    .eq("is_active", true)
    .maybeSingle<StudentWorkRow>();

  if (error) throwQueryError("getStudentWorkBySlug", error);
  return data ? normalizeStudentWorkRow(data) : null;
}

export async function getCourseWorkSubjects(): Promise<CourseWorkSubject[]> {
  const supabase = createServerSupabaseClient();
  const { data: courseData, error: courseError } = await supabase
    .from("courses")
    .select("course_id,course_name,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<CourseCatalogRow[]>();

  const catalog: CourseCatalogItem[] = courseError
    ? fallbackCourseCatalog
    : (courseData ?? []).map((course) => ({
        course_id: course.course_id,
        course_name: course.course_name,
        sort_order: course.sort_order,
      }));
  const catalogOrder = new Map(catalog.map((course, index) => [course.course_id, course.sort_order || index + 1]));

  const { data, error } = await supabase
    .from("student_works")
    .select("*")
    .eq("is_active", true)
    .eq("work_type", "course")
    .not("course_id", "is", null)
    .not("course_name", "is", null)
    .order("course_id", { ascending: true })
    .returns<StudentWorkRow[]>();

  if (error) throwQueryError("getCourseWorkSubjects", error);

  const subjects = new Map<string, CourseWorkSubject>();

  for (const course of catalog) {
    subjects.set(course.course_id, {
      course_id: course.course_id,
      course_name: course.course_name,
      work_count: 0,
      years: [],
    });
  }

  for (const work of normalizeStudentWorkRows(data)) {
    if (!work.course_id || !work.course_name) continue;

    const current = subjects.get(work.course_id) ?? {
      course_id: work.course_id,
      course_name: work.course_name,
      work_count: 0,
      years: [],
    };

    current.course_name = work.course_name;
    current.work_count += 1;
    if (work.academic_year && !current.years.includes(work.academic_year)) {
      current.years.push(work.academic_year);
    }

    subjects.set(work.course_id, current);
  }

  return [...subjects.values()]
    .filter((subject) => subject.work_count > 0)
    .map((subject) => ({
      ...subject,
      years: sortAcademicYearsDesc(subject.years),
    }))
    .sort((a, b) => {
      const aHasWorks = a.work_count > 0;
      const bHasWorks = b.work_count > 0;
      if (aHasWorks && !bHasWorks) return -1;
      if (!aHasWorks && bHasWorks) return 1;

      const aOrder = catalogOrder.get(a.course_id) ?? courseWorkCatalogOrder.get(a.course_id);
      const bOrder = catalogOrder.get(b.course_id) ?? courseWorkCatalogOrder.get(b.course_id);
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.course_id.localeCompare(b.course_id, "th");
    });
}

export async function getCourseWorkYears(courseId: string): Promise<CourseWorkYear[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("student_works")
    .select("academic_year,advisor_name")
    .eq("is_active", true)
    .eq("work_type", "course")
    .eq("course_id", courseId)
    .not("academic_year", "is", null)
    .returns<Pick<StudentWorkRow, "academic_year" | "advisor_name">[]>();

  if (error) throwQueryError("getCourseWorkYears", error);

  const years = new Map<string, CourseWorkYear>();
  for (const work of data ?? []) {
    if (!work.academic_year) continue;

    const current = years.get(work.academic_year) ?? {
      academic_year: work.academic_year,
      work_count: 0,
      advisor_names: [],
    };
    current.work_count += 1;

    const advisorName = work.advisor_name?.trim();
    if (advisorName && !current.advisor_names.includes(advisorName)) {
      current.advisor_names.push(advisorName);
    }

    years.set(work.academic_year, current);
  }

  return sortAcademicYearsDesc([...years.keys()]).map((year) => years.get(year)!);
}

export async function getCourseWorksByYear(courseId: string, year: string): Promise<StudentWorkRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("student_works")
    .select("*")
    .eq("is_active", true)
    .eq("work_type", "course")
    .eq("course_id", courseId)
    .eq("academic_year", year)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<StudentWorkRow[]>();

  if (error) throwQueryError("getCourseWorksByYear", error);
  return normalizeStudentWorkRows(data);
}

export async function getFinalProjectYears(): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("student_works")
    .select("academic_year,work_type")
    .eq("is_active", true)
    .or("work_type.eq.final_project,work_type.is.null")
    .not("academic_year", "is", null)
    .not("pdf_url", "is", null)
    .neq("pdf_url", "")
    .returns<Pick<StudentWorkRow, "academic_year" | "work_type">[]>();

  if (error) throwQueryError("getFinalProjectYears", error);

  const years = new Set((data ?? []).map((work) => work.academic_year).filter(Boolean) as string[]);
  return sortAcademicYearsDesc([...years]);
}

export async function getFinalProjectsByYear(year: string): Promise<StudentWorkRow[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("student_works")
    .select("*")
    .eq("is_active", true)
    .or("work_type.eq.final_project,work_type.is.null")
    .eq("academic_year", year)
    .not("pdf_url", "is", null)
    .neq("pdf_url", "")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<StudentWorkRow[]>();

  if (error) throwQueryError("getFinalProjectsByYear", error);
  return normalizeStudentWorkRows(data);
}

export async function getTeacherWorks() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("teacher_works")
    .select("*")
    .eq("is_active", true)
    .returns<TeacherWorkRow[]>();

  if (error) throwQueryError("getTeacherWorks", error);
  return normalizeTeacherWorkRows(data);
}

export async function getTeacherWorkById(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("teacher_works")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle<TeacherWorkRow>();

  if (error) throwQueryError("getTeacherWorkById", error);
  return data ? normalizeTeacherWorkRow(data) : null;
}
export async function getNews() {
  const now = new Date().toISOString();
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("status", "published")
    .lte("published_at", now)
    .order("published_at", { ascending: false })
    .returns<NewsRow[]>();

  if (error) throwQueryError("getNews", error);
  return data ?? [];
}
export async function getNewsBySlug(slug: string) {
  const decoded = safeDecodeSlug(slug);
  const now = new Date().toISOString();
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", decoded)
    .eq("status", "published")
    .lte("published_at", now)
    .maybeSingle<NewsRow>();

  if (error) throwQueryError("getNewsBySlug", error);
  return data;
}

export async function getRelatedNews(
  currentId: string,
  category: string | null,
  limit = 3
) {
  const now = new Date().toISOString();
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("news")
    .select(
      "id,title,slug,excerpt,image_url,image_alt,image_crop_settings,category,published_at"
    )
    .eq("status", "published")
    .lte("published_at", now)
    .neq("id", currentId)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);

  const { data, error } = await query.returns<
    Pick<
      NewsRow,
      | "id"
      | "title"
      | "slug"
      | "excerpt"
      | "image_url"
      | "image_alt"
      | "image_crop_settings"
      | "category"
      | "published_at"
    >[]
  >();

  if (error) throwQueryError("getRelatedNews", error);
  return data ?? [];
}