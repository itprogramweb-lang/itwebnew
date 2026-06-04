export type SiteTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  navbarColor: string;
  footerColor: string;
  buttonColor: string;
  heroOverlayColor: string;
};

export const DEFAULT_THEME: SiteTheme = {
  primaryColor: "#f97316",
  secondaryColor: "#111827",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  textColor: "#111827",
  navbarColor: "#020617",
  footerColor: "#0f172a",
  buttonColor: "#f97316",
  heroOverlayColor: "#000000",
};

export function mergeTheme(partial: Partial<SiteTheme>): SiteTheme {
  return { ...DEFAULT_THEME, ...partial };
}

export function isDarkColor(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return true;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function getContrastText(hex: string): string {
  return isDarkColor(hex) ? "#ffffff" : "#111827";
}

export function themeToCSS(t: SiteTheme): string {
  const buttonText = getContrastText(t.buttonColor);
  const primaryText = getContrastText(t.primaryColor);
  return [
    `--color-primary:${t.primaryColor}`,
    `--color-primary-text:${primaryText}`,
    `--color-secondary:${t.secondaryColor}`,
    `--color-accent:${t.accentColor}`,
    `--color-background:${t.backgroundColor}`,
    `--color-text:${t.textColor}`,
    `--color-navbar:${t.navbarColor}`,
    `--color-footer:${t.footerColor}`,
    `--color-button:${t.buttonColor}`,
    `--color-button-text:${buttonText}`,
    `--color-hero-overlay:${t.heroOverlayColor}`,
  ].join(";");
}
