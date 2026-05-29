import { hasPermission } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminProfile } from "@/lib/serverAuth";

export type ComplaintAccess = {
  canViewComplaints: boolean;
  canManageComplaints: boolean;
  isDepartmentHead: boolean;
};

const departmentHeadRoleTypes = ["executive", "หัวหน้าสาขา", "หัวหน้าสาขาวิชา"];
const departmentHeadEligibleRoles = ["teacher", "website_admin"];

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || "";
}

function splitEmails(email: string | null | undefined) {
  return (email ?? "")
    .split(/[\s,;]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

export async function isCurrentDepartmentHead(profile: AdminProfile): Promise<boolean> {
  if (!departmentHeadEligibleRoles.includes(profile.role)) return false;

  const profileEmail = normalizeEmail(profile.email);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("staff_members")
    .select("id,user_id,email,role_type,sort_order")
    .eq("is_active", true)
    .in("role_type", departmentHeadRoleTypes)
    .order("sort_order", { ascending: true });

  if (error || !data) return false;

  return data.some((member) => {
    if (member.user_id && member.user_id === profile.id) return true;
    if (!profileEmail) return false;
    return splitEmails(member.email).includes(profileEmail);
  });
}

export async function getComplaintAccessForProfile(profile: AdminProfile): Promise<ComplaintAccess> {
  const canManageByPermission = hasPermission(profile.role, "manage_complaints");
  const canViewByPermission =
    canManageByPermission || hasPermission(profile.role, "view_complaints");

  if (canManageByPermission) {
    return {
      canViewComplaints: true,
      canManageComplaints: true,
      isDepartmentHead: false,
    };
  }

  const isDepartmentHead = await isCurrentDepartmentHead(profile);
  const canViewComplaints = canViewByPermission || isDepartmentHead;

  return {
    canViewComplaints,
    canManageComplaints: isDepartmentHead,
    isDepartmentHead,
  };
}
