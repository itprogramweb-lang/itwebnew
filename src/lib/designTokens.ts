export type DesignTokens = {
  fontFamily: string;
  headingFontFamily: string;
  baseFontSize: string;
  headingWeight: string;
  bodyWeight: string;
  navFontSize: string;
  navFontWeight: string;
  sectionHeadingAlign: string;
  sectionSpacing: string;
  cardRadius: string;
  cardShadow: string;
  buttonRadius: string;
  contentWidth: string;
  heroTextAlign: string;
  heroContentPosition: string;
  navbarHeightMode: string;
  navbarDesktopHeight: string;
  navbarMobileHeight: string;
  navbarDesktopPaddingY: string;
  navbarMobilePaddingY: string;
  navbarMaxLogoHeight: string;
  navbarContentWidth: string;
  navbarVerticalAlign: string;
  logoNavbarDisplayMode: string;
  logoNavbarVisualSizeDesktop: string;
  logoNavbarVisualSizeMobile: string;
  logoNavbarOffsetX: string;
  logoNavbarOffsetY: string;
  logoNavbarZIndex: string;
  logoNavbarOverflow: string;
};

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  fontFamily: "IBM Plex Sans Thai",
  headingFontFamily: "same",
  baseFontSize: "16px",
  headingWeight: "700",
  bodyWeight: "400",
  navFontSize: "14px",
  navFontWeight: "500",
  sectionHeadingAlign: "center",
  sectionSpacing: "normal",
  cardRadius: "xlarge",
  cardShadow: "soft",
  buttonRadius: "large",
  contentWidth: "normal",
  heroTextAlign: "center",
  heroContentPosition: "center",
  navbarHeightMode: "normal",
  navbarDesktopHeight: "96",
  navbarMobileHeight: "72",
  navbarDesktopPaddingY: "16",
  navbarMobilePaddingY: "10",
  navbarMaxLogoHeight: "72",
  navbarContentWidth: "normal",
  navbarVerticalAlign: "center",
  logoNavbarDisplayMode: "contained",
  logoNavbarVisualSizeDesktop: "96",
  logoNavbarVisualSizeMobile: "72",
  logoNavbarOffsetX: "0",
  logoNavbarOffsetY: "0",
  logoNavbarZIndex: "45",
  logoNavbarOverflow: "visible",
};

export function mergeDesignTokens(partial: Partial<DesignTokens>): DesignTokens {
  return { ...DEFAULT_DESIGN_TOKENS, ...partial };
}

export const FONT_STACKS: Record<string, string> = {
  "IBM Plex Sans Thai": '"IBM Plex Sans Thai","Noto Sans Thai",system-ui,sans-serif',
  "Noto Sans Thai": '"Noto Sans Thai",system-ui,sans-serif',
  Sarabun: '"Sarabun",system-ui,sans-serif',
  Prompt: '"Prompt",system-ui,sans-serif',
  "system-ui": "system-ui,sans-serif",
};

export const SECTION_SPACING_MAP: Record<string, string> = {
  compact: "2.5rem",
  normal: "5rem",
  spacious: "8rem",
};

export const CARD_RADIUS_MAP: Record<string, string> = {
  small: "0.5rem",
  medium: "0.75rem",
  large: "1rem",
  xlarge: "1.5rem",
};

export const BUTTON_RADIUS_MAP: Record<string, string> = {
  small: "0.375rem",
  medium: "0.625rem",
  large: "0.875rem",
  pill: "9999px",
};

export const CONTENT_WIDTH_MAP: Record<string, string> = {
  normal: "80rem",
  wide: "90rem",
  full: "100%",
};

export const NAVBAR_WIDTH_MAP: Record<string, string> = {
  normal: "80rem",
  wide: "90rem",
  full: "100%",
};

export const NAVBAR_MODE_PRESETS: Record<
  string,
  {
    desktopHeight: number;
    mobileHeight: number;
    desktopPaddingY: number;
    mobilePaddingY: number;
    maxLogoHeight: number;
  }
