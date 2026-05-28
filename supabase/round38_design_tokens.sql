-- Round 38: Global Design Tokens
-- Add design_tokens JSONB column to site_settings for storing typography,
-- spacing, radius, and layout preferences separate from color theme.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS design_tokens jsonb DEFAULT '{}'::jsonb;

ALTER TABLE site_settings
  ALTER COLUMN design_tokens SET DEFAULT '{}'::jsonb;

UPDATE site_settings
SET design_tokens = '{}'::jsonb
WHERE design_tokens IS NULL;

COMMENT ON COLUMN site_settings.design_tokens IS
  'Round 38 global design controls: typography, spacing, radius, shadow, and layout tokens.';
