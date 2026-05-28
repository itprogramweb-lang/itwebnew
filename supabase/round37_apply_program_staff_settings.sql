-- round37_apply_program_staff_settings.sql
-- Apply page hero settings, staff position ordering
-- Idempotent: safe to re-run

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS apply_hero_image_url  text,
  ADD COLUMN IF NOT EXISTS apply_hero_template   text DEFAULT 'no-image-clean',
  ADD COLUMN IF NOT EXISTS apply_title           text,
  ADD COLUMN IF NOT EXISTS apply_eyebrow         text,
  ADD COLUMN IF NOT EXISTS apply_description     text,
  ADD COLUMN IF NOT EXISTS staff_intro_title     text,
  ADD COLUMN IF NOT EXISTS staff_intro_description text,
  ADD COLUMN IF NOT EXISTS staff_position_order  text;
