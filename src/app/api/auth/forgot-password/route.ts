import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildCanonicalUrl } from "@/lib/siteUrl";

const GENERIC_RESET_MESSAGE =
  "หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้ทางอีเมล";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSupabaseAnonEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("missing_supabase_anon_env");
  }
  return { supabaseUrl, supabaseAnonKey };
}

export async function POST(request: NextRequest) {
  let body: { email?: unknown };

  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "ไม่สามารถอ่านข้อมูลที่ส่งมาได้" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseAnonEnv();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        flowType: "implicit",
        persistSession: false,
      },
    });

    // TODO: Add a persistent rate limit/cooldown before production traffic increases.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildCanonicalUrl("/reset-password"),
    });
  } catch (error) {
    console.warn("Password reset request could not be completed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
  }

  return NextResponse.json({ message: GENERIC_RESET_MESSAGE });
}
