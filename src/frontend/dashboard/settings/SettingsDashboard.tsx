"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Palette,
  Phone,
  Save,
  Settings2,
  RotateCcw,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { DashboardPageHeader } from "@/components/ui/DataTable";
import { FormInput, FormTextarea } from "@/components/ui/Form";
import Button from "@/components/ui/Button";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import LogoCropEditor from "@/components/dashboard/LogoCropEditor";
import LogoPreviewPanel from "@/components/dashboard/LogoPreviewPanel";
import { LOGO_PRESETS, getLogoImgStyle, getPresetById } from "@/lib/logoPresets";
import { cropToJson, getDefaultImageCrop, type ImageCropSettings } from "@/lib/imageCrop";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/designTokens";

type SettingsForm = {
  site_name: string;
  faculty_name: string;
  university_name: string;
  logo_url: string;
  logo_alt: string;
  logo_desktop_size: number;
  logo_mobile_size: number;
  logo_crop_preset: string;
  logo_object_position: string;
  logo_fit_mode: string;
  logo_pos_x: number;
  logo_pos_y: number;
  logo_zoom: number;
  show_logo: boolean;
  show_brand_name: boolean;
  logo_navbar_display_mode: "contained" | "free";
  logo_navbar_visual_size_desktop: number;
  logo_navbar_visual_size_mobile: number;
  logo_navbar_offset_x: number;
  logo_navbar_offset_y: number;
  logo_navbar_overflow: "visible" | "contained";
  brand_name: string;
  brand_short_name: string;
  department_name_th: string;
  department_name_en: string;
  loan_external_url: string;
  welfare_external_url: string;
  apply_hero_image_url: string;
  apply_image_crop_settings: ImageCropSettings;
  apply_hero_template: string;
  apply_title: string;
  apply_eyebrow: string;
  apply_description: string;
  staff_intro_title: string;
  staff_intro_description: string;
  staff_position_order: string;
  phone: string;
  email: string;
  address: string;
  facebook_url: string;
  line_url: string;
};

type SiteSettingsResponse = {
  settings:
    | (SettingsForm & {
        id: string;
        theme: Record<string, unknown>;
        design_tokens?: Record<string, unknown> | null;
      })
    | null;
  error?: string;
};

const DEFAULT_SETTINGS: SettingsForm = {
  site_name: "สาขาวิชาเทคโนโลยีสารสนเทศ",
  faculty_name: "คณะวิทยาศาสตร์และเทคโนโลยี",
  university_name: "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี",
  logo_url: "",
  logo_alt: "โลโก้สาขา",
  logo_desktop_size: 518,
  logo_mobile_size: 390,
  logo_crop_preset: "square-contain",
  logo_object_position: "center",
  logo_fit_mode: "contain",
  logo_pos_x: 50,
  logo_pos_y: 50,
  logo_zoom: 1,
  show_logo: true,
  show_brand_name: false,
  logo_navbar_display_mode: "free",
  logo_navbar_visual_size_desktop: 200,
  logo_navbar_visual_size_mobile: 200,
  logo_navbar_offset_x: 0,
  logo_navbar_offset_y: 0,
  logo_navbar_overflow: "visible",
  brand_name: "สาขาวิชาเทคโนโลยีสารสนเทศ",
  brand_short_name: "CT",
  department_name_th: "สาขาวิชาเทคโนโลยีคอมพิวเตอร์",
  department_name_en: "Computer Technology",
  loan_external_url: "https://sd.rmutt.ac.th/?page_id=2274",
  welfare_external_url: "https://sd.rmutt.ac.th/",
  apply_hero_image_url: "",
  apply_image_crop_settings: getDefaultImageCrop({
    frameShape: "banner",
    aspectPreset: "16:9",
  }),
  apply_hero_template: "no-image-clean",
  apply_title: "สมัครเรียนกับเรา ก้าวเข้าสู่โลก IT",
  apply_eyebrow: "ปีการศึกษา 2568",
  apply_description:
    "ครบทุกขั้นตอน คุณสมบัติ เอกสาร และรอบรับสมัคร พร้อมคำตอบสำหรับคำถามที่พบบ่อย เพื่อให้คุณสมัครได้อย่างราบรื่น",
  staff_intro_title: "บุคลากรสาขา",
  staff_intro_description:
    "พบกับทีมอาจารย์และเจ้าหน้าที่ผู้เชี่ยวชาญที่จะร่วมเป็นเส้นทางการเรียนรู้และพัฒนาคุณ",
  staff_position_order:
    "ผู้บริหารสาขา\nหัวหน้าสาขาวิชา\nรองหัวหน้าสาขา\nผู้ช่วยศาสตราจารย์\nอาจารย์ประจำ\nเจ้าหน้าที่",
  phone: "0-2549-xxxx",
  email: "ct@rmutt.ac.th",
  address:
    "เลขที่ 39 หมู่ 1 ถนนรังสิต-นครนายก ตำบลคลองหก อำเภอธัญบุรี จังหวัดปทุมธานี 12110",
  facebook_url: "https://facebook.com/",
  line_url: "@rmutt-ct",
};

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
  fallback: string,
  min: number,
  max: number
) {
  const n = Number(tokens?.[key] ?? fallback);
  return Number.isFinite(n)
    ? Math.max(min, Math.min(max, Math.round(n)))
    : Number(fallback);
}

