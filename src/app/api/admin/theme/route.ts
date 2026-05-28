import { NextRequest, NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

async function requireAuth(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!can(profile.role, "manage_settings")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { profile };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("id, theme, design_tokens")
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ settings: data ?? null });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as { theme?: unknown; design_tokens?: unknown };
  const payload = {
    ...(body.theme !== undefined ? { theme: body.theme } : {}),
    ...(body.design_tokens !== undefined ? { design_tokens: body.design_tokens } : {}),
  };

  const admin = createSupabaseAdminClient();

  // Find existing row
  const { data: existing } = await admin
    .from("site_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from("site_settings")
      .update(payload)
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: existing.id });
  } else {
    const { data: inserted, error } = await admin
      .from("site_settings")
      .insert(payload)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "บันทึกไม่สำเร็จ: " + error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: (inserted as { id: string }).id }, { status: 201 });
  }
}
