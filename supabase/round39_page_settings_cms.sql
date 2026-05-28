-- round39_page_settings_cms.sql
-- Practical Page CMS: page_settings table and initial seed
-- Rerun-safe: uses IF NOT EXISTS, ON CONFLICT DO NOTHING, DROP IF EXISTS
-- ไม่ drop data, ไม่ rename destructive

-- ══════════════════════════════════════════════════════
-- 1. Create table
-- ══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS page_settings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key                text UNIQUE NOT NULL,
  title                   text,
  subtitle                text,
  description             text,
  hero_image_url          text,
  hero_image_alt          text,
  hero_image_crop_settings jsonb DEFAULT '{}'::jsonb,
  hero_layout             text DEFAULT 'default',
  cta_label               text,
  cta_url                 text,
  cta_external            boolean DEFAULT false,
  settings                jsonb DEFAULT '{}'::jsonb,
  is_active               boolean DEFAULT true,
  sort_order              int DEFAULT 0,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════════════════
-- 2. Add columns if they don't exist (safe re-run)
-- ══════════════════════════════════════════════════════
ALTER TABLE page_settings
  ADD COLUMN IF NOT EXISTS hero_image_crop_settings jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_layout  text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS cta_external boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS settings     jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sort_order   int DEFAULT 0;

-- ══════════════════════════════════════════════════════
-- 3. updated_at trigger
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_page_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_page_settings_updated_at ON page_settings;
CREATE TRIGGER trg_page_settings_updated_at
  BEFORE UPDATE ON page_settings
  FOR EACH ROW EXECUTE FUNCTION update_page_settings_updated_at();

-- ══════════════════════════════════════════════════════
-- 4. RLS
-- ══════════════════════════════════════════════════════
ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active page_settings" ON page_settings;
CREATE POLICY "Public read active page_settings"
  ON page_settings FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage page_settings" ON page_settings;
CREATE POLICY "Admin manage page_settings"
  ON page_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'website_admin')
        AND profiles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'website_admin')
        AND profiles.is_active = true
    )
  );

-- ══════════════════════════════════════════════════════
-- 5. Seed initial page keys with proper Thai content
--    (DO NOTHING = safe re-run, ไม่ overwrite ค่าที่ admin เคยแก้)
-- ══════════════════════════════════════════════════════
INSERT INTO page_settings
  (page_key, title, subtitle, description, is_active, sort_order)
VALUES
  ('home',
   'หน้าแรก',
   'สาขาวิชาเทคโนโลยีคอมพิวเตอร์',
   NULL,
   true, 0),

  ('apply',
   'สมัครเรียนกับเรา ก้าวเข้าสู่โลก IT',
   'ปีการศึกษา 2568',
   'ครบทุกขั้นตอน คุณสมบัติ เอกสาร และรอบรับสมัคร พร้อมคำตอบสำหรับคำถามที่พบบ่อย เพื่อให้คุณสมัครได้อย่างราบรื่น',
   true, 1),

  ('about',
   'สาขาวิชาเทคโนโลยีคอมพิวเตอร์',
   'เกี่ยวกับสาขา',
   'สาขาที่มุ่งสร้างบัณฑิตที่พร้อมก้าวสู่โลกดิจิทัล ด้วยการเรียนรู้แบบลงมือทำจริง พร้อมเครือข่ายอาจารย์และพันธมิตรในอุตสาหกรรม',
   true, 2),

  ('contact',
   'คุยกับเราได้ทุกช่องทาง',
   'ติดต่อเรา',
   'มีคำถามเรื่องสมัครเรียน หลักสูตร หรือเรื่องอื่น ๆ? ทีมงานของเราพร้อมตอบทุกข้อสงสัย',
   true, 3),

  ('programs_bachelor',
   'หลักสูตรปริญญาตรี',
   'ปริญญาตรี',
   'หลักสูตรที่เน้นทักษะปฏิบัติจริง ครอบคลุม Software, Data, Network และ AI',
   true, 4),

  ('programs_master',
   'หลักสูตรปริญญาโท',
   'ปริญญาโท',
   'หลักสูตรระดับบัณฑิตศึกษา เน้นการวิจัยและพัฒนานวัตกรรมด้านเทคโนโลยีคอมพิวเตอร์',
   true, 5),

  ('students_registration',
   'ทะเบียนนักศึกษา',
   'งานทะเบียน',
   'รวมลิงก์และข้อมูลสำคัญสำหรับนักศึกษา ครอบคลุมเรื่องลงทะเบียน เพิ่มถอน ผลการเรียน และคำร้องต่าง ๆ',
   true, 6),

  ('students_registrar',
   'งานทะเบียน',
   'งานทะเบียน',
   'บริการงานทะเบียนสำหรับนักศึกษา ครอบคลุมการลงทะเบียน คำร้อง และเอกสารทางการศึกษา',
   true, 7),

  ('students_loan',
   'ข้อมูล กยศ. สำหรับนักศึกษา',
   'กองทุนเงินให้กู้ยืมเพื่อการศึกษา',
   'ขั้นตอน เอกสาร และวันสำคัญ พร้อมลิงก์ไปยังระบบ กยศ. ของมหาวิทยาลัย',
   true, 8),

  ('students_welfare',
   'สวัสดิการและสิ่งอำนวยความสะดวก',
   'ดูแลนักศึกษา',
   'ทุน ห้องแล็บ คำปรึกษา และพื้นที่ทำงานนอกห้องเรียน ทุกอย่างที่ช่วยให้คุณเรียนรู้ได้เต็มที่',
   true, 9),

  ('students_feedback',
   'ความคิดเห็น และข้อเสนอแนะ',
   'ความคิดเห็นนักศึกษา',
   'เสียงของนักศึกษาช่วยพัฒนาสาขา ร่วมแสดงความคิดเห็นเพื่อสร้างประสบการณ์การเรียนที่ดีขึ้น',
   true, 10),

  ('students_complaint',
   'เสียงของคุณช่วยให้เราดีขึ้น',
   'ร้องเรียน / ความคิดเห็น',
   'ส่งข้อร้องเรียน เสนอแนะ หรือสะท้อนปัญหาที่พบ เราอ่านทุกเรื่อง ขอบคุณที่กล้าสะท้อนมา',
   true, 11)

ON CONFLICT (page_key) DO NOTHING;

COMMENT ON TABLE page_settings IS
  'Round 39: Practical Page CMS — per-page title/subtitle/description/hero image/CTA settings.';
