import type { UserRole } from "@/types";
import { roleLabels } from "@/lib/roles";

export { roleLabels };

export const roleOptions: { value: UserRole; label: string }[] = [
  { value: "super_admin", label: roleLabels.super_admin },
  { value: "website_admin", label: roleLabels.website_admin },
  { value: "teacher", label: roleLabels.teacher },
  { value: "staff", label: roleLabels.staff },
  { value: "student", label: roleLabels.student },
];
