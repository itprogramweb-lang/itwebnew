"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  GraduationCap,
  FolderKanban,
  MessageSquareWarning,
  UserCog,
  Settings,
  LogOut,
  X,
  MonitorPlay,
  Palette,
  LayoutTemplate,
  Award,
  Bookmark,
  Monitor, // 🌟 เปลี่ยนมา Import ไอคอน Monitor (หน้าจอคอมพิวเตอร์) แทน Cctv
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  canAccessDashboardRouteWithPermissions,
  type Permission,
} from "@/lib/permissions";
import type { User } from "@/types";
import { siteData } from "@/data/site";
import { RoleBadge } from "@/components/ui/badges";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/dashboard/hero-slides", label: "สไลด์หน้าแรก", icon: <MonitorPlay className="w-4 h-4" /> },
  { href: "/dashboard/news", label: "ข่าว/ประกาศ", icon: <Newspaper className="w-4 h-4" /> },
  { href: "/dashboard/staff", label: "บุคลากร", icon: <Users className="w-4 h-4" /> },
  { href: "/dashboard/programs", label: "หลักสูตร", icon: <Award className="w-4 h-4" /> },
  { href: "/dashboard/courses", label: "รายวิชา", icon: <Bookmark className="w-4 h-4" /> },
  
  // 🌟 จุดที่แก้ไข: เปลี่ยนเป็นไอคอน Monitor หน้าจอคอมพิวเตอร์เรียบร้อยครับ
  { 
    href: "/dashboard/learning-facilities", 
    label: "อุปกรณ์และห้องปฏิบัติการ", 
    icon: <Monitor className="w-4 h-4" /> 
  },

  { href: "/dashboard/student-works", label: "ผลงานนักศึกษา", icon: <FolderKanban className="w-4 h-4" /> },
  { href: "/dashboard/teacher-works", label: "ผลงานอาจารย์", icon: <GraduationCap className="w-4 h-4" /> },
  { href: "/dashboard/complaints", label: "ข้อร้องเรียน", icon: <MessageSquareWarning className="w-4 h-4" /> },
  { href: "/dashboard/users", label: "ผู้ใช้งาน", icon: <UserCog className="w-4 h-4" /> },
  { href: "/dashboard/pages", label: "จัดการหน้าเว็บ", icon: <LayoutTemplate className="w-4 h-4" /> },
  { href: "/dashboard/theme", label: "ปรับธีมเว็บไซต์", icon: <Palette className="w-4 h-4" /> },
  { href: "/dashboard/settings", label: "ตั้งค่าเว็บไซต์", icon: <Settings className="w-4 h-4" /> },
];

export default function DashboardSidebar({
  user,
  canViewComplaints = false,
  effectivePermissions = null,
  open,
  onClose,
}: {
  user: User;
  canViewComplaints?: boolean;
  effectivePermissions?: readonly Permission[] | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const allowedItems = navItems.filter((n) => {
    if (n.href === "/dashboard/complaints") {
      return (
        canAccessDashboardRouteWithPermissions(user.role, n.href, effectivePermissions) ||
        canViewComplaints
      );
    }
    return canAccessDashboardRouteWithPermissions(
      user.role,
      n.href,
      effectivePermissions
    );
  });

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-40"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transform transition-transform duration-300",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white shadow-brand">
              <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 leading-tight">
                {siteData.shortName}
              </div>
              <div className="text-[10px] text-slate-500">หลังบ้านระบบจัดการ</div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {allowedItems.map((n) => {
              const active =
                n.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition",
                      active
                        ? "bg-brand-gradient text-white font-medium shadow-brand"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {n.icon}
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}