function normalizeSettings(s: SiteSettingsResponse["settings"]): SettingsForm {
  if (!s) return DEFAULT_SETTINGS;

  const tokens = s.design_tokens;
  const displayMode = tokenString(
    tokens,
    "logoNavbarDisplayMode",
    DEFAULT_DESIGN_TOKENS.logoNavbarDisplayMode
  );
  const overflow = tokenString(
    tokens,
    "logoNavbarOverflow",
    DEFAULT_DESIGN_TOKENS.logoNavbarOverflow
  );

  return {
    site_name: s.site_name ?? DEFAULT_SETTINGS.site_name,
    faculty_name: s.faculty_name ?? DEFAULT_SETTINGS.faculty_name,
    university_name: s.university_name ?? DEFAULT_SETTINGS.university_name,
    logo_url: s.logo_url ?? "",
    logo_alt: s.logo_alt ?? DEFAULT_SETTINGS.logo_alt,
    logo_desktop_size: s.logo_desktop_size ?? DEFAULT_SETTINGS.logo_desktop_size,
    logo_mobile_size: s.logo_mobile_size ?? DEFAULT_SETTINGS.logo_mobile_size,
    logo_crop_preset: s.logo_crop_preset ?? DEFAULT_SETTINGS.logo_crop_preset,
    logo_object_position:
      s.logo_object_position ?? DEFAULT_SETTINGS.logo_object_position,
    logo_fit_mode: s.logo_fit_mode ?? DEFAULT_SETTINGS.logo_fit_mode,
    logo_pos_x: s.logo_pos_x ?? DEFAULT_SETTINGS.logo_pos_x,
    logo_pos_y: s.logo_pos_y ?? DEFAULT_SETTINGS.logo_pos_y,
    logo_zoom: s.logo_zoom ?? DEFAULT_SETTINGS.logo_zoom,
    show_logo: s.show_logo ?? true,
    show_brand_name: s.show_brand_name ?? DEFAULT_SETTINGS.show_brand_name,
    logo_navbar_display_mode: displayMode === "free" ? "free" : "contained",
    logo_navbar_visual_size_desktop: tokenNumber(
      tokens,
      "logoNavbarVisualSizeDesktop",
      DEFAULT_DESIGN_TOKENS.logoNavbarVisualSizeDesktop,
      24,
      800
    ),
    logo_navbar_visual_size_mobile: tokenNumber(
      tokens,
      "logoNavbarVisualSizeMobile",
      DEFAULT_DESIGN_TOKENS.logoNavbarVisualSizeMobile,
      20,
      400
    ),
    logo_navbar_offset_x: tokenNumber(
      tokens,
      "logoNavbarOffsetX",
      DEFAULT_DESIGN_TOKENS.logoNavbarOffsetX,
      -300,
      300
    ),
    logo_navbar_offset_y: tokenNumber(
      tokens,
      "logoNavbarOffsetY",
      DEFAULT_DESIGN_TOKENS.logoNavbarOffsetY,
      -200,
      200
    ),
    logo_navbar_overflow: overflow === "contained" ? "contained" : "visible",
    brand_name: s.brand_name ?? DEFAULT_SETTINGS.brand_name,
    brand_short_name: s.brand_short_name ?? DEFAULT_SETTINGS.brand_short_name,
    department_name_th:
      s.department_name_th ?? DEFAULT_SETTINGS.department_name_th,
    department_name_en:
      s.department_name_en ?? DEFAULT_SETTINGS.department_name_en,
    loan_external_url: s.loan_external_url ?? DEFAULT_SETTINGS.loan_external_url,
    welfare_external_url:
      s.welfare_external_url ?? DEFAULT_SETTINGS.welfare_external_url,
    apply_hero_image_url: s.apply_hero_image_url ?? "",
    apply_image_crop_settings: cropToJson(s.apply_image_crop_settings),
    apply_hero_template: s.apply_hero_template ?? "no-image-clean",
    apply_title: s.apply_title ?? DEFAULT_SETTINGS.apply_title,
    apply_eyebrow: s.apply_eyebrow ?? DEFAULT_SETTINGS.apply_eyebrow,
    apply_description:
      s.apply_description ?? DEFAULT_SETTINGS.apply_description,
    staff_intro_title:
      s.staff_intro_title ?? DEFAULT_SETTINGS.staff_intro_title,
    staff_intro_description:
      s.staff_intro_description ?? DEFAULT_SETTINGS.staff_intro_description,
    staff_position_order:
      s.staff_position_order ?? DEFAULT_SETTINGS.staff_position_order,
    phone: s.phone ?? "",
    email: s.email ?? "",
    address: s.address ?? "",
    facebook_url: s.facebook_url ?? "",
    line_url: s.line_url ?? "",
  };
}

