-- supabase/round35_news_rich_editor.sql
-- Round 35: Rich News System — slug, content_html, featured, sort_order, author_name
-- Rerun-safe / idempotent

-- ── 1. New columns ────────────────────────────────────────────────────────────
ALTER TABLE news
  ADD COLUMN IF NOT EXISTS slug         text,
  ADD COLUMN IF NOT EXISTS content_html text,
  ADD COLUMN IF NOT EXISTS is_featured  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS author_name  text;

-- ── 2. Indexes ────────────────────────────────────────────────────────────────
-- Partial unique index allows NULLs during migration then enforces uniqueness once set
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_slug
  ON news(slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_is_featured  ON news(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);

-- ── 3. Slug helper (ASCII-only — safe for URL paths) ─────────────────────────
CREATE OR REPLACE FUNCTION slugify_ascii(input text)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  -- Strip everything except ASCII letters/digits and spaces, lowercase, hyphenate
  result := lower(regexp_replace(trim(input), '[^a-zA-Z0-9\s]', '', 'g'));
  result := regexp_replace(result, '\s+', '-', 'g');
  result := regexp_replace(result, '-+',  '-', 'g');
  result := trim(both '-' from result);
  RETURN CASE WHEN result = '' THEN NULL ELSE left(result, 60) END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 4. Auto-slug trigger function ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION news_ensure_slug()
RETURNS trigger AS $$
DECLARE
  base      text;
  candidate text;
  suffix    int := 0;
BEGIN
  IF NEW.slug IS NULL OR trim(COALESCE(NEW.slug, '')) = '' THEN
    base := slugify_ascii(NEW.title);
    -- For pure-Thai titles, fall back to id-prefix
    IF base IS NULL THEN
      base := 'news-' || left(NEW.id::text, 8);
    ELSE
      base := base || '-' || to_char(COALESCE(NEW.published_at, now()), 'YYYYMMDD');
    END IF;
    candidate := base;
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM news
        WHERE slug = candidate
          AND (TG_OP = 'INSERT' OR id != NEW.id)
      ) THEN EXIT; END IF;
      suffix    := suffix + 1;
      candidate := base || '-' || suffix;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 5. Trigger (INSERT only — UPDATE uses application-supplied slug) ──────────
DROP TRIGGER IF EXISTS news_ensure_slug_trigger ON news;
CREATE TRIGGER news_ensure_slug_trigger
  BEFORE INSERT ON news
  FOR EACH ROW EXECUTE FUNCTION news_ensure_slug();

-- ── 6. Backfill slugs for existing rows ──────────────────────────────────────
DO $$
DECLARE
  r         record;
  base      text;
  candidate text;
  suffix    int;
BEGIN
  FOR r IN SELECT id, title, created_at FROM news WHERE slug IS NULL LOOP
    suffix    := 0;
    base      := COALESCE(slugify_ascii(r.title), 'news')
                 || '-' || to_char(r.created_at, 'YYYYMMDD');
    candidate := base;
    LOOP
      IF NOT EXISTS (SELECT 1 FROM news WHERE slug = candidate) THEN EXIT; END IF;
      suffix    := suffix + 1;
      candidate := base || '-' || suffix;
    END LOOP;
    UPDATE news SET slug = candidate WHERE id = r.id;
  END LOOP;
END;
$$;

-- ── 7. RLS: drop + recreate (idempotent) ─────────────────────────────────────
DROP POLICY IF EXISTS "Public can read published news" ON news;
DROP POLICY IF EXISTS "Admins can manage news"          ON news;

CREATE POLICY "Public can read published news" ON news
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage news" ON news
  FOR ALL
  USING  ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('website_admin', 'super_admin'))
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') IN ('website_admin', 'super_admin'));
