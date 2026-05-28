-- ใช้ตรวจสอบและ backfill ผลงานนักศึกษาเดิมหลังเพิ่มโครงสร้าง Course Works / Final Projects
-- ไฟล์นี้ไม่ลบข้อมูล ไม่บังคับใส่ PDF และไม่เดาปีการศึกษาให้รายการที่ไม่มีปี

-- ตรวจสอบผลงานนักศึกษาทั้งหมดก่อน backfill
select id, title, slug, academic_year, work_type, pdf_url, is_active
from student_works
order by created_at desc;

-- ดูรายการเดิมที่ยังไม่มีประเภทผลงานหรือปีการศึกษา
select id, title, slug, academic_year, work_type
from student_works
where work_type is null
   or academic_year is null
   or academic_year = '';

-- ดูรายการที่ยังไม่มี PDF เพื่อยืนยันว่าเป็นสถานะที่ระบบรองรับได้
select id, title, slug, academic_year, work_type, pdf_url
from student_works
where pdf_url is null
   or pdf_url = '';

-- ตั้งค่าผลงานเดิมที่ยังไม่มีประเภทให้เป็นโปรเจกต์จบ
update student_works
set work_type = 'final_project'
where work_type is null;

-- ถ้ารายการใดไม่มีปีการศึกษา ให้ผู้ดูแลกรอกปีที่ถูกต้องเองใน Dashboard หรือ SQL Editor
-- ไม่ควร update academic_year แบบเหมารวม เพราะปีการศึกษาเป็นข้อมูลเชิงเนื้อหาของแต่ละผลงาน
