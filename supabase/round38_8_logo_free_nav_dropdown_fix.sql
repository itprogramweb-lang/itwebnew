-- Round 38.8: Logo free-size navbar mode and dropdown clipping fix defaults
-- Rerun-safe. Uses existing site_settings.design_tokens JSONB column and
-- backfills new logo/navbar keys without overwriting existing custom values.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS design_tokens jsonb DEFAULT '{}'::jsonb;

ALTER TABLE site_settings
  ALTER COLUMN design_tokens SET DEFAULT '{}'::jsonb;

UPDATE site_settings
SET design_tokens =
  jsonb_build_object(
    'logoNavbarDisplayMode', 'contained',
    'logoNavbarVisualSizeDesktop', '96',
    'logoNavbarVisualSizeMobile', '72',
    'logoNavbarOffsetX', '0',
    'logoNavbarOffsetY', '0',
    'logoNavbarZIndex', '45',
    'logoNavbarOverflow', 'visible'
  ) || COALESCE(design_tokens, '{}'::jsonb)
WHERE design_tokens IS NULL
   OR NOT (design_tokens ? 'logoNavbarDisplayMode')
   OR NOT (design_tokens ? 'logoNavbarVisualSizeDesktop')
   OR NOT (design_tokens ? 'logoNavbarVisualSizeMobile')
   OR NOT (design_tokens ? 'logoNavbarOffsetX')
   OR NOT (design_tokens ? 'logoNavbarOffsetY')
   OR NOT (design_tokens ? 'logoNavbarZIndex')
   OR NOT (design_tokens ? 'logoNavbarOverflow');

COMMENT ON COLUMN site_settings.design_tokens IS
  'Round 38 global design controls including Round 38.8 logo free-size navbar mode and dropdown clipping fix tokens.';
