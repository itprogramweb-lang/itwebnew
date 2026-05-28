"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentUser } from "@/lib/auth";
import { canAccessDashboardRoute } from "@/lib/permissions";
import type { User } from "@/types";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((u) => {
      if (!mounted) return;
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-sm text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) return null;

  const hasAccess = canAccessDashboardRoute(user.role, pathname);
  const isStudent = user.role === "student";

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <DashboardSidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">
          {isStudent ? (
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
          ) : hasAccess ? (
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
