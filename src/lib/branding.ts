// Server-only — ใช้ใน Server Components เท่านั้น
import { getSiteSettings } from "@/lib/supabase/queries";

export type { BrandingData } from "@/lib/brandingTypes";
export { DEFAULT_BRANDING } from "@/lib/brandingTypes";

import type { BrandingData } from "@/lib/brandingTypes";
import { DEFAULT_BRANDING } from "@/lib/brandingTypes";

function tokenString(
  tokens: Record<string, unknown> | null | undefined,
  key: string,
  fallback: string
) {
  const value = tokens?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function tokenNumber(
  tokens: Record<string, unknown> | null | undefined,
  key: string,
  fallback: number,
  min: number,
  max: number
) {
  const value = Number(tokens?.[key]);

  return Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : fallback;
}

export async function getBranding(): Promise<BrandingData> {
  try {
    const s = await getSiteSettings();

    if (!s) return DEFAULT_BRANDING;

    const tokens = s.design_tokens;

    const displayMode = tokenString(
      tokens,
      "logoNavbarDisplayMode",
      DEFAULT_BRANDING.logoNavbarDisplayMode
    );

    const overflow = tokenString(
      tokens,
      "logoNavbarOverflow",
      DEFAULT_BRANDING.logoNavbarOverflow
    );

    return {
      brandName:
        s.brand_name || s.site_name || DEFAULT_BRANDING.brandName,

      brandShortName:
        s.brand_short_name || DEFAULT_BRANDING.brandShortName,

      departmentNameTh:
        s.department_name_th || s.site_name || DEFAULT_BRANDING.departmentNameTh,

      departmentNameEn:
        s.department_name_en || DEFAULT_BRANDING.departmentNameEn,

      universityNameTh:
        s.university_name_th ||
        s.university_name ||
        DEFAULT_BRANDING.universityNameTh,

      universityNameEn:
        s.university_name_en || DEFAULT_BRANDING.universityNameEn,

      logoUrl:
        s.logo_url || null,

      logoAlt:
        s.logo_alt || DEFAULT_BRANDING.logoAlt,

      logoDesktopSize:
        s.logo_desktop_size ?? DEFAULT_BRANDING.logoDesktopSize,

      logoMobileSize:
        s.logo_mobile_size ?? DEFAULT_BRANDING.logoMobileSize,

      logoCropPreset:
        s.logo_crop_preset || DEFAULT_BRANDING.logoCropPreset,

      logoObjectPosition:
        s.logo_object_position || DEFAULT_BRANDING.logoObjectPosition,

      logoFitMode:
        s.logo_fit_mode || DEFAULT_BRANDING.logoFitMode,

      logoPosX:
        s.logo_pos_x ?? DEFAULT_BRANDING.logoPosX,

      logoPosY:
        s.logo_pos_y ?? DEFAULT_BRANDING.logoPosY,

      logoZoom:
        s.logo_zoom ?? DEFAULT_BRANDING.logoZoom,

      logoNavbarDisplayMode:
        displayMode === "free" ? "free" : "contained",

      logoNavbarVisualSizeDesktop:
        tokenNumber(
          tokens,
          "logoNavbarVisualSizeDesktop",
          DEFAULT_BRANDING.logoNavbarVisualSizeDesktop,
          24,
          800
        ),

      logoNavbarVisualSizeMobile:
        tokenNumber(
          tokens,
          "logoNavbarVisualSizeMobile",
          DEFAULT_BRANDING.logoNavbarVisualSizeMobile,
          20,
          400
        ),

      logoNavbarOffsetX:
        tokenNumber(
          tokens,
          "logoNavbarOffsetX",
          DEFAULT_BRANDING.logoNavbarOffsetX,
          -300,
          300
        ),

      logoNavbarOffsetY:
        tokenNumber(
          tokens,
          "logoNavbarOffsetY",
          DEFAULT_BRANDING.logoNavbarOffsetY,
          -200,
          200
        ),

      logoNavbarZIndex:
        tokenNumber(
          tokens,
          "logoNavbarZIndex",
          DEFAULT_BRANDING.logoNavbarZIndex,
          1,
          100
        ),

      logoNavbarOverflow:
        overflow === "contained" ? "contained" : "visible",

      showLogo:
        s.show_logo !== false,

      showBrandName:
        s.show_brand_name !== false,

      loanExternalUrl:
        s.loan_external_url || DEFAULT_BRANDING.loanExternalUrl,

      welfareExternalUrl:
        s.welfare_external_url || DEFAULT_BRANDING.welfareExternalUrl,

      phone:
        s.phone || null,

      email:
        s.email || null,

      address:
        s.address || null,

      facebookUrl:
        s.facebook_url || null,

      lineUrl:
        s.line_url || null,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}