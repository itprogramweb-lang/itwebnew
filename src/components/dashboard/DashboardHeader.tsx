"use client";
import Link from "next/link";
import { Menu, ExternalLink } from "lucide-react";
import type { User, UserRole } from "@/types";
import { roleLabels } from "@/data/users";
import { cn } from "@/lib/utils";

const dashboardRoleLabels: Record<UserRole, string> = {
  ...roleLabels,
  website_admin: "ผู้ดูแลเว็บไซต์ / แอดมิน",
};

const roleBadgeClasses: Record<UserRole, string> = {
  super_admin: "bg-purple-50 text-purple-700 border-purple-200",
  website_admin: "bg-brand-50 text-brand-700 border-brand-200",
  teacher: "bg-blue-50 text-blue-700 border-blue-200",
  staff: "bg-emerald-50 text-emerald-700 border-emerald-200",
  student: "bg-slate-100 text-slate-700 border-slate-200",
};

function getDashboardRoleLabel(role: UserRole, isDepartmentHead?: boolean) {
  if (isDepartmentHead) return "หัวหน้าสาขา";
  return dashboardRoleLabels[role];
}

export default function DashboardHeader({
  user,
  onMenuClick,
  isDepartmentHead = false,
}: {
  user: User;
  onMenuClick: () => void;
  isDepartmentHead?: boolean;
}) {
  const displayName = user.name?.trim() || user.email?.trim() || "ผู้ใช้งาน";
  const roleLabel = getDashboardRoleLabel(user.role, isDepartmentHead);
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 lg:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
        aria-label="เปิดเมนู"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <Link
        href="/"
        target="_blank"
        className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600 mr-4"
      >
        ดูเว็บไซต์
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>

      <div className="flex min-w-0 items-center gap-2.5">
        <div className="min-w-0 max-w-[9.5rem] text-right sm:max-w-[14rem]">
          <div className="truncate text-sm font-semibold leading-tight text-slate-900">
            {displayName}
          </div>
          <div className="mt-1 flex justify-end">
            <span
              className={cn(
                "inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 shadow-sm",
                isDepartmentHead
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : roleBadgeClasses[user.role]
              )}
            >
              <span className="truncate">{roleLabel}</span>
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white font-bold text-sm">
          {avatarInitial}
        </div>
      </div>
    </header>
  );
}
