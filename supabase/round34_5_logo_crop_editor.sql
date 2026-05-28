-- round34_5_logo_crop_editor.sql
-- เพิ่ม manual crop fields ใน site_settings
-- วิธีรัน: paste ใน Supabase SQL Editor แล้ว Run

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS logo_fit_mode  text    DEFAULT 'contain',
  ADD COLUMN IF NOT EXISTS logo_pos_x     integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS logo_pos_y     integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS logo_zoom      numeric DEFAULT 1.0;

-- Set defaults on existing rows
UPDATE site_settings SET
  logo_fit_mode = COALESCE(logo_fit_mode, 'contain'),
  logo_pos_x    = COALESCE(logo_pos_x, 50),
  logo_pos_y    = COALESCE(logo_pos_y, 50),
  logo_zoom     = COALESCE(logo_zoom, 1.0);
