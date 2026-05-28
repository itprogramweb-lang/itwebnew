"use client";
import { useState, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Palette,
  Type,
  LayoutTemplate,
} from "lucide-react";
import { themeApi } from "@/frontend/api/theme";
import {
  SiteTheme,
  DEFAULT_THEME,
  mergeTheme,
  getContrastText,
  isDarkColor,
} from "@/lib/theme";
import {
  DesignTokens,
  DEFAULT_DESIGN_TOKENS,
  mergeDesignTokens,
  FONT_STACKS,
  CARD_RADIUS_MAP,
  BUTTON_RADIUS_MAP,
  SECTION_SPACING_MAP,
  CONTENT_WIDTH_MAP,
  NAVBAR_MODE_PRESETS,
  resolveNavbarTokens,
} from "@/lib/designTokens";
import { DashboardPageHeader } from "@/components/ui/DataTable";

// ─── ColorField ───────────────────────────────────────────────────────────────

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const handleText = (raw: string) => {
    if (/^#[0-9a-fA-F]{0,6}$/.test(raw)) onChange(raw);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        <span className="text-[10px] text-slate-400 font-mono uppercase">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 cursor-pointer"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => handleText(e.target.value)}
          maxLength={7}
          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 h-10 text-sm font-mono focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
        />
      </div>
    </div>
  );
}

// ─── SegmentedControl ─────────────────────────────────────────────────────────

function SegmentedControl({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-700 mb-1.5">{label}</div>
      <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 h-9 text-xs font-medium transition-colors truncate ${
              value === opt.value
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── SelectField ─────────────────────────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-700 mb-1.5">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-700 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── NumberField ─────────────────────────────────────────────────────────────

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const n = Number(value);
  const current = Number.isFinite(n) ? n : min;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        <span className="font-mono text-[10px] text-slate-400">{current}px</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="h-2 flex-1 rounded-full bg-slate-200 accent-brand-500"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={current}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-16 rounded-xl border border-slate-200 px-2 text-center text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── ThemePreview ─────────────────────────────────────────────────────────────

function ThemePreview({ theme }: { theme: SiteTheme }) {
  const navText = getContrastText(theme.navbarColor);
  const btnText = getContrastText(theme.buttonColor);
  const bgText = getContrastText(theme.backgroundColor);
  const footerText = getContrastText(theme.footerColor);
  const heroText = getContrastText(theme.heroOverlayColor);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm text-[11px] select-none">
      {/* Navbar */}
      <div
        style={{ backgroundColor: theme.navbarColor, color: navText }}
        className="px-4 py-2.5 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg grid place-items-center"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <span style={{ color: getContrastText(theme.primaryColor) }} className="font-bold text-[9px]">
              IT
            </span>
          </div>
          <span className="font-semibold">CT</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 opacity-80 text-[10px]">
          <span>หน้าแรก</span>
          <span>เกี่ยวกับ</span>
          <span>ผลงาน</span>
        </div>
        <div
          className="h-6 px-3 rounded-md text-[10px] font-medium grid place-items-center"
          style={{ backgroundColor: theme.buttonColor, color: btnText }}
        >
          สมัครเรียน
        </div>
      </div>

      {/* Hero */}
      <div
        className="relative px-4 py-6 flex flex-col items-center text-center gap-2.5"
        style={{ backgroundColor: theme.heroOverlayColor, color: heroText }}
      >
        <div className="text-xs font-bold tracking-wide" style={{ color: theme.primaryColor }}>
          WELCOME
        </div>
        <div className="font-bold text-sm" style={{ color: heroText }}>
          สาขาเทคโนโลยีสารสนเทศ
        </div>
        <div className="text-[10px] opacity-70 max-w-[180px]">มุ่งสร้างนักพัฒนาซอฟต์แวร์คุณภาพสูง</div>
        <div className="flex gap-2 mt-1">
          <div
            className="h-6 px-3 rounded-md text-[10px] font-medium grid place-items-center"
            style={{ backgroundColor: theme.buttonColor, color: btnText }}
          >
            สมัครเรียน
          </div>
          <div
            className="h-6 px-3 rounded-md text-[10px] font-medium grid place-items-center border"
            style={{ borderColor: theme.primaryColor, color: theme.primaryColor, backgroundColor: "transparent" }}
          >
            ดูหลักสูตร
          </div>
        </div>
      </div>

      {/* Content section */}
      <div
        className="px-4 py-4"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
      >
        <div className="text-xs font-bold mb-2" style={{ color: theme.primaryColor }}>
          ผลงานนักศึกษา
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["โปรเจกต์ AI", "เว็บแอป"].map((t) => (
            <div
              key={t}
              className="rounded-lg p-2.5 border"
              style={{
                backgroundColor: isDarkColor(theme.backgroundColor)
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)",
                borderColor: isDarkColor(theme.backgroundColor)
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.08)",
              }}
            >
              <div className="font-medium text-[10px]" style={{ color: bgText }}>
                {t}
              </div>
              <div className="text-[9px] mt-0.5 opacity-60" style={{ color: bgText }}>
                นักศึกษาชั้นปีที่ 4
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-2.5 h-6 w-full rounded-md text-[10px] font-medium grid place-items-center"
          style={{ backgroundColor: theme.accentColor, color: getContrastText(theme.accentColor) }}
        >
          ดูผลงานทั้งหมด (Accent)
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: theme.footerColor, color: footerText }}
      >
        <span className="font-semibold text-[10px]">CT © 2567</span>
        <div className="flex gap-3 text-[10px] opacity-70">
          <span>Facebook</span>
          <span>ติดต่อ</span>
        </div>
      </div>
    </div>
  );
}

