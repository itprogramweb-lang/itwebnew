-- round36_student_work_slug.sql
-- Add slug column to student_works, auto-generate from title, backfill existing rows
-- Idempotent: safe to re-run

ALTER TABLE student_works ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_works_slug
  ON student_works(slug) WHERE slug IS NOT NULL;

-- Slugify function: lowercase, spaces→hyphens, keep a-z/0-9/Thai/hyphens
CREATE OR REPLACE FUNCTION slugify_work(val text) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  result text;
BEGIN
  result := lower(trim(val));
  result := regexp_replace(result, '\s+', '-', 'g');
  result := regexp_replace(result, '[^a-z0-9\-ก-๙]', '', 'g');
  result := regexp_replace(result, '\-{2,}', '-', 'g');
  result := btrim(result, '-');
  IF result = '' THEN result := 'work'; END IF;
  RETURN result;
END;
$$;

-- Trigger function: auto-set slug on INSERT/UPDATE
CREATE OR REPLACE FUNCTION student_work_ensure_slug() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := slugify_work(NEW.title);
  ELSE
    NEW.slug := slugify_work(NEW.slug);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS trg_student_work_slug ON student_works;
CREATE TRIGGER trg_student_work_slug
  BEFORE INSERT OR UPDATE OF title, slug ON student_works
  FOR EACH ROW EXECUTE FUNCTION student_work_ensure_slug();

-- Backfill existing rows that have no slug
DO $$
DECLARE
  r         RECORD;
  base_slug text;
  try_slug  text;
  n         int;
BEGIN
  FOR r IN SELECT id, title FROM student_works WHERE slug IS NULL OR slug = '' LOOP
    base_slug := slugify_work(r.title);
    try_slug  := base_slug;
    n         := 1;
    WHILE EXISTS (
      SELECT 1 FROM student_works WHERE slug = try_slug AND id != r.id
    ) LOOP
      n         := n + 1;
      try_slug  := base_slug || '-' || n;
    END LOOP;
    UPDATE student_works SET slug = try_slug WHERE id = r.id;
  END LOOP;
END;
$$;

-- RLS: allow public read of slug (already covered by existing select policy)
-- No changes needed to RLS if student_works already has a public SELECT policy
