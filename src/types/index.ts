// =============================================================
// Type Definitions
// แก้/เพิ่ม type ตรงนี้ เมื่อต่อ database จริง
// =============================================================

export type UserRole =
  | "super_admin"
  | "website_admin"
  | "teacher"
  | "staff"
  | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  avatar?: string;
  createdAt: string;
  effectivePermissions?: string[];
}

export interface UserLineConnection {
  id: string;
  user_id: string;
  line_user_id: string;
  line_display_name: string | null;
  line_picture_url: string | null;
  notify_enabled: boolean;
  linked_at: string;
  updated_at: string;
  revoked_at: string | null;
}

export interface LineOAuthState {
  id: string;
  user_id: string;
  state_hash: string;
  redirect_path: string | null;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}

export type StaffCategory =
  | "executive" // ผู้บริหารสาขา
  | "teacher" // อาจารย์ประจำ
  | "officer"; // เจ้าหน้าที่

export interface Staff {
  id: string;
  name: string;
  position: string;
  category: StaffCategory;
  education: string[];
  expertise: string[];
  email: string;
  phone?: string;
  room?: string;
  avatar?: string;
  bio?: string;
}

export interface Program {
  id: string;
  level: "bachelor" | "master";
  name: string;
  nameEn?: string;
  degree: string;
  degreeEn?: string;
  duration: string;
  credits: number;
  overview: string;
  highlights: string[];
  structure: {
    category: string;
    credits: number;
    description?: string;
  }[];
  sampleCourses: {
    code: string;
    name: string;
    credits: number;
  }[];
  studyPlan?: {
    year: number;
    semester: number;
    courses: { code: string; name: string; credits: number }[];
  }[];
  careers: string[];
  researchAreas?: string[]; // สำหรับ ป.โท
  plans?: { name: string; description: string }[]; // ป.โท: แผนวิจัย/วิชาชีพ
  pdfUrl?: string;
}

export type WorkCategory =
  | "web"
  | "mobile"
  | "ai"
  | "iot"
  | "design"
  | "other";

export interface StudentWork {
  id: string;
  title: string;
  description: string;
  year: string;
  owners: string[]; // ชื่อเจ้าของผลงาน
  advisor: string;
  category: WorkCategory;
  technologies: string[];
  imageUrl?: string;
  link?: string;
}

export type TeacherWorkType =
  | "research" // งานวิจัย
  | "article" // บทความวิชาการ
  | "award" // รางวัล
  | "service"; // บริการวิชาการ

export interface TeacherWork {
  id: string;
  title: string;
  type: TeacherWorkType;
  owner: string;
  year: string;
  detail: string;
  link?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  cover?: string;
  status: "draft" | "published";
  body?: string;
}

export type ComplaintType =
  | "complaint" // ร้องเรียน
  | "suggestion" // เสนอแนะ
  | "study" // ปัญหาการเรียน
  | "people" // ปัญหาบุคลากร
  | "system" // ปัญหาระบบ/เว็บไซต์
  | "other";

export type ComplaintStatus =
  | "new"
  | "in_progress"
  | "resolved"
  | "rejected";

export interface Complaint {
  id: string;
  refNo: string;
  type: ComplaintType;
  subject: string;
  detail: string;
  name?: string;
  studentId?: string;
  email?: string;
  phone?: string;
  wantsCallback: boolean;
  status: ComplaintStatus;
  assignee?: string;
  createdAt: string;
  notes?: { author: string; at: string; text: string }[];
}

export interface FAQ {
  q: string;
  a: string;
}

export interface SiteSettings {
  departmentName: string;
  facultyName: string;
  universityName: string;
  shortName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  line: string;
  workingHours: string;
  themeColor: string;
}

export type NavigationItemType = "link" | "dropdown" | "heading";

export type NavigationLocation = "navbar" | "footer_main" | "footer_students" | "both";

export type NavigationTarget = "_self" | "_blank";

export interface NavigationItem {
  id: string;
  label: string;
  label_en: string | null;
  href: string | null;
  type: NavigationItemType;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_external: boolean;
  is_core: boolean;
  location: NavigationLocation;
  target: NavigationTarget | null;
  description: string | null;
  description_en: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type NavigationTreeItem = NavigationItem & {
  children: NavigationTreeItem[];
};