> = {
  compact: {
    desktopHeight: 88,
    mobileHeight: 64,
    desktopPaddingY: 12,
    mobilePaddingY: 8,
    maxLogoHeight: 64,
  },
  normal: {
    desktopHeight: 96,
    mobileHeight: 72,
    desktopPaddingY: 16,
    mobilePaddingY: 10,
    maxLogoHeight: 72,
  },
  spacious: {
    desktopHeight: 112,
    mobileHeight: 84,
    desktopPaddingY: 20,
    mobilePaddingY: 14,
    maxLogoHeight: 88,
  },
};

export const CARD_SHADOW_MAP: Record<string, string> = {
  none: "none",
  soft: "0 12px 32px -24px rgba(15, 23, 42, 0.32)",
  medium: "0 20px 44px -28px rgba(15, 23, 42, 0.42)",
};

const VALID_FONT_SIZES = new Set(["13px", "14px", "15px", "16px", "17px", "18px"]);
const VALID_WEIGHTS = new Set(["300", "400", "500", "600", "700"]);

function safe(value: unknown, fallback: string, valid: Set<string>): string {
  return typeof value === "string" && valid.has(value) ? value : fallback;
}

function safeNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
}

export function resolveNavbarTokens(t: DesignTokens) {
  const mode = ["compact", "normal", "spacious", "custom"].includes(t.navbarHeightMode)
    ? t.navbarHeightMode
    : DEFAULT_DESIGN_TOKENS.navbarHeightMode;
  const preset = NAVBAR_MODE_PRESETS[mode] ?? NAVBAR_MODE_PRESETS.normal;
  const isCustom = mode === "custom";
  const desktopHeight = isCustom
    ? safeNumber(t.navbarDesktopHeight, 96, 64, 160)
    : preset.desktopHeight;
  const mobileHeight = isCustom
    ? safeNumber(t.navbarMobileHeight, 72, 56, 150)
    : preset.mobileHeight;
  const desktopPaddingY = isCustom
    ? safeNumber(t.navbarDesktopPaddingY, 16, 4, 40)
    : preset.desktopPaddingY;
  const mobilePaddingY = isCustom
    ? safeNumber(t.navbarMobilePaddingY, 10, 4, 32)
    : preset.mobilePaddingY;
  const maxLogoHeight = isCustom
    ? safeNumber(t.navbarMaxLogoHeight, 72, 32, 150)
    : preset.maxLogoHeight;
  const contentWidth =
    NAVBAR_WIDTH_MAP[t.navbarContentWidth] ?? NAVBAR_WIDTH_MAP[DEFAULT_DESIGN_TOKENS.navbarContentWidth];
  const verticalAlign =
    t.navbarVerticalAlign === "top"
      ? "flex-start"
      : t.navbarVerticalAlign === "bottom"
        ? "flex-end"
        : "center";
  const logoDisplayMode = t.logoNavbarDisplayMode === "free" ? "free" : "contained";
  const logoOverflow = t.logoNavbarOverflow === "contained" ? "contained" : "visible";
  const logoVisualSizeDesktop = safeNumber(t.logoNavbarVisualSizeDesktop, 96, 24, 800);
  const logoVisualSizeMobile = safeNumber(t.logoNavbarVisualSizeMobile, 72, 20, 400);
  const logoOffsetX = safeNumber(t.logoNavbarOffsetX, 0, -300, 300);
  const logoOffsetY = safeNumber(t.logoNavbarOffsetY, 0, -200, 200);
  const logoZIndex = safeNumber(t.logoNavbarZIndex, 45, 1, 100);

  return {
    mode,
    desktopHeight,
    mobileHeight,
    desktopPaddingY,
    mobilePaddingY,
    maxLogoHeight,
    contentWidth,
    verticalAlign,
    logoDisplayMode,
    logoOverflow,
    logoVisualSizeDesktop,
    logoVisualSizeMobile,
    logoOffsetX,
    logoOffsetY,
    logoZIndex,
  };
}

