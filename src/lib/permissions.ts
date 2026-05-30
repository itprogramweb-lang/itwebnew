import type { UserRole } from "@/types";
import { normalizeRole } from "@/lib/roles";

export const allPermissions = [
  "view_dashboard",
  "manage_users",
  "manage_hero_slides",
  "manage_staff",
  "manage_programs",
  "manage_news",
  "manage_works",
  "manage_student_works",
  "manage_teacher_works",
  "manage_settings",
  "manage_complaints",
  "view_complaints",
  "view_all_complaints",
  "view_own_complaints",
  "change_complaint_status_all",
  "change_complaint_status_partial",
  "manage_registration",
  "manage_loan",
  "manage_welfare",
  "edit_own_teacher_works",
  "edit_advised_student_works",
  "view_own_profile",
  "manage_pages",
] as const;

export type Permission = (typeof allPermissions)[number];

export const rolePermissions: Record<UserRole, readonly Permission[]> = {
  super_admin: allPermissions,
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
    "manage_news",
    "manage_hero_slides",
    "view_own_profile",
  ],
  student: ["view_own_profile"],
};

export const can = (
  role: UserRole | string | null | undefined,
  perm: Permission
): boolean => {
  if (!role) return false;
  const normalizedRole = normalizeRole(role);
  return rolePermissions[normalizedRole].includes(perm);
};

export const hasPermission = can;

export const hasAnyPermission = (
  role: UserRole | string | null | undefined,
  permissions: readonly Permission[]
): boolean => permissions.some((permission) => can(role, permission));

const dashboardRoutePermissions: Record<string, readonly Permission[]> = {
  "/dashboard": ["view_dashboard"],
  "/dashboard/hero-slides": ["manage_hero_slides"],
  "/dashboard/news": ["manage_news"],
  "/dashboard/staff": ["manage_staff"],
  "/dashboard/programs": ["manage_programs"],
  "/dashboard/courses": ["manage_student_works", "edit_advised_student_works"],
  "/dashboard/student-works": ["manage_student_works", "edit_advised_student_works"],
  "/dashboard/teacher-works": ["manage_teacher_works", "edit_own_teacher_works"],
  "/dashboard/complaints": ["view_complaints", "manage_complaints"],
  "/dashboard/users": ["manage_users"],
  "/dashboard/settings": ["manage_settings"],
  "/dashboard/theme": ["manage_settings"],
  "/dashboard/pages": ["manage_pages"],
  "/dashboard/navigation": ["manage_pages"],
};

const normalizeDashboardRoute = (route: string) => {
  const normalized = route.split(/[?#]/)[0].replace(/\/+$/, "");
  return normalized || "/";
};

export const canAccessDashboardRoute = (
  role: UserRole | string | null | undefined,
  route: string
): boolean => {
  if (!role) return false;
  const normalizedRole = normalizeRole(role);
  const normalizedRoute = normalizeDashboardRoute(route);

  if (normalizedRole === "super_admin" && normalizedRoute.startsWith("/dashboard")) {
    return true;
  }

  const permissions = dashboardRoutePermissions[normalizedRoute];
  if (!permissions) return false;
  return hasAnyPermission(normalizedRole, permissions);
};