// ─── DesignPreview ────────────────────────────────────────────────────────────

function DesignPreview({ tokens }: { tokens: DesignTokens }) {
  const fontStack = FONT_STACKS[tokens.fontFamily] ?? FONT_STACKS["IBM Plex Sans Thai"];
  const headingStack =
    tokens.headingFontFamily === "same"
      ? fontStack
      : (FONT_STACKS[tokens.headingFontFamily] ?? fontStack);
  const baseFontSize = tokens.baseFontSize;
  const headingWeight = parseInt(tokens.headingWeight, 10);
  const bodyWeight = parseInt(tokens.bodyWeight, 10);
  const cardRadius = CARD_RADIUS_MAP[tokens.cardRadius] ?? CARD_RADIUS_MAP.xlarge;
  const buttonRadius = BUTTON_RADIUS_MAP[tokens.buttonRadius] ?? BUTTON_RADIUS_MAP.large;
  const spacingY = SECTION_SPACING_MAP[tokens.sectionSpacing] ?? SECTION_SPACING_MAP.normal;
  const contentWidth = CONTENT_WIDTH_MAP[tokens.contentWidth] ?? CONTENT_WIDTH_MAP.normal;

  return (
    <div
      style={{ fontFamily: fontStack, fontSize: baseFontSize, fontWeight: bodyWeight }}
      className="rounded-2xl border border-slate-200 overflow-hidden bg-white text-slate-900 text-[11px]"
    >
      {/* Typography */}
      <div className="p-4 border-b border-slate-100">
        <div
          style={{ fontFamily: headingStack, fontWeight: headingWeight, fontSize: "1.15em" }}
          className="text-slate-900"
        >
          หัวข้อ: สาขาเทคโนโลยีสารสนเทศ
        </div>
        <div
          style={{ fontFamily: headingStack, fontWeight: headingWeight, fontSize: "1em" }}
          className="text-slate-700 mt-1"
        >
          Heading: Information Technology
        </div>
        <p className="mt-1.5 text-slate-500 text-[0.9em] leading-relaxed">
          ข้อความเนื้อหา: มุ่งสร้างบัณฑิตที่มีทักษะด้านเทคโนโลยีสารสนเทศ
          พร้อมก้าวสู่โลกดิจิทัลอย่างมั่นใจ
        </p>
      </div>

      {/* Buttons */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2 items-center">
        <span className="text-[9px] text-slate-400 w-full">Buttons</span>
        <button
          style={{ borderRadius: buttonRadius, fontSize: "0.9em", fontWeight: 500 }}
          className="bg-orange-500 text-white px-3 py-1.5"
        >
          สมัครเรียน
        </button>
        <button
          style={{ borderRadius: buttonRadius, fontSize: "0.9em", fontWeight: 500 }}
          className="border border-slate-300 text-slate-700 px-3 py-1.5"
        >
          ดูหลักสูตร
        </button>
      </div>

      {/* Card */}
      <div className="px-4 py-3 border-b border-slate-100">
        <span className="text-[9px] text-slate-400 block mb-2">Card ({tokens.cardRadius})</span>
        <div
          style={{ borderRadius: cardRadius }}
          className="border border-slate-200 bg-slate-50 p-3"
        >
          <div style={{ fontFamily: headingStack, fontWeight: headingWeight, fontSize: "0.95em" }}>
            ผลงานนักศึกษา ปี 2567
          </div>
          <div className="text-slate-500 text-[0.85em] mt-0.5">ทีม AI Innovation — ชนะเลิศระดับชาติ</div>
        </div>
      </div>

      {/* Spacing + Width tokens */}
      <div className="px-4 py-3 bg-slate-50 text-[9px] text-slate-500 space-y-1">
        <div>
          Section spacing:{" "}
          <span className="font-mono text-slate-700">{spacingY}</span>
        </div>
        <div>
          Content width:{" "}
          <span className="font-mono text-slate-700">{contentWidth}</span>
        </div>
        <div>
          Font size:{" "}
          <span className="font-mono text-slate-700">{baseFontSize}</span>
          {" · "}Body weight:{" "}
          <span className="font-mono text-slate-700">{tokens.bodyWeight}</span>
          {" · "}Heading weight:{" "}
          <span className="font-mono text-slate-700">{tokens.headingWeight}</span>
        </div>
      </div>
    </div>
  );
}

function NavbarLayoutPreview({ tokens }: { tokens: DesignTokens }) {
  const navbar = resolveNavbarTokens(tokens);
  const isFree = navbar.logoDisplayMode === "free";
  const warnings = [
    navbar.desktopHeight > 130,
    navbar.mobileHeight > 110,
    navbar.desktopPaddingY > 28 || navbar.mobilePaddingY > 28,
    isFree && navbar.logoVisualSizeDesktop > 180,
    isFree && navbar.logoVisualSizeMobile > 140,
  ].some(Boolean);
  const logoDesktopSize = isFree ? navbar.logoVisualSizeDesktop : navbar.maxLogoHeight;
  const logoMobileSize = isFree ? navbar.logoVisualSizeMobile : navbar.maxLogoHeight;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[11px]">
        <div className="mb-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>Desktop Navbar</span>
          <span className="font-mono">{navbar.desktopHeight}px</span>
        </div>
        <div
          className="relative flex items-center gap-2 overflow-visible rounded-xl bg-slate-900 px-4 text-white"
          style={{
            minHeight: navbar.desktopHeight,
            paddingTop: navbar.desktopPaddingY,
            paddingBottom: navbar.desktopPaddingY,
          }}
        >
          <div
            className="shrink-0"
            style={{ width: navbar.maxLogoHeight, height: navbar.maxLogoHeight }}
          />
          <div
            className={isFree ? "absolute grid place-items-center rounded-xl bg-brand-gradient text-[10px] font-bold" : "absolute grid place-items-center rounded-xl bg-brand-gradient text-[10px] font-bold"}
            style={{
              left: 16,
              top: "50%",
              width: logoDesktopSize,
              height: logoDesktopSize,
              zIndex: navbar.logoZIndex,
              transform: `translate(${isFree ? navbar.logoOffsetX : 0}px, calc(-50% + ${isFree ? navbar.logoOffsetY : 0}px))`,
              overflow: navbar.logoOverflow === "contained" ? "hidden" : "visible",
            }}
          >
            CT
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold">CT</div>
            <div className="truncate text-[10px] text-slate-400">Computer Technology</div>
          </div>
          <div className="ml-auto hidden items-center gap-3 text-[10px] text-slate-300 sm:flex">
            <span>หน้าแรก</span>
            <span>ข่าวสาร</span>
            <span>หลักสูตร</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-[11px]">
        <div className="mb-2 flex items-center justify-between text-[10px] text-slate-400">
          <span>Mobile Navbar</span>
          <span className="font-mono">{navbar.mobileHeight}px</span>
        </div>
        <div
          className="relative flex max-w-[280px] items-center justify-between overflow-visible rounded-xl bg-slate-900 px-3 text-white"
          style={{
            minHeight: navbar.mobileHeight,
            paddingTop: navbar.mobilePaddingY,
            paddingBottom: navbar.mobilePaddingY,
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="shrink-0"
              style={{ width: navbar.maxLogoHeight, height: navbar.maxLogoHeight }}
            />
            <div
              className="absolute grid shrink-0 place-items-center rounded-xl bg-brand-gradient text-[9px] font-bold"
              style={{
                left: 12,
                top: "50%",
                width: logoMobileSize,
                height: logoMobileSize,
                zIndex: navbar.logoZIndex,
                transform: `translate(${isFree ? navbar.logoOffsetX : 0}px, calc(-50% + ${isFree ? navbar.logoOffsetY : 0}px))`,
                overflow: navbar.logoOverflow === "contained" ? "hidden" : "visible",
              }}
            >
              CT
            </div>
            <span className="truncate text-xs font-semibold">CT</span>
          </div>
          <div className="flex flex-col gap-0.5 opacity-60">
            {[1, 2, 3].map((i) => (
              <span key={i} className="h-0.5 w-4 rounded bg-slate-300" />
            ))}
          </div>
        </div>
      </div>

      {warnings && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {isFree
            ? "Free mode อาจทำให้โลโก้ลอยทับ Hero หรือข้อความ ถ้าตั้งขนาด/ตำแหน่งสูงมาก"
            : "Navbar อาจสูงเกินและดัน Hero ลง"}
        </div>
      )}
    </div>
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const COLOR_FIELDS: [keyof SiteTheme, string][] = [
  ["primaryColor", "Primary Color (สีหลัก/ส้ม)"],
  ["accentColor", "Accent Color (สีเสริม/amber)"],
  ["buttonColor", "Button Color (สีปุ่ม)"],
  ["backgroundColor", "Background (พื้นหลัง section)"],
  ["textColor", "Text Color (ตัวอักษรหลัก)"],
  ["secondaryColor", "Secondary Color"],
  ["navbarColor", "Navbar Color (แถบนำทาง)"],
  ["footerColor", "Footer Color (แถบล่าง)"],
  ["heroOverlayColor", "Hero Overlay (พื้นหลัง hero)"],
];

const FONT_OPTIONS = [
  { value: "IBM Plex Sans Thai", label: "IBM Plex Sans Thai" },
  { value: "Noto Sans Thai", label: "Noto Sans Thai" },
  { value: "Sarabun", label: "Sarabun" },
  { value: "Prompt", label: "Prompt" },
  { value: "system-ui", label: "System UI (default)" },
];

const HEADING_FONT_OPTIONS = [
  { value: "same", label: "เหมือน Body" },
  ...FONT_OPTIONS,
];

const FONT_SIZE_OPTIONS = [
  { value: "14px", label: "14" },
  { value: "15px", label: "15" },
  { value: "16px", label: "16" },
  { value: "17px", label: "17" },
  { value: "18px", label: "18" },
];

const HEADING_WEIGHT_OPTIONS = [
  { value: "500", label: "500" },
  { value: "600", label: "600" },
  { value: "700", label: "700 (Bold)" },
];

const BODY_WEIGHT_OPTIONS = [
  { value: "300", label: "300" },
  { value: "400", label: "400" },
  { value: "500", label: "500" },
];

const NAV_SIZE_OPTIONS = [
  { value: "13px", label: "13" },
  { value: "14px", label: "14" },
  { value: "15px", label: "15" },
];

const NAV_WEIGHT_OPTIONS = [
  { value: "400", label: "400" },
  { value: "500", label: "500" },
  { value: "600", label: "600" },
];

const SECTION_HEADING_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
];

const SPACING_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "spacious", label: "Spacious" },
];

