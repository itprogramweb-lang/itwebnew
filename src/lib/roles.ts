import type { User, UserRole } from "@/types";

export const ALLOWED_ROLES = [
  "super_admin",
  "website_admin",
  "teacher",
  "staff",
  "student",
] as const satisfies readonly UserRole[];

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  website_admin: "ผู้ดูแลเว็บไซต์",
  teacher: "อาจารย์",
  staff: "เจ้าหน้าที่",
  student: "นักศึกษา",
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  is_active?: boolean | null;
  status?: string | null;
  created_at: string | null;
};

export function isAllowedRole(role: string | null | undefined): role is UserRole {
  return ALLOWED_ROLES.includes(role as UserRole);
}

export function normalizeRole(role: string | null | undefined): UserRole {
  const normalized = role?.trim().toLowerCase();
  if (normalized === "superadmin" || normalized === "super-admin") {
    return "super_admin";
  }
  if (normalized === "admin") return "website_admin";
  return isAllowedRole(normalized) ? normalized : "student";
}

export function isProfileActive(profile: Pick<ProfileRow, "is_active" | "status">): boolean {
  if (typeof profile.is_active === "boolean") return profile.is_active;
  return profile.status ? profile.status === "active" : true;
}

export function profileToUser(profile: ProfileRow): User {
  const email = profile.email ?? "";
  const name = profile.full_name?.trim() || email || "ผู้ใช้งาน";
  return {
    id: profile.id,
    name,
    email,
    role: normalizeRole(profile.role),
    status: isProfileActive(profile) ? "active" : "inactive",
    createdAt: profile.created_at ?? new Date().toISOString(),
  };
}
