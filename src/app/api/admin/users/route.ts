import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile, isAllowedUserRole, isSuperAdmin } from "@/lib/serverAuth";
import { normalizeRole } from "@/lib/roles";

type UserPayload = {
  email?: string;
  temporaryPassword?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUser(profile: {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}) {
  return {
    id: profile.id,
    email: profile.email ?? "",
    full_name: profile.full_name ?? "",
    role: normalizeRole(profile.role),
    is_active: profile.is_active !== false,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const requester = await getAuthenticatedProfile(request);
  if (!requester) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(requester)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const role = searchParams.get("role")?.trim();
  const status = searchParams.get("status")?.trim();

  let query = admin
    .from("profiles")
    .select("id,email,full_name,role,is_active,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  if (role && role !== "all") {
    query = query.eq("role", role);
  }
  if (status === "active") {
    query = query.eq("is_active", true);
  }
  if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "ไม่สามารถโหลดผู้ใช้งานได้" }, { status: 500 });
  }

  return NextResponse.json({ users: (data ?? []).map(safeUser) });
}

export async function POST(request: NextRequest) {
  const requester = await getAuthenticatedProfile(request);
  if (!requester) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(requester)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as UserPayload;
  const email = body.email?.trim().toLowerCase();
  const password = body.temporaryPassword ?? "";
  const fullName = body.full_name?.trim() ?? "";
  const role = body.role;
  const isActive = body.is_active !== false;

  if (!email || !emailPattern.test(email)) {
    return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "temporary password ต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }
  if (!isAllowedUserRole(role)) {
    return NextResponse.json({ error: "role ไม่ถูกต้อง" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: "ไม่สามารถสร้างบัญชี Auth ได้" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      id: created.user.id,
      email,
      full_name: fullName || email,
      role,
      is_active: isActive,
      status: isActive ? "active" : "inactive",
    })
    .select("id,email,full_name,role,is_active,created_at,updated_at")
    .single();

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "ไม่สามารถสร้าง profile ได้" }, { status: 400 });
  }

  return NextResponse.json({ user: safeUser(profile) }, { status: 201 });
}