const CARD_RADIUS_OPTIONS = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
  { value: "xlarge", label: "XL" },
];

const CARD_SHADOW_OPTIONS = [
  { value: "none", label: "None" },
  { value: "soft", label: "Soft" },
  { value: "medium", label: "Medium" },
];

const BUTTON_RADIUS_OPTIONS = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
  { value: "pill", label: "Pill" },
];

const CONTENT_WIDTH_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
  { value: "full", label: "Full" },
];

const HERO_TEXT_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const HERO_CONTENT_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const NAVBAR_MODE_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "normal", label: "Normal" },
  { value: "spacious", label: "Spacious" },
  { value: "custom", label: "Custom" },
];

const NAVBAR_ALIGN_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
];

const LOGO_NAVBAR_MODE_OPTIONS = [
  { value: "contained", label: "Contained / Safe" },
  { value: "free", label: "Free / Overflow" },
];

const LOGO_NAVBAR_OVERFLOW_OPTIONS = [
  { value: "visible", label: "Visible" },
  { value: "contained", label: "Contained" },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ThemeDashboard() {
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_DESIGN_TOKENS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"colors" | "design">("colors");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadTheme = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await themeApi.load();
      if (settings) {
        const t = settings.theme as Record<string, unknown>;
        if (t && Object.keys(t).length > 0) {
          setTheme(mergeTheme(t as Partial<SiteTheme>));
        }
        const dt = settings.design_tokens as Record<string, unknown>;
        if (dt && Object.keys(dt).length > 0) {
          setTokens(mergeDesignTokens(dt as Partial<DesignTokens>));
        }
      }
    } catch {
      // silent — use defaults
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await themeApi.save({ theme, design_tokens: tokens });
      showToast("บันทึกธีมและ Design Tokens เรียบร้อยแล้ว — refresh เพื่อดูผล");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast("บันทึกไม่สำเร็จ: " + msg, false);
    }
    setSaving(false);
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    setTokens(DEFAULT_DESIGN_TOKENS);
  };

  const setColor = (k: keyof SiteTheme) => (v: string) =>
    setTheme((p) => ({ ...p, [k]: v }));

  const setToken = (k: keyof DesignTokens) => (v: string) =>
    setTokens((p) => ({ ...p, [k]: v }));

  const setNavbarMode = (mode: string) => {
    setTokens((p) => {
      const preset = NAVBAR_MODE_PRESETS[mode];
      return {
        ...p,
        navbarHeightMode: mode,
        ...(preset
          ? {
              navbarDesktopHeight: String(preset.desktopHeight),
              navbarMobileHeight: String(preset.mobileHeight),
              navbarDesktopPaddingY: String(preset.desktopPaddingY),
              navbarMobilePaddingY: String(preset.mobilePaddingY),
              navbarMaxLogoHeight: String(preset.maxLogoHeight),
            }
          : {}),
      };
    });
  };

  const resetNavbarTokens = () => {
    setTokens((p) => ({
      ...p,
      navbarHeightMode: DEFAULT_DESIGN_TOKENS.navbarHeightMode,
      navbarDesktopHeight: DEFAULT_DESIGN_TOKENS.navbarDesktopHeight,
      navbarMobileHeight: DEFAULT_DESIGN_TOKENS.navbarMobileHeight,
      navbarDesktopPaddingY: DEFAULT_DESIGN_TOKENS.navbarDesktopPaddingY,
      navbarMobilePaddingY: DEFAULT_DESIGN_TOKENS.navbarMobilePaddingY,
      navbarMaxLogoHeight: DEFAULT_DESIGN_TOKENS.navbarMaxLogoHeight,
      navbarContentWidth: DEFAULT_DESIGN_TOKENS.navbarContentWidth,
      navbarVerticalAlign: DEFAULT_DESIGN_TOKENS.navbarVerticalAlign,
      logoNavbarDisplayMode: DEFAULT_DESIGN_TOKENS.logoNavbarDisplayMode,
      logoNavbarVisualSizeDesktop: DEFAULT_DESIGN_TOKENS.logoNavbarVisualSizeDesktop,
      logoNavbarVisualSizeMobile: DEFAULT_DESIGN_TOKENS.logoNavbarVisualSizeMobile,
      logoNavbarOffsetX: DEFAULT_DESIGN_TOKENS.logoNavbarOffsetX,
      logoNavbarOffsetY: DEFAULT_DESIGN_TOKENS.logoNavbarOffsetY,
      logoNavbarZIndex: DEFAULT_DESIGN_TOKENS.logoNavbarZIndex,
      logoNavbarOverflow: DEFAULT_DESIGN_TOKENS.logoNavbarOverflow,
    }));
  };

  const setNavbarNumber = (k: keyof DesignTokens) => (v: string) => {
    setTokens((p) => ({ ...p, navbarHeightMode: "custom", [k]: v }));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <DashboardPageHeader title="ปรับธีมเว็บไซต์" description="กำลังโหลด..." />
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <DashboardPageHeader
        title="ปรับธีมเว็บไซต์"
        description="ตั้งค่าสีและ Design Tokens ของเว็บไซต์"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="h-10 px-4 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              รีเซ็ต
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-5 rounded-xl text-sm font-medium text-white bg-brand-gradient shadow-brand hover:opacity-95 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        }
      />

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
        {(
          [
            { key: "colors", label: "สีเว็บไซต์", icon: <Palette className="w-3.5 h-3.5" /> },
            { key: "design", label: "Design Tokens", icon: <Type className="w-3.5 h-3.5" /> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── COLORS TAB ── */}
      {activeTab === "colors" && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Color pickers */}
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">สีเว็บไซต์</h2>
                <p className="text-xs text-slate-500">คลิกกล่องสีเพื่อเปิด color picker</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {COLOR_FIELDS.map(([key, label]) => (
                <ColorField key={key} label={label} value={theme[key]} onChange={setColor(key)} />
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                หลังบันทึก หน้าเว็บสาธารณะจะใช้สีใหม่เมื่อ refresh
              </p>
            </div>
          </div>

          {/* Color preview + contrast */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6">
              <h2 className="font-semibold text-slate-900 mb-4 text-sm">Preview (real-time)</h2>
              <ThemePreview theme={theme} />
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">Auto Contrast</h3>
              <div className="space-y-1.5">
                {(
                  [
                    ["navbarColor", "Navbar text"],
                    ["footerColor", "Footer text"],
                    ["buttonColor", "Button text"],
                    ["heroOverlayColor", "Hero text"],
                    ["backgroundColor", "Body text"],
                  ] as [keyof SiteTheme, string][]
                ).map(([k, lbl]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{lbl}</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-md border border-slate-200"
                        style={{ backgroundColor: theme[k] }}
                      />
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded"
                        style={{ backgroundColor: theme[k], color: getContrastText(theme[k]) }}
                      >
                        {isDarkColor(theme[k]) ? "white" : "dark"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DESIGN TOKENS TAB ── */}
      {activeTab === "design" && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Controls */}
          <div className="lg:col-span-3 space-y-5">

            {/* Typography */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Typography</h2>
                  <p className="text-xs text-slate-500">ฟอนต์ ขนาด และน้ำหนัก</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label="Body Font Family"
                  value={tokens.fontFamily}
                  onChange={setToken("fontFamily")}
                  options={FONT_OPTIONS}
                />
                <SelectField
                  label="Heading Font Family"
                  value={tokens.headingFontFamily}
                  onChange={setToken("headingFontFamily")}
                  options={HEADING_FONT_OPTIONS}
                />
              </div>

              <SegmentedControl
                label="Base Font Size (px)"
                value={tokens.baseFontSize}
                onChange={setToken("baseFontSize")}
                options={FONT_SIZE_OPTIONS}
                hint="ส่งผลต่อขนาดตัวอักษรทั่วทั้งเว็บ"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <SegmentedControl
                  label="Heading Weight"
                  value={tokens.headingWeight}
                  onChange={setToken("headingWeight")}
                  options={HEADING_WEIGHT_OPTIONS}
                />
                <SegmentedControl
                  label="Body Weight"
                  value={tokens.bodyWeight}
                  onChange={setToken("bodyWeight")}
                  options={BODY_WEIGHT_OPTIONS}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <SegmentedControl
                  label="Nav Font Size (px)"
                  value={tokens.navFontSize}
                  onChange={setToken("navFontSize")}
                  options={NAV_SIZE_OPTIONS}
                />
                <SegmentedControl
                  label="Nav Font Weight"
                  value={tokens.navFontWeight}
                  onChange={setToken("navFontWeight")}
                  options={NAV_WEIGHT_OPTIONS}
                />
              </div>
            </div>

            {/* Layout */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white">
                  <LayoutTemplate className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Layout & Spacing</h2>
                  <p className="text-xs text-slate-500">ระยะห่าง ความกว้าง และรัศมีมุม</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <SegmentedControl
                  label="Section Spacing"
                  value={tokens.sectionSpacing}
                  onChange={setToken("sectionSpacing")}
                  options={SPACING_OPTIONS}
                  hint="compact=2.5rem · normal=5rem · spacious=8rem"
                />
                <SegmentedControl
                  label="Content Width"
                  value={tokens.contentWidth}
                  onChange={setToken("contentWidth")}
                  options={CONTENT_WIDTH_OPTIONS}
                  hint="normal=80rem · wide=90rem · full=100%"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">ปรับรูปแบบเว็บไซต์ / Navbar</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      แยกความสูงแถบเมนูออกจากขนาดกรอบโลโก้ เพื่อคุม navbar ไม่ให้สูงผิดปกติ
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetNavbarTokens}
                    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset default
                  </button>
                </div>

                <div className="space-y-4">
                  <SegmentedControl
                    label="โหมดความสูง Navbar"
                    value={tokens.navbarHeightMode}
                    onChange={setNavbarMode}
                    options={NAVBAR_MODE_OPTIONS}
                    hint="เลือก Custom ถ้าต้องการกำหนดตัวเลขเอง"
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <NumberField
                      label="ความสูง Desktop Navbar (px)"
                      value={tokens.navbarDesktopHeight}
                      min={64}
                      max={160}
                      onChange={setNavbarNumber("navbarDesktopHeight")}
                    />
                    <NumberField
                      label="ความสูง Mobile Navbar (px)"
                      value={tokens.navbarMobileHeight}
                      min={56}
                      max={150}
                      onChange={setNavbarNumber("navbarMobileHeight")}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <NumberField
                      label="ระยะบนล่าง Desktop"
                      value={tokens.navbarDesktopPaddingY}
                      min={4}
                      max={40}
                      onChange={setNavbarNumber("navbarDesktopPaddingY")}
                    />
                    <NumberField
                      label="ระยะบนล่าง Mobile"
                      value={tokens.navbarMobilePaddingY}
                      min={4}
                      max={32}
                      onChange={setNavbarNumber("navbarMobilePaddingY")}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <NumberField
                      label="จำกัดความสูงโลโก้ใน Navbar"
                      value={tokens.navbarMaxLogoHeight}
                      min={32}
                      max={150}
                      onChange={setNavbarNumber("navbarMaxLogoHeight")}
                      hint="ขนาดโลโก้ยังปรับได้ถึง 150px แต่ใน navbar จะถูก scale ให้อยู่ใต้เพดานนี้"
                    />
                    <SegmentedControl
                      label="Navbar Content Width"
                      value={tokens.navbarContentWidth}
                      onChange={setToken("navbarContentWidth")}
                      options={CONTENT_WIDTH_OPTIONS}
                    />
                  </div>

                  <SegmentedControl
                    label="Navbar Vertical Align"
                    value={tokens.navbarVerticalAlign}
                    onChange={setToken("navbarVerticalAlign")}
                    options={NAVBAR_ALIGN_OPTIONS}
                  />

                  <div className="rounded-2xl border border-amber-100 bg-white p-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-900">Logo Free Mode</h4>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        ขนาดโลโก้ในโหมด Free ไม่เพิ่มความสูง Navbar และสามารถลอยทับ Hero ได้ ถ้าต้องการปลอดภัยให้ใช้ Contained / Safe
                      </p>
                    </div>
                    <div className="space-y-4">
                      <SegmentedControl
                        label="โหมดการแสดงโลโก้ใน Navbar"
                        value={tokens.logoNavbarDisplayMode}
                        onChange={setToken("logoNavbarDisplayMode")}
                        options={LOGO_NAVBAR_MODE_OPTIONS}
                        hint="Contained จำกัดโลโก้ในกรอบ navbar, Free ให้โลโก้ลอยโดยไม่ดันความสูงแถบเมนู"
                      />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <NumberField
                          label="ขนาดโลโก้ Navbar Desktop"
                          value={tokens.logoNavbarVisualSizeDesktop}
                          min={24}
                          max={800}
                          onChange={setToken("logoNavbarVisualSizeDesktop")}
                          hint={Number(tokens.logoNavbarVisualSizeDesktop) > 180 ? "ใหญ่กว่า 180px อาจลอยทับ Hero หรือเมนู" : undefined}
                        />
                        <NumberField
                          label="ขนาดโลโก้ Navbar Mobile"
                          value={tokens.logoNavbarVisualSizeMobile}
                          min={20}
                          max={400}
                          onChange={setToken("logoNavbarVisualSizeMobile")}
                          hint={Number(tokens.logoNavbarVisualSizeMobile) > 140 ? "ใหญ่กว่า 140px อาจบังพื้นที่เมนูมือถือ" : undefined}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <NumberField
                          label="เลื่อนโลโก้ X"
                          value={tokens.logoNavbarOffsetX}
                          min={-300}
                          max={300}
                          onChange={setToken("logoNavbarOffsetX")}
                        />
                        <NumberField
                          label="เลื่อนโลโก้ Y"
                          value={tokens.logoNavbarOffsetY}
                          min={-200}
                          max={200}
                          onChange={setToken("logoNavbarOffsetY")}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <NumberField
                          label="Logo layer z-index"
                          value={tokens.logoNavbarZIndex}
                          min={1}
                          max={100}
                          onChange={setToken("logoNavbarZIndex")}
                          hint="Dropdown ใช้ชั้นสูงกว่า logo เพื่อไม่ให้ถูกบัง"
                        />
                        <SegmentedControl
                          label="Logo Overflow"
                          value={tokens.logoNavbarOverflow}
                          onChange={setToken("logoNavbarOverflow")}
                          options={LOGO_NAVBAR_OVERFLOW_OPTIONS}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <SegmentedControl
                  label="Card Radius"
                  value={tokens.cardRadius}
                  onChange={setToken("cardRadius")}
                  options={CARD_RADIUS_OPTIONS}
                  hint="S=8px · M=12px · L=16px · XL=24px"
                />
                <SegmentedControl
                  label="Card Shadow"
                  value={tokens.cardShadow}
                  onChange={setToken("cardShadow")}
                  options={CARD_SHADOW_OPTIONS}
                />
              </div>

              <SegmentedControl
                label="Button Radius"
                value={tokens.buttonRadius}
                onChange={setToken("buttonRadius")}
                options={BUTTON_RADIUS_OPTIONS}
                hint="S=6px · M=10px · L=14px · Pill=9999px"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <SegmentedControl
                  label="Section Heading Align"
                  value={tokens.sectionHeadingAlign}
                  onChange={setToken("sectionHeadingAlign")}
                  options={SECTION_HEADING_OPTIONS}
                />
                <SegmentedControl
                  label="Hero Text Align"
                  value={tokens.heroTextAlign}
                  onChange={setToken("heroTextAlign")}
                  options={HERO_TEXT_OPTIONS}
                />
              </div>

              <SegmentedControl
                label="Hero Content Position"
                value={tokens.heroContentPosition}
                onChange={setToken("heroContentPosition")}
                options={HERO_CONTENT_OPTIONS}
              />
            </div>
          </div>

          {/* Design Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6">
              <h2 className="font-semibold text-slate-900 mb-4 text-sm">Design Preview</h2>
              <DesignPreview tokens={tokens} />
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-6">
              <h2 className="font-semibold text-slate-900 mb-4 text-sm">Navbar Preview</h2>
              <NavbarLayoutPreview tokens={tokens} />
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>หมายเหตุ:</strong> Font family, font size, body weight, section spacing และ content width
                ส่งผลทันทีหลัง refresh — ค่า heading weight จะมีผลที่ heading ที่ไม่ได้ใช้ Tailwind weight utility โดยตรง
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 max-w-sm ${
            toast.ok ? "bg-slate-900" : "bg-rose-600"
          }`}
        >
          {toast.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
