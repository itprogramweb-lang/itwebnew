import { NextRequest, NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

async function requirePagesManager(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile)
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!can(profile.role, "manage_pages"))
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { profile };
}

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function cleanJson(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

export async function GET(request: NextRequest) {
  const auth = await requirePagesManager(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("page_settings")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Admin pages GET failed:", error.message);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลหน้าเว็บได้ ตรวจสอบว่า migration round39 ถูกรันหรือไม่" },
      { status: 500 }
    );
  }

  return NextResponse.json({ pages: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requirePagesManager(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const { page_key, ...updates } = body as Record<string, unknown>;

  if (!page_key || typeof page_key !== "string") {
    return NextResponse.json({ error: "ต้องระบุ page_key" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("page_settings")
    .select("id, settings")
    .eq("page_key", page_key)
    .maybeSingle();

  const payload: Record<string, unknown> = { page_key };

  if ("title" in updates) payload.title = cleanText(updates.title);
  if ("subtitle" in updates) payload.subtitle = cleanText(updates.subtitle);
  if ("description" in updates) payload.description = cleanText(updates.description);
  if ("hero_image_url" in updates) payload.hero_image_url = cleanText(updates.hero_image_url);
  if ("hero_image_alt" in updates) payload.hero_image_alt = cleanText(updates.hero_image_alt);
  if ("hero_image_crop_settings" in updates)
    payload.hero_image_crop_settings = cleanJson(updates.hero_image_crop_settings);
  if ("hero_layout" in updates)
    payload.hero_layout = cleanText(updates.hero_layout) ?? "default";
  if ("cta_label" in updates) payload.cta_label = cleanText(updates.cta_label);
  if ("cta_url" in updates) payload.cta_url = cleanText(updates.cta_url);
  if ("cta_external" in updates) payload.cta_external = updates.cta_external === true;
  if ("is_active" in updates) payload.is_active = updates.is_active !== false;
  if ("settings" in updates) {
    const existingSettings = cleanJson(
      (existing as { settings?: unknown } | null)?.settings
    );
    payload.settings = { ...existingSettings, ...cleanJson(updates.settings) };
  }

  const query = existing
    ? admin
        .from("page_settings")
        .update(payload)
        .eq("page_key", page_key)
        .select("*")
        .single()
    : admin.from("page_settings").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) {
    console.error("Admin pages PATCH failed:", error.message);
    return NextResponse.json({ error: "ไม่สามารถบันทึกข้อมูลหน้าเว็บได้" }, { status: 500 });
  }

  return NextResponse.json({ page: data });
}
