-- เพิ่มช่องเก็บไฟล์ PDF สำหรับผลงานอาจารย์
-- ใช้สำหรับเก็บ path ใน Cloudflare R2 และชื่อไฟล์ดาวน์โหลด
-- ไม่ลบข้อมูลเดิม และไม่เปลี่ยน project_url / external_url

alter table teacher_works
  add column if not exists pdf_url text;

alter table teacher_works
  add column if not exists pdf_filename text;

comment on column teacher_works.pdf_url is 'Path หรือ URL ของไฟล์ PDF ผลงานอาจารย์ใน Cloudflare R2';
comment on column teacher_works.pdf_filename is 'ชื่อไฟล์ PDF สำหรับดาวน์โหลดผลงานอาจารย์';
