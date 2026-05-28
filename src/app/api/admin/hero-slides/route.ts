import { NextRequest, NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

async function requireAuth(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!can(profile.role, "manage_hero_slides")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { profile };
}

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ slides: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("hero_slides")
    .insert(body)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "เพิ่มสไลด์ไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ slide: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanText(body.id);
  if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });

  const { id: _id, ...payload } = body;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("hero_slides")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ slide: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = cleanText(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("hero_slides")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "ลบสไลด์ไม่สำเร็จ" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}