async function getAuthHeaders() {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function SettingsDashboard() {
  const [form, setForm] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [original, setOriginal] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [logoCleared, setLogoCleared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(original),
    [form, original]
  );

  const canSave = isDirty && !loading && !saving;

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/settings", { headers });
      const data = (await res.json()) as SiteSettingsResponse;

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถโหลดข้อมูลเว็บไซต์ได้");
      }

      const normalized = normalizeSettings(data.settings);
      setForm(normalized);
      setOriginal(normalized);
      setLogoCleared(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ไม่สามารถโหลดข้อมูลเว็บไซต์ได้"
      );
      setForm(DEFAULT_SETTINGS);
      setOriginal(DEFAULT_SETTINGS);
      setLogoCleared(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const setField = useCallback(
    <K extends keyof SettingsForm>(key: K) =>
      (value: SettingsForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setSuccess(null);
        setError(null);
      },
    []
  );

  const applyPreset = useCallback((presetId: string) => {
    const p = getPresetById(presetId);

    setForm((prev) => ({
      ...prev,
      logo_crop_preset: presetId,
      logo_fit_mode: p.defaultFitMode,
      logo_pos_x: p.defaultPosX,
      logo_pos_y: p.defaultPosY,
      logo_zoom: 1,
    }));

    setSuccess(null);
    setError(null);
  }, []);

  const handleSave = async () => {
    if (!canSave) return;

    if (!form.site_name.trim()) {
      setError("กรุณากรอกชื่อสาขา");
      return;
    }

    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const headers = await getAuthHeaders();

      const payload: Partial<SettingsForm> & { clear_logo?: boolean } = {
        ...form,
      };

      if (!form.logo_url && !logoCleared) {
        delete payload.logo_url;
      }
      if (logoCleared) {
        payload.clear_logo = true;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as SiteSettingsResponse;

      if (!res.ok) {
        throw new Error(data.error || "บันทึกข้อมูลเว็บไซต์ไม่สำเร็จ");
      }

      const normalized = normalizeSettings(data.settings);
      setForm(normalized);
      setOriginal(normalized);
      setLogoCleared(false);
      setSuccess("บันทึกข้อมูลเว็บไซต์เรียบร้อยแล้ว");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "บันทึกข้อมูลเว็บไซต์ไม่สำเร็จ"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetToBaseline = () => {
    setForm((prev) => ({
      ...DEFAULT_SETTINGS,
      logo_url: prev.logo_url || original.logo_url,
    }));
    setLogoCleared(false);
    setSuccess("รีเซ็ตค่าในฟอร์มเป็นค่าพื้นฐานแล้ว กดบันทึกเพื่อใช้งานจริง");
    setError(null);
  };

  const resetButton = (
    <Button onClick={handleResetToBaseline} variant="outline">
      <RotateCcw className="w-4 h-4" />
      รีเซ็ตค่าพื้นฐาน
    </Button>
  );

  const saveButton = (
    <Button
      onClick={handleSave}
      disabled={!canSave}
      title={!isDirty ? "ยังไม่มีการเปลี่ยนแปลง" : undefined}
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {saving ? "กำลังบันทึก..." : "บันทึก"}
    </Button>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <DashboardPageHeader
          title="ตั้งค่าเว็บไซต์"
          description="กำลังโหลดข้อมูลจาก Supabase..."
        />

        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 rounded-3xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const desktopSizeWarning =
    form.logo_desktop_size > 180
      ? "ถ้าใช้ Free mode โลโก้จะลอยได้โดยไม่เพิ่มความสูง Navbar"
      : form.logo_desktop_size < 28
        ? "เล็กมาก อาจมองไม่ชัด"
        : "";

  const mobileSizeWarning =
    form.logo_mobile_size > 140
      ? "ถ้าใช้ Free mode โลโก้จะลอยได้โดยไม่เพิ่มความสูง Navbar"
      : form.logo_mobile_size < 24
        ? "เล็กมาก"
        : "";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <DashboardPageHeader
        title="ตั้งค่าเว็บไซต์"
        description="ข้อมูลพื้นฐาน, Branding, โลโก้ และช่องทางติดต่อ"
        action={
          <div className="flex flex-wrap gap-2">
            {resetButton}
            {saveButton}
          </div>
        }
      />

      {success && <StatusBox type="success" message={success} />}
      {error && <StatusBox type="error" message={error} />}

      {/* Branding */}
      <Section icon={<Settings2 className="w-5 h-5" />} title="ข้อมูล Branding">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormInput
            label="ชื่อสาขา (ภาษาไทย)"
            required
            value={form.department_name_th}
            onChange={(e) => setField("department_name_th")(e.target.value)}
          />

          <FormInput
            label="ชื่อสาขา (ภาษาอังกฤษ)"
            value={form.department_name_en}
            onChange={(e) => setField("department_name_en")(e.target.value)}
          />

          <FormInput
            label="ชื่อย่อ (แสดงใน Navbar)"
            placeholder="เช่น CT"
            value={form.brand_short_name}
            onChange={(e) => setField("brand_short_name")(e.target.value)}
          />

          <FormInput
            label="ชื่อ Brand หลัก"
            placeholder="เช่น Computer Technology"
            value={form.brand_name}
            onChange={(e) => setField("brand_name")(e.target.value)}
          />

          <FormInput
            label="ชื่อคณะ"
            value={form.faculty_name}
            onChange={(e) => setField("faculty_name")(e.target.value)}
          />

          <FormInput
            label="ชื่อมหาวิทยาลัย"
            value={form.university_name}
            onChange={(e) => setField("university_name")(e.target.value)}
          />

          <FormInput
            label="ชื่อสาขา (เก็บใน site_name)"
            required
            value={form.site_name}
            onChange={(e) => setField("site_name")(e.target.value)}
          />

          <FormInput
            label="URL กยศ. (เปิดเว็บภายนอก)"
            placeholder="https://sd.rmutt.ac.th/..."
            value={form.loan_external_url}
            onChange={(e) => setField("loan_external_url")(e.target.value)}
          />

          <FormInput
            label="URL สวัสดิการนักศึกษา (เปิดเว็บภายนอก)"
            placeholder="https://sd.rmutt.ac.th/"
            value={form.welfare_external_url}
            onChange={(e) => setField("welfare_external_url")(e.target.value)}
          />
        </div>

        <div className="flex gap-6 mt-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.show_logo}
              onChange={(e) => setField("show_logo")(e.target.checked)}
              className="rounded"
            />
            แสดงโลโก้ใน Navbar/Footer
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.show_brand_name}
              onChange={(e) => setField("show_brand_name")(e.target.checked)}
              className="rounded"
            />
            แสดงชื่อ Brand ข้างโลโก้
          </label>
        </div>
      </Section>

      {/* Logo Upload + Crop Editor */}
      <Section icon={<ImageIcon className="w-5 h-5" />} title="โลโก้เว็บไซต์">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          <p className="font-medium text-slate-800">โครงสร้างค่าที่ใช้จริง</p>
          <p>
            รูปต้นฉบับคือไฟล์โลโก้, Crop คือการตัด/ขยับ/ซูมรูป, Frame size
            คือกรอบ crop, Visual size คือขนาดที่เห็นจริงใน Navbar, ส่วน Navbar
            height คุมแถบเมนูแยกจากโลโก้
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <LogoSubsection
              title="A) รูปโลโก้"
              description="อัปโหลดรูปต้นฉบับและกำหนดข้อความ alt สำหรับผู้ใช้ screen reader"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <CloudinaryImageUploader
                  value={form.logo_url}
                  onChange={(url) => {
                    setField("logo_url")(url);
                    setLogoCleared(false);
                  }}
                  folder="logos"
                  label="อัปโหลดโลโก้สาขา"
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-medium text-slate-600">
                    Current logo
                  </p>

                  <div className="grid min-h-[160px] place-items-center rounded-xl bg-slate-50">
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt=""
                        className="max-h-32 max-w-[160px] object-contain"
                      />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-2xl bg-brand-gradient text-lg font-bold text-white">
                        {form.brand_short_name.slice(0, 2)}
                      </div>
                    )}
                  </div>

                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setField("logo_url")("");
                        setLogoCleared(true);
                      }}
                      className="mt-3 text-xs font-medium text-rose-600 hover:text-rose-700"
                    >
                      ล้างรูปโลโก้
                    </button>
                  )}
                </div>
              </div>

              <FormInput
                label="Alt Text โลโก้"
                value={form.logo_alt}
                onChange={(e) => setField("logo_alt")(e.target.value)}
              />
            </LogoSubsection>

            <LogoSubsection
              title="B) Template เริ่มต้น"
              description="Preset เป็นค่าเริ่มต้นของกรอบและโฟกัส ไม่ได้ล็อกค่า หลังเลือกแล้วยังปรับเองต่อได้"
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {LOGO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left text-xs transition-all ${
                      form.logo_crop_preset === preset.id
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt=""
                        style={getLogoImgStyle(preset.id, 32)}
                        className="shrink-0"
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: preset.borderRadius,
                        }}
                        className="grid shrink-0 place-items-center bg-brand-gradient"
                      >
                        <span className="text-[9px] font-bold text-white">
                          CT
                        </span>
                      </div>
                    )}

                    <span className="leading-snug">{preset.labelTh}</span>
                  </button>
                ))}
              </div>
            </LogoSubsection>

            <LogoSubsection
              title="C) Crop รูป"
              description="คุม contain/cover, ตำแหน่งโฟกัส และ zoom ของรูปในกรอบ crop"
            >
              <LogoCropEditor
                logoUrl={form.logo_url || undefined}
                brandShortName={form.brand_short_name}
                preset={form.logo_crop_preset}
                values={{
                  fitMode: form.logo_fit_mode,
                  posX: form.logo_pos_x,
                  posY: form.logo_pos_y,
                  zoom: form.logo_zoom,
                }}
                onChange={(v) => {
                  setForm((prev) => ({
                    ...prev,
                    ...(v.fitMode !== undefined
                      ? { logo_fit_mode: v.fitMode }
                      : {}),
                    ...(v.posX !== undefined ? { logo_pos_x: v.posX } : {}),
                    ...(v.posY !== undefined ? { logo_pos_y: v.posY } : {}),
                    ...(v.zoom !== undefined ? { logo_zoom: v.zoom } : {}),
                  }));
                  setSuccess(null);
                  setError(null);
                }}
                onResetToPreset={() => applyPreset(form.logo_crop_preset)}
              />
            </LogoSubsection>

            <LogoSubsection
              title="D) ขนาดกรอบรูป"
              description="Frame size คือขนาดกรอบ crop ของโลโก้ ไม่ใช่ความสูงของ Navbar"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <NumberControl
                  label="Desktop frame size"
                  value={form.logo_desktop_size}
                  min={24}
                  max={800}
                  suffix="px"
                  hint={desktopSizeWarning}
                  onChange={(value) => setField("logo_desktop_size")(value)}
                />

                <NumberControl
                  label="Mobile frame size"
                  value={form.logo_mobile_size}
                  min={20}
                  max={400}
                  suffix="px"
                  hint={mobileSizeWarning}
                  onChange={(value) => setField("logo_mobile_size")(value)}
                />
              </div>
            </LogoSubsection>

            <LogoSubsection
              title="E) การแสดงผลใน Navbar"
              description="Contained อยู่ในกรอบ Navbar แบบปลอดภัย ส่วน Free ให้โลโก้ลอยใหญ่ได้โดยไม่ดันความสูงแถบเมนู"
            >
              <div className="space-y-4">
                <SegmentedButtons
                  label="Navbar logo mode"
                  value={form.logo_navbar_display_mode}
                  onChange={(value) =>
                    setField("logo_navbar_display_mode")(
                      value as "contained" | "free"
                    )
                  }
                  options={[
                    { value: "contained", label: "Contained / Safe" },
                    { value: "free", label: "Free / Overflow" },
                  ]}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <NumberControl
                    label="Desktop visual size"
                    value={form.logo_navbar_visual_size_desktop}
                    min={24}
                    max={800}
                    suffix="px"
                    hint={
                      form.logo_navbar_visual_size_desktop > 180
                        ? "ใหญ่กว่า 180px อาจทับ Hero หรือเมนู"
                        : ""
                    }
                    onChange={(value) =>
                      setField("logo_navbar_visual_size_desktop")(value)
                    }
                  />

                  <NumberControl
                    label="Mobile visual size"
                    value={form.logo_navbar_visual_size_mobile}
                    min={20}
                    max={400}
                    suffix="px"
                    hint={
                      form.logo_navbar_visual_size_mobile > 140
                        ? "ใหญ่กว่า 140px อาจบังพื้นที่เมนูมือถือ"
                        : ""
                    }
                    onChange={(value) =>
                      setField("logo_navbar_visual_size_mobile")(value)
                    }
                  />

                  <NumberControl
                    label="Offset X"
                    value={form.logo_navbar_offset_x}
                    min={-300}
                    max={300}
                    suffix="px"
                    onChange={(value) => setField("logo_navbar_offset_x")(value)}
                  />

                  <NumberControl
                    label="Offset Y"
                    value={form.logo_navbar_offset_y}
                    min={-200}
                    max={200}
                    suffix="px"
                    onChange={(value) => setField("logo_navbar_offset_y")(value)}
                  />
                </div>

                <SegmentedButtons
                  label="Free mode overflow"
                  value={form.logo_navbar_overflow}
                  onChange={(value) =>
                    setField("logo_navbar_overflow")(
                      value as "visible" | "contained"
                    )
                  }
                  options={[
                    { value: "visible", label: "Visible" },
                    { value: "contained", label: "Contained" },
                  ]}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  <span>
                    Free mode ใช้ขนาด visual และ offset จริง แต่ Navbar height
                    จะไม่สูงตามโลโก้
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        logo_navbar_display_mode: DEFAULT_SETTINGS.logo_navbar_display_mode,
                        logo_navbar_visual_size_desktop: DEFAULT_SETTINGS.logo_navbar_visual_size_desktop,
                        logo_navbar_visual_size_mobile: DEFAULT_SETTINGS.logo_navbar_visual_size_mobile,
                        logo_navbar_offset_x: DEFAULT_SETTINGS.logo_navbar_offset_x,
                        logo_navbar_offset_y: DEFAULT_SETTINGS.logo_navbar_offset_y,
                        logo_navbar_overflow: DEFAULT_SETTINGS.logo_navbar_overflow,
                      }));
                      setSuccess(null);
                      setError(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 font-medium text-amber-800 hover:bg-amber-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset navbar logo
                  </button>
                </div>
              </div>
            </LogoSubsection>
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            <LogoPreviewPanel
              logoUrl={form.logo_url || undefined}
              logoAlt={form.logo_alt}
              desktopSize={form.logo_desktop_size}
              mobileSize={form.logo_mobile_size}
              preset={form.logo_crop_preset}
              fitMode={form.logo_fit_mode}
              posX={form.logo_pos_x}
              posY={form.logo_pos_y}
              zoom={form.logo_zoom}
              showLogo={form.show_logo}
              showBrandName={form.show_brand_name}
              brandShortName={form.brand_short_name}
              brandName={form.brand_name}
              navbarDisplayMode={form.logo_navbar_display_mode}
              navbarVisualSizeDesktop={form.logo_navbar_visual_size_desktop}
              navbarVisualSizeMobile={form.logo_navbar_visual_size_mobile}
              navbarOffsetX={form.logo_navbar_offset_x}
              navbarOffsetY={form.logo_navbar_offset_y}
              navbarOverflow={form.logo_navbar_overflow}
            />
          </div>
        </div>
      </Section>

      {/* Contact */}
      <Section icon={<Phone className="w-5 h-5" />} title="ช่องทางติดต่อ">
        <div className="space-y-4">
          <FormTextarea
            label="ที่อยู่"
            rows={3}
            value={form.address}
            onChange={(e) => setField("address")(e.target.value)}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <FormInput
              label="เบอร์โทร"
              value={form.phone}
              onChange={(e) => setField("phone")(e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Theme link */}
      <Section icon={<Palette className="w-5 h-5" />} title="ธีมสีเว็บไซต์">
        <p className="text-sm text-slate-600 mb-4">
          จัดการสีธีมแยกที่หน้าปรับธีม
        </p>

        <Link
          href="/dashboard/theme"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-medium text-white bg-brand-gradient shadow-brand hover:opacity-95 transition"
        >
          <Palette className="w-4 h-4" />
          ไปที่หน้าปรับธีม
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Section>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button onClick={handleResetToBaseline} variant="outline" size="lg">
          <RotateCcw className="w-4 h-4" />
          รีเซ็ตค่าพื้นฐาน
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          size="lg"
          title={!isDirty ? "ยังไม่มีการเปลี่ยนแปลง" : undefined}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}
        </Button>
      </div>
    </div>
  );
}

function StatusBox({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const ok = type === "success";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      <span>{message}</span>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-gradient grid place-items-center text-white">
          {icon}
        </div>

        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>

      {children}
    </div>
  );
}

function LogoSubsection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function NumberControl({
  label,
  value,
  min,
  max,
  suffix,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  hint?: string;
  onChange: (value: number) => void;
}) {
  const safeValue = Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : min;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700">{label}</label>

        <span className="font-mono text-[10px] text-slate-400">
          {safeValue}
          {suffix}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={safeValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 flex-1 rounded-full bg-slate-200 accent-brand-500"
        />

        <input
          type="number"
          min={min}
          max={max}
          value={safeValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 w-20 rounded-xl border border-slate-200 px-2 text-center text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {hint && (
        <p className="mt-1 text-[10px] leading-relaxed text-amber-600">
          {hint}
        </p>
      )}
    </div>
  );
}

function SegmentedButtons({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-slate-700">{label}</div>

      <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-slate-50 sm:inline-grid sm:auto-cols-fr sm:grid-flow-col">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-10 px-4 text-xs font-medium transition-colors ${
              value === option.value
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
