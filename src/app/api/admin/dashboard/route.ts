import { NextRequest, NextResponse } from "next/server";
import { hasPermissionFromList } from "@/lib/permissions";
import { getComplaintAccessForProfile } from "@/lib/complaintAccess";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfileWithPermissions } from "@/lib/serverAuth";

type CountKey =
  | "heroSlides"
  | "staff"
  | "programs"
  | "studentWorks"
  | "teacherWorks"
  | "complaints"
  | "newComplaints"
  | "news";

async function getCount(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  table: string,
  filters: Record<string, string | boolean> = {}
) {
  let query = admin.from(table).select("id", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function GET(request: NextRequest) {
  const profile = await getAuthenticatedProfileWithPermissions(request);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermissionFromList(profile.effectivePermissions, "view_dashboard")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("access") === "1") {
    return NextResponse.json({
      effectivePermissions: profile.effectivePermissions,
      permissionsUnavailable: profile.permissionsUnavailable,
    });
  }

  const admin = createSupabaseAdminClient();
  try {
    const legacyComplaintAccess = await getComplaintAccessForProfile(profile);
    const canManageComplaints = hasPermissionFromList(
      profile.effectivePermissions,
      "manage_complaints"
    );
    const canViewComplaints =
      canManageComplaints ||
      hasPermissionFromList(profile.effectivePermissions, "view_complaints") ||
      legacyComplaintAccess.isDepartmentHead;
    const countEntries = await Promise.all([
      getCount(admin, "hero_slides", { is_active: true }).then((value) => ["heroSlides", value] as const),
      getCount(admin, "staff_members", { is_active: true }).then((value) => ["staff", value] as const),
      getCount(admin, "programs", { is_active: true }).then((value) => ["programs", value] as const),
      getCount(admin, "student_works", { is_active: true }).then((value) => ["studentWorks", value] as const),
      getCount(admin, "teacher_works", { is_active: true }).then((value) => ["teacherWorks", value] as const),
      canViewComplaints
        ? getCount(admin, "complaints").then((value) => ["complaints", value] as const)
        : Promise.resolve(["complaints", 0] as const),
      canViewComplaints
        ? getCount(admin, "complaints", { status: "new" }).then((value) => ["newComplaints", value] as const)
        : Promise.resolve(["newComplaints", 0] as const),
      getCount(admin, "news", { status: "published" }).then((value) => ["news", value] as const),
    ]);

    const counts = Object.fromEntries(
      countEntries.map(([key, value]) => [key, value])
    ) as Record<CountKey, number>;

    const recentComplaints = canViewComplaints
      ? (
          await admin
            .from("complaints")
            .select("id,tracking_code,complaint_type,title,status,created_at")
            .order("created_at", { ascending: false })
            .limit(3)
        ).data
      : [];

    const { data: recentNews } = await admin
      .from("news")
      .select("id,title,category,status,published_at,created_at")
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(3);

    return NextResponse.json({
      effectivePermissions: profile.effectivePermissions,
      permissionsUnavailable: profile.permissionsUnavailable,
      counts,
      recent: {
        complaints: recentComplaints ?? [],
        news: recentNews ?? [],
      },
    });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลภาพรวมได้" }, { status: 500 });
  }
}
