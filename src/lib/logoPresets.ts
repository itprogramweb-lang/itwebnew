import type { CSSProperties } from "react";

export type LogoCropPreset = {
  id: string;
  labelTh: string;
  borderRadius: string;
  defaultFitMode: "contain" | "cover";
  defaultPosX: number;
  defaultPosY: number;
};

export const LOGO_PRESETS: LogoCropPreset[] = [
  { id: "square-contain",     labelTh: "สี่เหลี่ยมพอดีรูป",  borderRadius: "16px",  defaultFitMode: "contain", defaultPosX: 50, defaultPosY: 50 },
  { id: "square-cover",       labelTh: "สี่เหลี่ยมเต็มกรอบ", borderRadius: "16px",  defaultFitMode: "cover",   defaultPosX: 50, defaultPosY: 50 },
  { id: "rounded-contain",    labelTh: "มุมโค้งพอดีรูป",     borderRadius: "24px",  defaultFitMode: "contain", defaultPosX: 50, defaultPosY: 50 },
  { id: "rounded-cover",      labelTh: "มุมโค้งเต็มกรอบ",    borderRadius: "24px",  defaultFitMode: "cover",   defaultPosX: 50, defaultPosY: 50 },
  { id: "circle-cover",       labelTh: "วงกลม",               borderRadius: "50%",   defaultFitMode: "cover",   defaultPosX: 50, defaultPosY: 50 },
  { id: "wide-contain",       labelTh: "แนวนอนพอดีรูป",      borderRadius: "12px",  defaultFitMode: "contain", defaultPosX: 50, defaultPosY: 50 },
  { id: "wide-cover",         labelTh: "แนวนอนเต็มกรอบ",     borderRadius: "12px",  defaultFitMode: "cover",   defaultPosX: 50, defaultPosY: 50 },
  { id: "vertical-contain",   labelTh: "แนวตั้งพอดีรูป",     borderRadius: "16px",  defaultFitMode: "contain", defaultPosX: 50, defaultPosY: 50 },
  { id: "left-focus-cover",   labelTh: "โฟกัสซ้าย",          borderRadius: "16px",  defaultFitMode: "cover",   defaultPosX: 0,  defaultPosY: 50 },
  { id: "center-focus-cover", labelTh: "โฟกัสกลาง",          borderRadius: "16px",  defaultFitMode: "cover",   defaultPosX: 50, defaultPosY: 50 },
];

export function getPresetById(id: string): LogoCropPreset {
  return LOGO_PRESETS.find((p) => p.id === id) ?? LOGO_PRESETS[0];
}

export type LogoDisplayParams = {
  size: number;
  maxSize?: number | string;
  preset: string;
  fitMode?: string | null;
  posX?: number | null;
  posY?: number | null;
  zoom?: number | null;
  maxPixelSize?: number;
  overflow?: CSSProperties["overflow"];
};

export type LogoStyles = {
  wrapperStyle: CSSProperties;
  imgStyle: CSSProperties;
};

export type NavbarLogoStyleParams = {
  viewport: "desktop" | "mobile";
  logoDesktopSize: number;
  logoMobileSize: number;
  preset: string;
  fitMode?: string | null;
  posX?: number | null;
  posY?: number | null;
  zoom?: number | null;
  displayMode?: "contained" | "free" | string | null;
  visualSizeDesktop?: number | null;
  visualSizeMobile?: number | null;
  offsetX?: number | null;
  offsetY?: number | null;
  zIndex?: number | null;
  overflow?: "visible" | "contained" | string | null;
  maxLogoHeight?: number | string;
};

export type NavbarLogoStyles = LogoStyles & {
  isFree: boolean;
  slotStyle: CSSProperties;
  layerStyle: CSSProperties;
};

export function buildLogoStyle({
  size,
  maxSize,
  preset,
  fitMode,
  posX,
  posY,
  zoom,
  maxPixelSize = 800,
  overflow = "hidden",
}: LogoDisplayParams): LogoStyles {
  const p = getPresetById(preset);
  const safeMax = Math.max(20, maxPixelSize);
  const safeSize = Math.max(20, Math.min(safeMax, size));
  const displaySize =
    typeof maxSize === "string"
      ? `min(${safeSize}px, ${maxSize})`
      : typeof maxSize === "number"
        ? Math.min(safeSize, Math.max(20, Math.min(safeMax, maxSize)))
        : safeSize;
  const fm = (fitMode === "cover" ? "cover" : "contain") as "contain" | "cover";
  const px = posX ?? 50;
  const py = posY ?? 50;
  const z = fm === "cover" ? Math.max(1, zoom ?? 1) : 1;

  const wrapperStyle: CSSProperties = {
    width: displaySize,
    height: displaySize,
    maxWidth: `min(${safeMax}px, 60vw)`,
    maxHeight: typeof maxSize === "string" ? maxSize : `${safeMax}px`,
    borderRadius: p.borderRadius,
    overflow,
    flexShrink: 0,
    position: "relative",
  };

  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: fm,
    objectPosition: `${px}% ${py}%`,
    ...(z > 1.001
      ? { transform: `scale(${z})`, transformOrigin: `${px}% ${py}%` }
      : {}),
    display: "block",
  };

  return { wrapperStyle, imgStyle };
}

export function buildNavbarLogoStyle({
  viewport,
  logoDesktopSize,
  logoMobileSize,
  preset,
  fitMode,
  posX,
  posY,
  zoom,
  displayMode = "contained",
  visualSizeDesktop,
  visualSizeMobile,
  offsetX = 0,
  offsetY = 0,
  zIndex = 45,
  overflow = "visible",
  maxLogoHeight = "var(--site-navbar-max-logo-height, 72px)",
}: NavbarLogoStyleParams): NavbarLogoStyles {
  const isDesktop = viewport === "desktop";
  const isFree = displayMode === "free";
  const frameSize = isDesktop ? logoDesktopSize : logoMobileSize;
  const visualSize = isDesktop ? visualSizeDesktop : visualSizeMobile;
  const size = isFree ? visualSize ?? frameSize : frameSize;
  const maxPixelSize = isFree ? (isDesktop ? 800 : 400) : 150;
  const { wrapperStyle, imgStyle } = buildLogoStyle({
    size,
    maxSize: isFree ? undefined : maxLogoHeight,
    maxPixelSize,
    preset,
    fitMode,
    posX,
    posY,
    zoom,
  });

  const slotStyle: CSSProperties = isFree
    ? {
        width: maxLogoHeight,
        height: maxLogoHeight,
        overflow: overflow === "contained" ? "hidden" : "visible",
      }
    : {};

  const layerStyle: CSSProperties = isFree
    ? {
        position: "absolute",
        left: 0,
        top: "50%",
        zIndex: zIndex ?? 45,
        transform: `translate(${offsetX ?? 0}px, calc(-50% + ${offsetY ?? 0}px))`,
      }
    : {};

  return { isFree, slotStyle, layerStyle, wrapperStyle, imgStyle };
}

// ──────────────────────────────────────────
// Legacy helper — ยังใช้ได้สำหรับ thumbnail ขนาดเล็ก
// ──────────────────────────────────────────
export function getLogoImgStyle(preset: string, size: number): CSSProperties {
  const p = getPresetById(preset);
  return {
    width: size,
    height: size,
    borderRadius: p.borderRadius,
    objectFit: p.defaultFitMode,
    objectPosition: `${p.defaultPosX}% ${p.defaultPosY}%`,
    flexShrink: 0,
  };
}
