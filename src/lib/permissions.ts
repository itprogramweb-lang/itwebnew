import type { UserRole } from "@/types";

export type Permission =
  | "view_dashboard"
  | "manage_users"
  | "manage_hero_slides"
  | "manage_staff"
  | "manage_programs"
  | "manage_news"
  | "manage_works"
  | "manage_student_works"
  | "manage_teacher_works"
  | "manage_settings"
  | "manage_complaints"
  | "view_complaints"
  | "view_all_complaints"
  | "view_own_complaints"
  | "change_complaint_status_all"
  | "change_complaint_status_partial"
  | "manage_registration"
  | "manage_loan"
  | "manage_welfare"
  | "edit_own_teacher_works"
  | "edit_advised_student_works"
  | "view_own_profile"
  | "manage_pages";

const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    "view_dashboard",
    "manage_users",
    "manage_settings",
    "manage_hero_slides",
    "manage_staff",
    "manage_programs",
    "manage_works",
    "manage_news",
    "manage_student_works",
    "manage_teacher_works",
    "manage_complaints",
    "view_complaints",
    "view_all_complaints",
    "change_complaint_status_all",
    "manage_registration",
    "manage_loan",
    "manage_welfare",
    "manage_pages",
    "view_own_profile",
  ],
  website_admin: [
    "view_dashboard",
    "manage_settings",
    "manage_hero_slides",
    "manage_staff",
    "manage_programs",
    "manage_works",
    "manage_news",
    "manage_student_works",
    "manage_teacher_works",
    "view_complaints",
    "view_all_complaints",
    "manage_pages",
    "view_own_profile",
  ],
  teacher: [
    "view_dashboard",
    "edit_own_teacher_works",
    "edit_advised_student_works",
    "view_own_profile",
  ],
  staff: [
    "view_dashboard",
    "manage_registration",
    "manage_loan",
    "manage_welfare",
    "manage_complaints",
    "view_complaints",
    "view_all_complaints",
    "change_complaint_status_partial",
    "view_own_profile",
  ],
  student: ["view_own_complaints", "view_own_profile"],
};

export const can = (role: UserRole | undefined, perm: Permission): boolean => {
  if (!role) return false;
  return rolePermissions[role].includes(perm);
};

export const canAccessDashboardRoute = (
  role: UserRole | undefined,
  route: string
): boolean => {
  if (!role) return false;
  // Map routes -> required permissions
  const routePerms: Record<string, Permission> = {
    "/dashboard": "view_dashboard",
    "/dashboard/hero-slides": "manage_hero_slides",
    "/dashboard/news": "manage_news",
    "/dashboard/staff": "manage_staff",
    "/dashboard/programs": "manage_programs",
    "/dashboard/courses": "manage_student_works",
    "/dashboard/student-works": "manage_student_works",
    "/dashboard/teacher-works": "manage_teacher_works",
    "/dashboard/complaints": "view_complaints",
    "/dashboard/users": "manage_users",
    "/dashboard/settings": "manage_settings",
    "/dashboard/theme": "manage_settings",
    "/dashboard/pages": "manage_pages",
  };
  if (role === "student") return false;
  // teacher: dashboard, teacher-works, student-works, courses
  if (role === "teacher") {
    return ["/dashboard", "/dashboard/teacher-works", "/dashboard/student-works", "/dashboard/courses"].includes(
      route
    );
  }
  const perm = routePerms[route];
  if (!perm) return false;
  return can(role, perm);
};
