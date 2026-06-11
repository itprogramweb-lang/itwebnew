"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, ExternalLink } from "lucide-react";
import type { User, UserRole } from "@/types";
import { roleLabels } from "@/data/users";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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

type LineStatusState = "loading" | "connected" | "disconnected" | "unknown";

function DashboardLineStatusButton() {
  const [status, setStatus] = useState<LineStatusState>("loading");

  useEffect(() => {
    let mounted = true;

    async function loadLineStatus() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("missing_session");

        const res = await fetch("/api/account/line/status", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("line_status_failed");
        const data = (await res.json()) as {
          line?: {
            connected?: boolean;
          };
        };

        if (!mounted) return;
        setStatus(data.line?.connected === true ? "connected" : "disconnected");
      } catch {
        if (mounted) setStatus("unknown");
      }
    }

    loadLineStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const connected = status === "connected";
  const label =
    status === "loading"
      ? "เชื่อม LINE"
      : connected
      ? "เชื่อม LINE แล้ว"
      : status === "disconnected"
      ? "ยังไม่ได้เชื่อม LINE"
      : "เชื่อม LINE";

  return (
    <Link
      href="/dashboard/account"
      className={cn(
        "inline-flex max-w-[8.75rem] items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 shadow-sm transition",
        connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
      )}
      title={label}
    >
      <span className="truncate">{label}</span>
    </Link>
  );
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

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          href="/"
          target="_blank"
          className="hidden shrink-0 items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600 sm:inline-flex"
        >
          ดูเว็บไซต์
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="flex min-w-0 max-w-[13.5rem] flex-col items-center justify-center sm:max-w-[18rem]">
          <div className="max-w-full truncate text-center text-sm font-semibold leading-tight text-slate-900">
            {displayName}
          </div>
          <div className="mt-1 flex max-w-full flex-wrap items-center justify-center gap-1.5">
            <DashboardLineStatusButton />
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
