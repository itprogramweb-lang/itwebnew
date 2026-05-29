import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { hasPermission } from "@/lib/permissions";
import { getAuthenticatedProfile, isAllowedUserRole } from "@/lib/serverAuth";
import { normalizeRole } from "@/lib/roles";

type UserPayload = {
  email?: string;
  temporaryPassword?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_CREATION_NOT_CONFIGURED = "User creation is not configured on the server.";

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

function isAdminClientConfigError(error: unknown) {
  return error instanceof Error && error.message.includes("Missing Supabase admin env vars");
}

async function requireUserManager(request: NextRequest) {
  try {
    const requester = await getAuthenticatedProfile(request);
    if (!requester) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    if (!hasPermission(requester.role, "manage_users")) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { requester };
  } catch (error) {
    if (isAdminClientConfigError(error)) {
      return {
        error: NextResponse.json({ error: USER_CREATION_NOT_CONFIGURED }, { status: 500 }),
      };
    }
    throw error;
  }
}

function getAdminClientOrResponse() {
  try {
    return { admin: createSupabaseAdminClient() };
  } catch (error) {
    if (isAdminClientConfigError(error)) {
      return {
        error: NextResponse.json({ error: USER_CREATION_NOT_CONFIGURED }, { status: 500 }),
      };
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireUserManager(request);
  if (auth.error) return auth.error;

  const adminResult = getAdminClientOrResponse();
  if (adminResult.error) return adminResult.error;
  const admin = adminResult.admin;
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
  const auth = await requireUserManager(request);
  if (auth.error) return auth.error;

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

  const adminResult = getAdminClientOrResponse();
  if (adminResult.error) return adminResult.error;
  const admin = adminResult.admin;
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
