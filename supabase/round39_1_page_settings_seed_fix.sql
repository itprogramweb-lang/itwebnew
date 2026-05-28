-- round39_1_page_settings_seed_fix.sql
-- ใช้แก้ DB ที่เคย seed ข้อความมั่วจาก Round 39
-- Rerun-safe: ทุก UPDATE มี WHERE guard
-- ไม่แตะ hero_image_url, hero_image_crop_settings, cta_label, cta_url, settings

-- ================================================================
-- A. แก้ title ที่ผิดพลาด
--    UPDATE เฉพาะแถวที่ title ยังตรงกับ seed เดิมที่ผิด
-- ================================================================

UPDATE page_settings
SET title = 'งานทะเบียน'
WHERE page_key = 'students_registrar'
  AND title = 'งานทะเบียน (alias)';

UPDATE page_settings
SET title = 'ข้อมูล กยศ. สำหรับนักศึกษา'
WHERE page_key = 'students_loan'
  AND title = 'กยศ.';

UPDATE page_settings
SET title = 'สมัครเรียนกับเรา ก้าวเข้าสู่โลก IT'
WHERE page_key = 'apply'
  AND title = 'สมัครเรียน';

UPDATE page_settings
SET title = 'สาขาวิชาเทคโนโลยีคอมพิวเตอร์'
WHERE page_key = 'about'
  AND title = 'เกี่ยวกับสาขา';

UPDATE page_settings
SET title = 'คุยกับเราได้ทุกช่องทาง'
WHERE page_key = 'contact'
  AND title = 'ติดต่อสาขา';

UPDATE page_settings
SET title = 'สวัสดิการและสิ่งอำนวยความสะดวก'
WHERE page_key = 'students_welfare'
  AND title = 'สวัสดิการนักศึกษา';

UPDATE page_settings
SET title = 'เสียงของคุณช่วยให้เราดีขึ้น'
WHERE page_key = 'students_complaint'
  AND title = 'ร้องเรียน / ความคิดเห็น';

UPDATE page_settings
SET title = 'ความคิดเห็น และข้อเสนอแนะ'
WHERE page_key = 'students_feedback'
  AND title IN ('ความคิดเห็น/ข้อเสนอแนะ', 'ความคิดเห็น / ข้อเสนอแนะ');

-- ================================================================
-- B. เพิ่ม subtitle (eyebrow) ที่ขาดหายไป
--    UPDATE เฉพาะแถวที่ subtitle ยัง NULL
-- ================================================================

UPDATE page_settings
SET subtitle = 'สาขาวิชาเทคโนโลยีคอมพิวเตอร์'
WHERE page_key = 'home'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'ปีการศึกษา 2568'
WHERE page_key = 'apply'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'เกี่ยวกับสาขา'
WHERE page_key = 'about'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'ติดต่อเรา'
WHERE page_key = 'contact'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'ปริญญาตรี'
WHERE page_key = 'programs_bachelor'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'ปริญญาโท'
WHERE page_key = 'programs_master'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'งานทะเบียน'
WHERE page_key = 'students_registration'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'งานทะเบียน'
WHERE page_key = 'students_registrar'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'กองทุนเงินให้กู้ยืมเพื่อการศึกษา'
WHERE page_key = 'students_loan'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'ดูแลนักศึกษา'
WHERE page_key = 'students_welfare'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'ความคิดเห็นนักศึกษา'
WHERE page_key = 'students_feedback'
  AND subtitle IS NULL;

UPDATE page_settings
SET subtitle = 'ร้องเรียน / ความคิดเห็น'
WHERE page_key = 'students_complaint'
  AND subtitle IS NULL;

-- ================================================================
-- C. เพิ่ม description ที่ขาดหายไป
--    UPDATE เฉพาะแถวที่ description ยัง NULL
-- ================================================================

UPDATE page_settings
SET description = 'ครบทุกขั้นตอน คุณสมบัติ เอกสาร และรอบรับสมัคร พร้อมคำตอบสำหรับคำถามที่พบบ่อย เพื่อให้คุณสมัครได้อย่างราบรื่น'
WHERE page_key = 'apply'
  AND description IS NULL;

UPDATE page_settings
SET description = 'สาขาที่มุ่งสร้างบัณฑิตที่พร้อมก้าวสู่โลกดิจิทัล ด้วยการเรียนรู้แบบลงมือทำจริง พร้อมเครือข่ายอาจารย์และพันธมิตรในอุตสาหกรรม'
WHERE page_key = 'about'
  AND description IS NULL;

UPDATE page_settings
SET description = 'มีคำถามเรื่องสมัครเรียน หลักสูตร หรือเรื่องอื่น ๆ? ทีมงานของเราพร้อมตอบทุกข้อสงสัย'
WHERE page_key = 'contact'
  AND description IS NULL;

UPDATE page_settings
SET description = 'หลักสูตรที่เน้นทักษะปฏิบัติจริง ครอบคลุม Software, Data, Network และ AI'
WHERE page_key = 'programs_bachelor'
  AND description IS NULL;

UPDATE page_settings
SET description = 'หลักสูตรระดับบัณฑิตศึกษา เน้นการวิจัยและพัฒนานวัตกรรมด้านเทคโนโลยีคอมพิวเตอร์'
WHERE page_key = 'programs_master'
  AND description IS NULL;

UPDATE page_settings
SET description = 'รวมลิงก์และข้อมูลสำคัญสำหรับนักศึกษา ครอบคลุมเรื่องลงทะเบียน เพิ่มถอน ผลการเรียน และคำร้องต่าง ๆ'
WHERE page_key = 'students_registration'
  AND description IS NULL;

UPDATE page_settings
SET description = 'บริการงานทะเบียนสำหรับนักศึกษา ครอบคลุมการลงทะเบียน คำร้อง และเอกสารทางการศึกษา'
WHERE page_key = 'students_registrar'
  AND description IS NULL;

UPDATE page_settings
SET description = 'ขั้นตอน เอกสาร และวันสำคัญ พร้อมลิงก์ไปยังระบบ กยศ. ของมหาวิทยาลัย'
WHERE page_key = 'students_loan'
  AND description IS NULL;

UPDATE page_settings
SET description = 'ทุน ห้องแล็บ คำปรึกษา และพื้นที่ทำงานนอกห้องเรียน ทุกอย่างที่ช่วยให้คุณเรียนรู้ได้เต็มที่'
WHERE page_key = 'students_welfare'
  AND description IS NULL;

UPDATE page_settings
SET description = 'เสียงของนักศึกษาช่วยพัฒนาสาขา ร่วมแสดงความคิดเห็นเพื่อสร้างประสบการณ์การเรียนที่ดีขึ้น'
WHERE page_key = 'students_feedback'
  AND description IS NULL;

UPDATE page_settings
SET description = 'ส่งข้อร้องเรียน เสนอแนะ หรือสะท้อนปัญหาที่พบ เราอ่านทุกเรื่อง ขอบคุณที่กล้าสะท้อนมา'
WHERE page_key = 'students_complaint'
  AND description IS NULL;