export function designTokensToCSS(t: DesignTokens): string {
  const fontStack = FONT_STACKS[t.fontFamily] ?? FONT_STACKS[DEFAULT_DESIGN_TOKENS.fontFamily];
  const headingStack =
    t.headingFontFamily === "same"
      ? fontStack
      : (FONT_STACKS[t.headingFontFamily] ?? fontStack);

  const baseFontSize = safe(t.baseFontSize, DEFAULT_DESIGN_TOKENS.baseFontSize, VALID_FONT_SIZES);
  const headingWeight = safe(t.headingWeight, DEFAULT_DESIGN_TOKENS.headingWeight, VALID_WEIGHTS);
  const bodyWeight = safe(t.bodyWeight, DEFAULT_DESIGN_TOKENS.bodyWeight, VALID_WEIGHTS);
  const navFontSize = safe(t.navFontSize, DEFAULT_DESIGN_TOKENS.navFontSize, VALID_FONT_SIZES);
  const navFontWeight = safe(t.navFontWeight, DEFAULT_DESIGN_TOKENS.navFontWeight, VALID_WEIGHTS);

  const sectionSpacingY = SECTION_SPACING_MAP[t.sectionSpacing] ?? SECTION_SPACING_MAP[DEFAULT_DESIGN_TOKENS.sectionSpacing];
  const cardRadius = CARD_RADIUS_MAP[t.cardRadius] ?? CARD_RADIUS_MAP[DEFAULT_DESIGN_TOKENS.cardRadius];
  const cardShadow = CARD_SHADOW_MAP[t.cardShadow] ?? CARD_SHADOW_MAP[DEFAULT_DESIGN_TOKENS.cardShadow];
  const buttonRadius = BUTTON_RADIUS_MAP[t.buttonRadius] ?? BUTTON_RADIUS_MAP[DEFAULT_DESIGN_TOKENS.buttonRadius];
  const contentWidth = CONTENT_WIDTH_MAP[t.contentWidth] ?? CONTENT_WIDTH_MAP[DEFAULT_DESIGN_TOKENS.contentWidth];

  const sectionHeadingAlign = ["left", "center"].includes(t.sectionHeadingAlign)
    ? t.sectionHeadingAlign
    : DEFAULT_DESIGN_TOKENS.sectionHeadingAlign;
  const heroTextAlign = ["left", "center", "right"].includes(t.heroTextAlign)
    ? t.heroTextAlign
    : DEFAULT_DESIGN_TOKENS.heroTextAlign;
  const heroContentPosition = ["left", "center", "right"].includes(t.heroContentPosition)
    ? t.heroContentPosition
    : DEFAULT_DESIGN_TOKENS.heroContentPosition;
  const navbar = resolveNavbarTokens(t);

  return [
    `--site-font-family:${fontStack}`,
    `--site-heading-font-family:${headingStack}`,
    `--site-base-font-size:${baseFontSize}`,
    `--site-heading-weight:${headingWeight}`,
    `--site-body-weight:${bodyWeight}`,
    `--site-nav-font-size:${navFontSize}`,
    `--site-nav-font-weight:${navFontWeight}`,
    `--site-section-heading-align:${sectionHeadingAlign}`,
    `--site-section-spacing-y:${sectionSpacingY}`,
    `--site-card-radius:${cardRadius}`,
    `--site-card-shadow:${cardShadow}`,
    `--site-button-radius:${buttonRadius}`,
    `--site-content-width:${contentWidth}`,
    `--site-hero-text-align:${heroTextAlign}`,
    `--site-hero-content-position:${heroContentPosition}`,
    `--site-navbar-height-mode:${navbar.mode}`,
    `--site-navbar-desktop-height:${navbar.desktopHeight}px`,
    `--site-navbar-mobile-height:${navbar.mobileHeight}px`,
    `--site-navbar-desktop-padding-y:${navbar.desktopPaddingY}px`,
    `--site-navbar-mobile-padding-y:${navbar.mobilePaddingY}px`,
    `--site-navbar-max-logo-height:${navbar.maxLogoHeight}px`,
    `--site-navbar-content-width:${navbar.contentWidth}`,
    `--site-navbar-align-items:${navbar.verticalAlign}`,
    `--site-logo-navbar-display-mode:${navbar.logoDisplayMode}`,
    `--site-logo-navbar-visual-size-desktop:${navbar.logoVisualSizeDesktop}px`,
    `--site-logo-navbar-visual-size-mobile:${navbar.logoVisualSizeMobile}px`,
    `--site-logo-navbar-offset-x:${navbar.logoOffsetX}px`,
    `--site-logo-navbar-offset-y:${navbar.logoOffsetY}px`,
    `--site-logo-navbar-z-index:${navbar.logoZIndex}`,
    `--site-logo-navbar-overflow:${navbar.logoOverflow}`,
  ].join(";");
}
