-- round34_branding_settings.sql
-- เพิ่ม branding fields ใน site_settings สำหรับรอบ 34
-- วิธีรัน: paste ใน Supabase SQL Editor แล้ว Run

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS brand_name           text,
  ADD COLUMN IF NOT EXISTS brand_short_name     text,
  ADD COLUMN IF NOT EXISTS department_name_th   text,
  ADD COLUMN IF NOT EXISTS department_name_en   text,
  ADD COLUMN IF NOT EXISTS university_name_th   text,
  ADD COLUMN IF NOT EXISTS university_name_en   text,
  ADD COLUMN IF NOT EXISTS logo_alt             text,
  ADD COLUMN IF NOT EXISTS logo_desktop_size    integer DEFAULT 44,
  ADD COLUMN IF NOT EXISTS logo_mobile_size     integer DEFAULT 40,
  ADD COLUMN IF NOT EXISTS logo_crop_preset     text    DEFAULT 'square-contain',
  ADD COLUMN IF NOT EXISTS logo_object_position text    DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS show_logo            boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_brand_name      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS loan_external_url    text    DEFAULT 'https://sd.rmutt.ac.th/?page_id=2274';

-- ตั้งค่า default ให้ row ที่มีอยู่แล้ว
UPDATE site_settings SET
  brand_name         = COALESCE(brand_name,         site_name,         'Computer Technology'),
  brand_short_name   = COALESCE(brand_short_name,   'CT'),
  department_name_th = COALESCE(department_name_th, site_name,         'สาขาวิชาเทคโนโลยีคอมพิวเตอร์'),
  department_name_en = COALESCE(department_name_en, 'Computer Technology'),
  university_name_th = COALESCE(university_name_th, university_name,   'มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี'),
  university_name_en = COALESCE(university_name_en, 'Rajamangala University of Technology Thanyaburi'),
  logo_alt           = COALESCE(logo_alt,           'โลโก้สาขา'),
  logo_crop_preset   = COALESCE(logo_crop_preset,   'square-contain'),
  logo_object_position = COALESCE(logo_object_position, 'center'),
  loan_external_url  = COALESCE(loan_external_url,  'https://sd.rmutt.ac.th/?page_id=2274');
