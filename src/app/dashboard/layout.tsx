"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import {
  canAccessDashboardRouteWithPermissions,
  isPermission,
  type Permission,
} from "@/lib/permissions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@/types";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

type ComplaintAccessState = {
  canViewComplaints: boolean;
  canManageComplaints: boolean;
  isDepartmentHead: boolean;
};

const defaultComplaintAccess: ComplaintAccessState = {
  canViewComplaints: false,
  canManageComplaints: false,
  isDepartmentHead: false,
};

function normalizeDashboardPath(pathname: string) {
  return pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<Permission[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [complaintAccess, setComplaintAccess] = useState<ComplaintAccessState>(defaultComplaintAccess);
  const [complaintAccessLoading, setComplaintAccessLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const u = await getCurrentUser();
      if (!mounted) return;
      if (!u) {
        router.replace("/login");
        return;
      }

      let permissions: Permission[] | null = null;
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) {
          const res = await fetch("/api/admin/dashboard?access=1", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const json = (await res.json()) as { effectivePermissions?: unknown };
            if (Array.isArray(json.effectivePermissions)) {
              permissions = json.effectivePermissions.filter(isPermission);
            }
          } else if (res.status === 403) {
            permissions = [];
          }
        }
      } catch {
        permissions = null;
      }

      if (!mounted) return;
      setEffectivePermissions(permissions);
      setUser({ ...u, effectivePermissions: permissions ?? undefined });
      setLoading(false);
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    let mounted = true;

    async function loadComplaintAccess() {
      if (
        !user ||
        !canAccessDashboardRouteWithPermissions(user.role, "/dashboard", effectivePermissions)
      ) {
        setComplaintAccess(defaultComplaintAccess);
        setComplaintAccessLoading(false);
        return;
      }

      if (
        canAccessDashboardRouteWithPermissions(
          user.role,
          "/dashboard/complaints",
          effectivePermissions
        )
      ) {
        setComplaintAccess({
          canViewComplaints: true,
          canManageComplaints: false,
          isDepartmentHead: false,
        });
        setComplaintAccessLoading(false);
        return;
      }

      setComplaintAccessLoading(true);
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Missing session");

        const res = await fetch("/api/admin/complaints?access=1", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Forbidden");
        const dataJson = (await res.json()) as {
          permissions?: {
            canView?: boolean;
            canUpdate?: boolean;
            isDepartmentHead?: boolean;
          };
        };

        if (!mounted) return;
        const isDepartmentHead = dataJson.permissions?.isDepartmentHead === true;
        setComplaintAccess({
          canViewComplaints: isDepartmentHead,
          canManageComplaints: isDepartmentHead && dataJson.permissions?.canUpdate === true,
          isDepartmentHead,
        });
      } catch {
        if (!mounted) return;
        setComplaintAccess(defaultComplaintAccess);
      } finally {
        if (mounted) setComplaintAccessLoading(false);
      }
    }

    loadComplaintAccess();

    return () => {
      mounted = false;
    };
  }, [user, effectivePermissions]);

  if (loading) {
    return (
      <div className="notranslate min-h-screen grid place-items-center bg-slate-50" translate="no">
        <div className="text-sm text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) return null;

  const normalizedPathname = normalizeDashboardPath(pathname);
  const isComplaintsRoute = normalizedPathname === "/dashboard/complaints";
  const staticHasAccess = canAccessDashboardRouteWithPermissions(
    user.role,
    pathname,
    effectivePermissions
  );
  const hasAccess = isComplaintsRoute
    ? staticHasAccess || complaintAccess.canViewComplaints
    : staticHasAccess;
  const canViewDashboard = canAccessDashboardRouteWithPermissions(
    user.role,
    "/dashboard",
    effectivePermissions
  );

  if (!canViewDashboard) {
    return (
      <div className="notranslate min-h-screen bg-slate-50 p-4" translate="no">
        <div className="max-w-md mx-auto mt-10 bg-white border border-slate-100 rounded-3xl p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 grid place-items-center text-slate-500 mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            ยังไม่มีพื้นที่สำหรับนักศึกษาในขณะนี้
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            บัญชีนักศึกษายังไม่สามารถใช้งาน dashboard หลักได้
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-brand"
          >
            กลับสู่เว็บไซต์
          </Link>
        </div>
      </div>
    );
  }

  if (isComplaintsRoute && !staticHasAccess && complaintAccessLoading) {
    return (
      <div className="notranslate min-h-screen grid place-items-center bg-slate-50" translate="no">
        <div className="text-sm text-slate-500">กำลังตรวจสอบสิทธิ์...</div>
      </div>
    );
  }

  return (
    <div className="notranslate h-screen bg-slate-50 flex overflow-hidden" translate="no">
      <DashboardSidebar
        user={user}
        canViewComplaints={complaintAccess.canViewComplaints}
        effectivePermissions={effectivePermissions}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          user={user}
          isDepartmentHead={complaintAccess.isDepartmentHead}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">
          {hasAccess ? (
            children
          ) : (
            <div className="max-w-md mx-auto mt-10 bg-white border border-rose-100 rounded-3xl p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 grid place-items-center text-rose-500 mb-4">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                คุณไม่มีสิทธิ์เข้าถึงหน้านี้
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                บัญชีของคุณไม่มี permission สำหรับเส้นทางนี้
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 mt-5 h-10 px-4 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-brand"
              >
                กลับสู่ภาพรวม
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
