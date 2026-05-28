-- Round 38.7: Navbar layout design token defaults
-- Rerun-safe. Uses existing site_settings.design_tokens JSONB column and
-- backfills navbar layout keys without overwriting existing custom values.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS design_tokens jsonb DEFAULT '{}'::jsonb;

ALTER TABLE site_settings
  ALTER COLUMN design_tokens SET DEFAULT '{}'::jsonb;

UPDATE site_settings
SET design_tokens =
  jsonb_build_object(
    'navbarHeightMode', 'normal',
    'navbarDesktopHeight', '96',
    'navbarMobileHeight', '72',
    'navbarDesktopPaddingY', '16',
    'navbarMobilePaddingY', '10',
    'navbarMaxLogoHeight', '72',
    'navbarContentWidth', 'normal',
    'navbarVerticalAlign', 'center'
  ) || COALESCE(design_tokens, '{}'::jsonb)
WHERE design_tokens IS NULL
   OR NOT (design_tokens ? 'navbarHeightMode')
   OR NOT (design_tokens ? 'navbarDesktopHeight')
   OR NOT (design_tokens ? 'navbarMobileHeight')
   OR NOT (design_tokens ? 'navbarDesktopPaddingY')
   OR NOT (design_tokens ? 'navbarMobilePaddingY')
   OR NOT (design_tokens ? 'navbarMaxLogoHeight')
   OR NOT (design_tokens ? 'navbarContentWidth')
   OR NOT (design_tokens ? 'navbarVerticalAlign');

COMMENT ON COLUMN site_settings.design_tokens IS
  'Round 38 global design controls including Round 38.7 navbar height/layout tokens.';
