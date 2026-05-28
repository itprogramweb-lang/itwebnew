"use client";
import { buildLogoStyle, buildNavbarLogoStyle } from "@/lib/logoPresets";

type PreviewProps = {
  logoUrl?: string;
  logoAlt?: string;
  desktopSize: number;
  mobileSize: number;
  preset: string;
  fitMode: string;
  posX: number;
  posY: number;
  zoom: number;
  showLogo: boolean;
  showBrandName: boolean;
  brandShortName: string;
  brandName: string;
  navbarDisplayMode: "contained" | "free";
  navbarVisualSizeDesktop: number;
  navbarVisualSizeMobile: number;
  navbarOffsetX: number;
  navbarOffsetY: number;
  navbarOverflow: "visible" | "contained";
};

function LogoMark({
  logoUrl,
  logoAlt = "",
  size,
  preset,
  fitMode,
  posX,
  posY,
  zoom,
  brandShortName,
  showLogo,
}: PreviewProps & { size: number }) {
  const { wrapperStyle, imgStyle } = buildLogoStyle({
    size,
    maxSize: "var(--site-navbar-max-logo-height, 72px)",
    preset,
    fitMode,
    posX,
    posY,
    zoom,
  });

  if (!showLogo) return null;

  if (logoUrl) {
    return (
      <div style={wrapperStyle}>
        <img src={logoUrl} alt={logoAlt} style={imgStyle} />
      </div>
    );
  }
  return (
    <div
      style={wrapperStyle}
      className="bg-brand-gradient grid place-items-center"
    >
      <span className="text-white font-bold select-none" style={{ fontSize: size * 0.3 }}>
        {brandShortName.slice(0, 2)}
      </span>
    </div>
  );
}

function NavbarLogoMark({
  viewport,
  logoUrl,
  logoAlt = "",
  desktopSize,
  mobileSize,
  preset,
  fitMode,
  posX,
  posY,
  zoom,
  brandShortName,
  showLogo,
  navbarDisplayMode,
  navbarVisualSizeDesktop,
  navbarVisualSizeMobile,
  navbarOffsetX,
  navbarOffsetY,
  navbarOverflow,
}: PreviewProps & { viewport: "desktop" | "mobile" }) {
  const logo = buildNavbarLogoStyle({
    viewport,
    logoDesktopSize: desktopSize,
    logoMobileSize: mobileSize,
    preset,
    fitMode,
    posX,
    posY,
    zoom,
    displayMode: navbarDisplayMode,
    visualSizeDesktop: navbarVisualSizeDesktop,
    visualSizeMobile: navbarVisualSizeMobile,
    offsetX: navbarOffsetX,
    offsetY: navbarOffsetY,
    zIndex: 45,
    overflow: navbarOverflow,
  });

  if (!showLogo) return null;

  return (
    <div className="site-navbar-logo-slot shrink-0" style={logo.slotStyle}>
      <div className={logo.isFree ? "site-navbar-logo-free" : ""} style={logo.isFree ? logo.layerStyle : undefined}>
        {logoUrl ? (
          <div style={logo.wrapperStyle}>
            <img src={logoUrl} alt={logoAlt} style={logo.imgStyle} />
          </div>
        ) : (
          <div style={logo.wrapperStyle} className="grid place-items-center bg-brand-gradient">
            <span className="select-none font-bold text-white" style={{ fontSize: Math.min(24, (viewport === "desktop" ? desktopSize : mobileSize) * 0.3) }}>
              {brandShortName.slice(0, 2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogoPreviewPanel(props: PreviewProps) {
  const { desktopSize, showBrandName, brandShortName, brandName, navbarDisplayMode } = props;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">F) Preview ใช้ logic เดียวกับของจริง</p>
        <p className="text-xs text-slate-500">Navbar preview เรียก `buildNavbarLogoStyle()` ตัวเดียวกับ public Navbar</p>
      </div>

      <PreviewCard label={`Actual logo preview (${desktopSize}px frame)`}>
        <div className="grid min-h-[190px] place-items-center rounded-xl bg-slate-100">
          <LogoMark {...props} size={desktopSize} />
        </div>
      </PreviewCard>

      {/* Desktop Navbar */}
      <PreviewCard label="Navbar Desktop">
        <div
          className="site-navbar-shell flex w-full items-center gap-2 overflow-visible rounded-xl bg-slate-900 px-4"
          style={{
            minHeight: "var(--site-navbar-desktop-height, 96px)",
            paddingTop: "var(--site-navbar-desktop-padding-y, 16px)",
            paddingBottom: "var(--site-navbar-desktop-padding-y, 16px)",
          }}
        >
          <NavbarLogoMark {...props} viewport="desktop" />
          {showBrandName && (
            <div className="min-w-0 leading-tight">
              <div className="text-white text-sm font-semibold truncate">{brandShortName || "CT"}</div>
              <div className="text-slate-400 text-[10px] truncate">{brandName || "Computer Technology"}</div>
            </div>
          )}
          <div className="ml-auto flex items-center gap-3 opacity-40">
            {["หน้าแรก","ข่าวสาร","หลักสูตร"].map((m) => (
              <div key={m} className="text-[10px] text-slate-300">{m}</div>
            ))}
          </div>
        </div>
      </PreviewCard>

      {/* Mobile Navbar */}
      <PreviewCard label="Navbar Mobile (360px)">
        <div
          className="site-navbar-shell flex max-w-[320px] items-center justify-between overflow-visible rounded-xl bg-slate-900 px-3"
          style={{
            minHeight: "var(--site-navbar-mobile-height, 72px)",
            paddingTop: "var(--site-navbar-mobile-padding-y, 10px)",
            paddingBottom: "var(--site-navbar-mobile-padding-y, 10px)",
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <NavbarLogoMark {...props} viewport="mobile" />
            {showBrandName && (
              <div className="truncate text-xs font-semibold text-white">{brandShortName || "CT"}</div>
            )}
          </div>
          <div className="flex flex-col gap-0.5 opacity-40">
            {[1,2,3].map((i) => <div key={i} className="w-4 h-0.5 bg-slate-400 rounded" />)}
          </div>
        </div>
      </PreviewCard>

      {/* Footer */}
      <PreviewCard label="Footer">
        <div className="flex items-start gap-2.5 bg-slate-900 rounded-xl px-4 py-3 w-full">
          <LogoMark {...props} size={44} />
          {showBrandName && (
            <div>
              <div className="text-white text-sm font-semibold">{brandShortName || "CT"}</div>
              <div className="text-slate-400 text-xs">{brandName || "Computer Technology"}</div>
            </div>
          )}
        </div>
      </PreviewCard>

      {/* Dashboard Sidebar */}
      <PreviewCard label="Dashboard Sidebar">
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <LogoMark {...props} size={36} />
          {showBrandName && (
            <div>
              <div className="text-slate-900 text-xs font-bold">{brandShortName || "CT"}</div>
              <div className="text-slate-400 text-[9px]">หลังบ้านระบบจัดการ</div>
            </div>
          )}
        </div>
      </PreviewCard>

      {navbarDisplayMode === "free" && (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
          Free mode แสดง visual size และ offset จริง แต่ความสูง Navbar ยังถูกคุมด้วย design token ไม่ได้สูงตามโลโก้
        </p>
      )}
    </div>
  );
}

function PreviewCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] text-slate-400 mb-2">{label}</p>
      {children}
    </div>
  );
}
