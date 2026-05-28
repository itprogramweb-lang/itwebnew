import { cn } from "@/lib/utils";
import type { ComplaintStatus, UserRole } from "@/types";
import { complaintStatusLabels } from "@/data/complaints";
import { roleLabels } from "@/data/users";

const statusColors: Record<ComplaintStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusColors[status]
      )}
    >
      {complaintStatusLabels[status]}
    </span>
  );
}

const roleColors: Record<UserRole, string> = {
  super_admin: "bg-purple-50 text-purple-700 border-purple-200",
  website_admin: "bg-brand-50 text-brand-700 border-brand-200",
  teacher: "bg-blue-50 text-blue-700 border-blue-200",
  staff: "bg-emerald-50 text-emerald-700 border-emerald-200",
  student: "bg-slate-100 text-slate-700 border-slate-200",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        roleColors[role]
      )}
    >
      {roleLabels[role]}
    </span>
  );
}
