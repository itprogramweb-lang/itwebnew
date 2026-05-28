import { NextRequest, NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

type SiteSettingsPayload = {
  site_name?: string;
  faculty_name?: string;
  university_name?: string;
  logo_url?: string | null;
  logo_alt?: string | null;
  logo_desktop_size?: number | null;
  logo_mobile_size?: number | null;
  logo_crop_preset?: string | null;
  logo_object_position?: string | null;
  logo_fit_mode?: string | null;
  logo_pos_x?: number | null;
  logo_pos_y?: number | null;
  logo_zoom?: number | null;
  show_logo?: boolean | null;
  show_brand_name?: boolean | null;
  brand_name?: string | null;
  brand_short_name?: string | null;
  department_name_th?: string | null;
  department_name_en?: string | null;
  loan_external_url?: string | null;
 welfare_external_url?: string | null;
  apply_hero_image_url?: string | null;
  apply_image_crop_settings?: Record<string, unknown> | null;
  apply_hero_template?: string | null;
  apply_title?: string | null;
  apply_eyebrow?: string | null;
  apply_description?: string | null;
  staff_intro_title?: string | null;
  staff_intro_description?: string | null;
  staff_position_order?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  facebook_url?: string | null;
  line_url?: string | null;
  design_tokens?: Record<string, unknown> | null;
  logo_navbar_display_mode?: string | null;
  logo_navbar_visual_size_desktop?: number | string | null;
  logo_navbar_visual_size_mobile?: number | string | null;
  logo_navbar_offset_x?: number | string | null;
  logo_navbar_offset_y?: number | string | null;
  logo_navbar_overflow?: string | null;
  logo_navbar_z_index?: number | string | null;
};

type SiteSettingsRow = Record<string, unknown> & { id?: string };

const DEFAULT_SETTING_VALUES: Record<string, unknown> = {
  theme: {},
  design_tokens: {},
  apply_image_crop_settings: {},
  logo_desktop_size: 44,
  logo_mobile_size: 40,
  logo_crop_preset: "square-contain",
  logo_object_position: "center",
  logo_fit_mode: "contain",
  logo_pos_x: 50,
  logo_pos_y: 50,
  logo_zoom: 1,
  show_logo: true,
  show_brand_name: true,
  loan_external_url: "https://sd.rmutt.ac.th/?page_id=2274",
  welfare_external_url: "https://sd.rmutt.ac.th/",
  apply_hero_template: "no-image-clean",
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanRange(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
}

function hasOwn(obj: object, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function cleanJson(value: unknown, fallback: Record<string, unknown> = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function cleanTokenNumber(value: unknown, fallback: string, min: number, max: number): string {
  return String(cleanRange(value, Number(fallback), min, max));
}

function normalizeSettings(row: SiteSettingsRow | null) {
  if (!row) return null;
  return {
    ...DEFAULT_SETTING_VALUES,
    ...row,
    theme: cleanJson(row.theme),
    design_tokens: cleanJson(row.design_tokens),
    apply_image_crop_settings: cleanJson(row.apply_image_crop_settings),
  };
}

async function requireSettingsManager(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!can(profile.role, "manage_settings")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { profile };
}

export async function GET(request: NextRequest) {
  const auth = await requireSettingsManager(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Admin settings GET failed:", error.message);
    return NextResponse.json(
      {
        error: "ไม่สามารถโหลดข้อมูลเว็บไซต์ได้",
        detail: "ตรวจสอบว่า migration ของ site_settings ถูกรันครบหรือไม่",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ settings: normalizeSettings((data as SiteSettingsRow | null) ?? null) });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSettingsManager(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as SiteSettingsPayload;

  const admin = createSupabaseAdminClient();
  const { data: existing, error: loadError } = await admin
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (loadError) {
    console.error("Admin settings PATCH load failed:", loadError.message);
    return NextResponse.json({ error: "ไม่สามารถตรวจสอบข้อมูลเดิมได้" }, { status: 500 });
  }

  const current: Record<string, unknown> =
    normalizeSettings((existing as SiteSettingsRow | null) ?? null) ?? DEFAULT_SETTING_VALUES;
  const currentDesignTokens = cleanJson(current.design_tokens);
  const requestedDesignTokens = hasOwn(body, "design_tokens") ? cleanJson(body.design_tokens) : {};
  const designTokens: Record<string, unknown> = {
    ...currentDesignTokens,
    ...requestedDesignTokens,
  };
  if (hasOwn(body, "logo_navbar_display_mode")) {
    designTokens.logoNavbarDisplayMode = body.logo_navbar_display_mode === "free" ? "free" : "contained";
  }
  if (hasOwn(body, "logo_navbar_visual_size_desktop")) {
    designTokens.logoNavbarVisualSizeDesktop = cleanTokenNumber(body.logo_navbar_visual_size_desktop, "96", 24, 800);
  }
  if (hasOwn(body, "logo_navbar_visual_size_mobile")) {
    designTokens.logoNavbarVisualSizeMobile = cleanTokenNumber(body.logo_navbar_visual_size_mobile, "72", 20, 400);
  }
  if (hasOwn(body, "logo_navbar_offset_x")) {
    designTokens.logoNavbarOffsetX = cleanTokenNumber(body.logo_navbar_offset_x, "0", -300, 300);
  }
  if (hasOwn(body, "logo_navbar_offset_y")) {
    designTokens.logoNavbarOffsetY = cleanTokenNumber(body.logo_navbar_offset_y, "0", -200, 200);
  }
  if (hasOwn(body, "logo_navbar_overflow")) {
    designTokens.logoNavbarOverflow = body.logo_navbar_overflow === "contained" ? "contained" : "visible";
  }
  if (hasOwn(body, "logo_navbar_z_index")) {
    designTokens.logoNavbarZIndex = cleanTokenNumber(body.logo_navbar_z_index, "45", 1, 100);
  }
  const textField = (key: keyof SiteSettingsPayload) =>
    hasOwn(body, key) ? cleanText(body[key]) : current[key as string] ?? null;
  const payload: Record<string, unknown> = {
    site_name: textField("site_name"),
    faculty_name: textField("faculty_name"),
    university_name: textField("university_name"),
    logo_url: textField("logo_url"),
    logo_alt: textField("logo_alt"),
    logo_desktop_size: hasOwn(body, "logo_desktop_size")
      ? cleanRange(body.logo_desktop_size, 96, 24, 800)
      : current.logo_desktop_size,
    logo_mobile_size: hasOwn(body, "logo_mobile_size")
      ? cleanRange(body.logo_mobile_size, 72, 20, 400)
      : current.logo_mobile_size,
    logo_crop_preset: hasOwn(body, "logo_crop_preset") ? cleanText(body.logo_crop_preset) ?? "square-contain" : current.logo_crop_preset,
    logo_object_position: hasOwn(body, "logo_object_position") ? cleanText(body.logo_object_position) ?? "center" : current.logo_object_position,
    logo_fit_mode: hasOwn(body, "logo_fit_mode") ? cleanText(body.logo_fit_mode) ?? "contain" : current.logo_fit_mode,
    logo_pos_x: hasOwn(body, "logo_pos_x") ? cleanRange(body.logo_pos_x, 50, 0, 100) : current.logo_pos_x,
    logo_pos_y: hasOwn(body, "logo_pos_y") ? cleanRange(body.logo_pos_y, 50, 0, 100) : current.logo_pos_y,
    logo_zoom: hasOwn(body, "logo_zoom") ? Math.max(1, Number(body.logo_zoom) || 1) : current.logo_zoom,
    show_logo: hasOwn(body, "show_logo") ? body.show_logo === true : current.show_logo,
    show_brand_name: hasOwn(body, "show_brand_name") ? body.show_brand_name === true : current.show_brand_name,
    brand_name: textField("brand_name"),
    brand_short_name: textField("brand_short_name"),
    department_name_th: textField("department_name_th"),
    department_name_en: textField("department_name_en"),
    loan_external_url: textField("loan_external_url"),
    welfare_external_url: textField("welfare_external_url"),
    apply_hero_image_url: textField("apply_hero_image_url"),
    apply_image_crop_settings: hasOwn(body, "apply_image_crop_settings")
      ? cleanJson(body.apply_image_crop_settings)
      : cleanJson(current.apply_image_crop_settings),
    apply_hero_template: hasOwn(body, "apply_hero_template") ? cleanText(body.apply_hero_template) ?? "no-image-clean" : current.apply_hero_template,
    apply_title: textField("apply_title"),
    apply_eyebrow: textField("apply_eyebrow"),
    apply_description: textField("apply_description"),
    staff_intro_title: textField("staff_intro_title"),
    staff_intro_description: textField("staff_intro_description"),
    staff_position_order: textField("staff_position_order"),
    phone: textField("phone"),
    email: textField("email"),
    address: textField("address"),
    facebook_url: textField("facebook_url"),
    line_url: textField("line_url"),
    design_tokens: designTokens,
  };

  if (!payload.site_name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อสาขา" }, { status: 400 });
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email as string)) {
    return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
  }

  const query = existing?.id
    ? admin.from("site_settings").update(payload).eq("id", existing.id).select("*").single()
    : admin.from("site_settings").insert({ ...payload, theme: {} }).select("*").single();

  const { data, error } = await query;
  if (error) {
    console.error("Admin settings PATCH save failed:", error.message);
    return NextResponse.json(
      {
        error: "ไม่สามารถบันทึกข้อมูลเว็บไซต์ได้",
        detail: "ถ้าเพิ่งอัปเดตโค้ด ให้รัน migration ของ round34-38.5 ให้ครบก่อน",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ settings: normalizeSettings((data as SiteSettingsRow | null) ?? null) });
}
