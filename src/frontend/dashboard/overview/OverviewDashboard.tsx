"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  FolderKanban,
  GraduationCap,
  Image,
  Loader2,
  MessageSquareWarning,
  Newspaper,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/badges";
import { complaintTypeLabels } from "@/data/complaints";
import { formatDate } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ComplaintStatus, ComplaintType } from "@/types";

type DashboardResponse = {
  counts?: {
    heroSlides: number;
    staff: number;
    programs: number;
    studentWorks: number;
    teacherWorks: number;
    complaints: number;
    newComplaints: number;
    news: number;
  };
  recent?: {
    complaints: {
      id: string;
      tracking_code: string | null;
      complaint_type: string | null;
      title: string;
      status: string | null;
      created_at: string | null;
    }[];
    news: {
      id: string;
      title: string;
      category: string | null;
      status: string | null;
      published_at: string | null;
      created_at: string | null;
    }[];
  };
  error?: string;
};

async function getAuthHeaders() {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");
  return {
    Authorization: `Bearer ${token}`,
  };
}

function normalizeComplaintStatus(status: string | null): ComplaintStatus {
  if (status === "in_progress" || status === "resolved" || status === "rejected") return status;
  return "new";
}

function normalizeComplaintType(type: string | null): ComplaintType {
  const allowed = Object.keys(complaintTypeLabels);
  return (type && allowed.includes(type) ? type : "other") as ComplaintType;
}

export default function OverviewDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/dashboard", { headers });
      const json = (await res.json()) as DashboardResponse;
      if (!res.ok) throw new Error(json.error || "ไม่สามารถโหลดข้อมูลภาพรวมได้");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลภาพรวมได้");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(
    () => [
      {
        label: "สไลด์หน้าแรก",
        value: data?.counts?.heroSlides ?? "-",
        icon: <Image className="w-5 h-5" />,
        trend: "active",
      },
      {
        label: "หลักสูตร",
        value: data?.counts?.programs ?? "-",
        icon: <BookOpen className="w-5 h-5" />,
        trend: "active",
      },
      {
        label: "ข่าวเผยแพร่",
        value: data?.counts?.news ?? "-",
        icon: <Newspaper className="w-5 h-5" />,
        trend: "published",
      },
      {
        label: "ผลงานนักศึกษา",
        value: data?.counts?.studentWorks ?? "-",
        icon: <FolderKanban className="w-5 h-5" />,
        trend: "active",
      },
      {
        label: "ผลงานอาจารย์",
        value: data?.counts?.teacherWorks ?? "-",
        icon: <GraduationCap className="w-5 h-5" />,
        trend: "active",
      },
      {
        label: "ข้อร้องเรียนใหม่",
        value: data?.counts?.newComplaints ?? "-",
        icon: <MessageSquareWarning className="w-5 h-5" />,
        trend: data?.counts ? `${data.counts.complaints} รายการทั้งหมด` : "โหลดไม่ได้",
      },
      {
        label: "บุคลากร",
        value: data?.counts?.staff ?? "-",
        icon: <Users className="w-5 h-5" />,
        trend: "active",
      },
    ],
    [data]
  );

  const recent = useMemo(() => {
    const complaints = (data?.recent?.complaints ?? []).map((item) => ({
      id: item.id,
      type: "complaint" as const,
      title: item.title,
      sub: complaintTypeLabels[normalizeComplaintType(item.complaint_type)],
      date: item.created_at,
      status: normalizeComplaintStatus(item.status),
    }));
    const news = (data?.recent?.news ?? []).map((item) => ({
      id: item.id,
      type: "news" as const,
      title: item.title,
      sub: item.category || item.status || "ข่าว",
      date: item.published_at || item.created_at,
      status: null,
    }));
    return [...complaints, ...news]
      .sort((a, b) => ((a.date ?? "") < (b.date ?? "") ? 1 : -1))
      .slice(0, 5);
  }, [data]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">ภาพรวม</h1>
          <p className="text-sm text-slate-500 mt-1">สรุปข้อมูลจริงจาก Supabase และกิจกรรมล่าสุดในระบบ</p>
        </div>
        {loading && (
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            กำลังโหลดข้อมูล
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-slate-900">กิจกรรมล่าสุด</h2>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              {loading ? "กำลังโหลด..." : "ยังไม่มีข้อมูลล่าสุด"}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((item) => (
                <li key={`${item.type}-${item.id}`} className="py-3 flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${
                      item.type === "complaint"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {item.type === "complaint" ? (
                      <MessageSquareWarning className="w-4 h-4" />
                    ) : (
                      <Newspaper className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 line-clamp-1">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.sub} • {item.date ? formatDate(item.date) : "-"}
                    </div>
                  </div>
                  {item.status && <StatusBadge status={item.status} />}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6">
          <h2 className="font-semibold text-slate-900 mb-1">ลัด</h2>
          <p className="text-xs text-slate-500 mb-4">เข้าถึงเมนูที่ใช้บ่อย</p>
          <div className="space-y-2">
            {[
              { label: "เพิ่มข่าว/ประกาศใหม่", href: "/dashboard/news" },
              { label: "เพิ่มผลงานนักศึกษา", href: "/dashboard/student-works" },
              { label: "ดูข้อร้องเรียน", href: "/dashboard/complaints" },
              { label: "ตั้งค่าเว็บไซต์", href: "/dashboard/settings" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition group"
              >
                {action.label}
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
