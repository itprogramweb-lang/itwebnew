import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/types";
import {
  ALLOWED_ROLES,
  isProfileActive,
  normalizeRole,
  type ProfileRow,
} from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type AdminProfile = ProfileRow & {
  role: UserRole;
};

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim();
}

function getAnonEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase anon env vars.");
  }
  return { supabaseUrl, supabaseAnonKey };
}

export async function getAuthenticatedProfile(request: NextRequest): Promise<AdminProfile | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const { supabaseUrl, supabaseAnonKey } = getAnonEnv();
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData.user) return null;

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,email,full_name,role,is_active,status,created_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile || !isProfileActive(profile)) return null;

  return {
    ...profile,
    email: profile.email ?? userData.user.email ?? "",
    role: normalizeRole(profile.role),
  };
}

export function isSuperAdmin(profile: AdminProfile | null): profile is AdminProfile {
  return profile?.role === "super_admin";
}

export function isAllowedUserRole(role: unknown): role is UserRole {
  return typeof role === "string" && ALLOWED_ROLES.includes(role as UserRole);
}
