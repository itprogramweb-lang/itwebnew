import { DEFAULT_THEME, mergeTheme, themeToCSS, SiteTheme } from "@/lib/theme";
import {
  DEFAULT_DESIGN_TOKENS,
  DesignTokens,
  mergeDesignTokens,
  designTokensToCSS,
} from "@/lib/designTokens";
import { getSiteSettings } from "@/lib/supabase/queries";

export default async function ThemeLoader() {
  let theme: SiteTheme = DEFAULT_THEME;
  let tokens: DesignTokens = DEFAULT_DESIGN_TOKENS;
  try {
    const settings = await getSiteSettings();
    const t = settings?.theme;
    if (t && typeof t === "object" && Object.keys(t).length > 0) {
      theme = mergeTheme(t as Partial<SiteTheme>);
    }
    const dt = settings?.design_tokens;
    if (dt && typeof dt === "object" && Object.keys(dt).length > 0) {
      tokens = mergeDesignTokens(dt as Partial<DesignTokens>);
    }
  } catch {
    // silent fallback — public site stays functional
  }
  const css = `:root{${themeToCSS(theme)};${designTokensToCSS(tokens)}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
