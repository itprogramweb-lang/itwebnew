-- Round 38.5: News editor bugfix + universal image crop settings
-- Rerun-safe / non-destructive

ALTER TABLE news
  ADD COLUMN IF NOT EXISTS image_crop_settings jsonb DEFAULT '{}'::jsonb;

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS image_crop_settings jsonb DEFAULT '{}'::jsonb;

ALTER TABLE staff_members
  ADD COLUMN IF NOT EXISTS image_crop_settings jsonb DEFAULT '{}'::jsonb;

ALTER TABLE student_works
  ADD COLUMN IF NOT EXISTS image_crop_settings jsonb DEFAULT '{}'::jsonb;

ALTER TABLE teacher_works
  ADD COLUMN IF NOT EXISTS image_crop_settings jsonb DEFAULT '{}'::jsonb;

ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS image_crop_settings jsonb DEFAULT '{}'::jsonb;

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS apply_image_crop_settings jsonb DEFAULT '{}'::jsonb;

ALTER TABLE news ALTER COLUMN image_crop_settings SET DEFAULT '{}'::jsonb;
ALTER TABLE programs ALTER COLUMN image_crop_settings SET DEFAULT '{}'::jsonb;
ALTER TABLE staff_members ALTER COLUMN image_crop_settings SET DEFAULT '{}'::jsonb;
ALTER TABLE student_works ALTER COLUMN image_crop_settings SET DEFAULT '{}'::jsonb;
ALTER TABLE teacher_works ALTER COLUMN image_crop_settings SET DEFAULT '{}'::jsonb;
ALTER TABLE hero_slides ALTER COLUMN image_crop_settings SET DEFAULT '{}'::jsonb;
ALTER TABLE site_settings ALTER COLUMN apply_image_crop_settings SET DEFAULT '{}'::jsonb;

UPDATE news SET image_crop_settings = '{}'::jsonb WHERE image_crop_settings IS NULL;
UPDATE programs SET image_crop_settings = '{}'::jsonb WHERE image_crop_settings IS NULL;
UPDATE staff_members SET image_crop_settings = '{}'::jsonb WHERE image_crop_settings IS NULL;
UPDATE student_works SET image_crop_settings = '{}'::jsonb WHERE image_crop_settings IS NULL;
UPDATE teacher_works SET image_crop_settings = '{}'::jsonb WHERE image_crop_settings IS NULL;
UPDATE hero_slides SET image_crop_settings = '{}'::jsonb WHERE image_crop_settings IS NULL;
UPDATE site_settings SET apply_image_crop_settings = '{}'::jsonb WHERE apply_image_crop_settings IS NULL;

COMMENT ON COLUMN news.image_crop_settings IS 'Round 38.5 CSS crop settings for news cover image';
COMMENT ON COLUMN programs.image_crop_settings IS 'Round 38.5 CSS crop settings for program image';
COMMENT ON COLUMN staff_members.image_crop_settings IS 'Round 38.5 CSS crop settings for staff photo';
COMMENT ON COLUMN student_works.image_crop_settings IS 'Round 38.5 CSS crop settings for student work image';
COMMENT ON COLUMN teacher_works.image_crop_settings IS 'Round 38.5 CSS crop settings for teacher work image';
COMMENT ON COLUMN hero_slides.image_crop_settings IS 'Round 38.5 CSS crop settings for hero slide image';
COMMENT ON COLUMN site_settings.apply_image_crop_settings IS 'Round 38.5 CSS crop settings for apply hero image';
