-- Supabase SQL Editor usage:
-- Run supabase/schema.sql first, then run this seed file.

truncate table
  complaints,
  news,
  teacher_works,
  student_works,
  programs,
  staff_members,
  page_sections,
  pages,
  hero_slides,
  site_settings,
  media_assets
restart identity cascade;

insert into site_settings (
  site_name, faculty_name, university_name, logo_url, phone, email, address,
  facebook_url, line_url, theme
) values (
  'สาขาวิชาเทคโนโลยีสารสนเทศ',
  'คณะวิทยาศาสตร์และเทคโนโลยี',
  'มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี',
  '/placeholders/program-placeholder.svg',
  '0-2549-4167',
  'it-demo@rmutt.ac.th',
  '39 หมู่ 1 ตำบลคลองหก อำเภอธัญบุรี จังหวัดปทุมธานี',
  'https://facebook.com/rmutt-it-demo',
  '@rmutt-it-demo',
  '{
    "primaryColor": "#f97316",
    "secondaryColor": "#0f172a",
    "accentColor": "#fb923c",
    "backgroundColor": "#020617",
    "textColor": "#f8fafc",
    "navbarColor": "#020617",
    "footerColor": "#0f172a",
    "buttonColor": "#ea580c",
    "heroOverlayColor": "rgba(2, 6, 23, 0.72)"
  }'::jsonb
);

insert into hero_slides (
  title, subtitle, description, image_url, image_alt,
  primary_button_text, primary_button_url, secondary_button_text, secondary_button_url,
  right_items, sort_order, is_active, settings
) values
('ก้าวสู่สายเทคโนโลยีสารสนเทศกับ RMUTT', 'เปิดรับสมัครนักศึกษาใหม่', 'หลักสูตรที่เน้นการเรียนรู้จากงานจริง เชื่อมโยงเทคโนโลยี ธุรกิจ และนวัตกรรม', '/placeholders/hero-1.svg', 'Hero Banner 1', 'สมัครเรียน', '/apply', 'ดูหลักสูตร', '/programs/bachelor', '["Project-based Learning", "Modern IT Skills"]'::jsonb, 1, true, '{"overlay":"dark-orange"}'::jsonb),
('สร้างผลงานจริงตั้งแต่ในห้องเรียน', 'ผลงานและนวัตกรรม', 'ฝึกคิด วิเคราะห์ ออกแบบ และพัฒนาระบบจริงเพื่อเตรียมพร้อมสู่การทำงาน', '/placeholders/hero-2.svg', 'Hero Banner 2', 'ชมผลงานนักศึกษา', '/works/students', 'เกี่ยวกับสาขา', '/about', '["Portfolio", "Teamwork"]'::jsonb, 2, true, '{"overlay":"navy-orange"}'::jsonb),
('เรียนใกล้ทีมผู้สอน พร้อมเครือข่ายมหาวิทยาลัย', 'คณะวิทยาศาสตร์และเทคโนโลยี', 'พื้นที่การเรียนรู้สำหรับคนรุ่นใหม่ด้านซอฟต์แวร์ ข้อมูล เครือข่าย และระบบดิจิทัล', '/placeholders/hero-3.svg', 'Hero Banner 3', 'ติดต่อสอบถาม', '/about/contact', 'ดูบุคลากร', '/about/staff', '["Advisor", "Community"]'::jsonb, 3, true, '{"overlay":"slate-orange"}'::jsonb),
('เลือกเส้นทางเรียนที่ต่อยอดสู่สายงานดิจิทัล', 'หลักสูตรเทคโนโลยีสารสนเทศ', 'สำรวจหลักสูตรและแนวทางการเรียนสำหรับงานซอฟต์แวร์ ข้อมูล และระบบองค์กร', '/placeholders/hero-4.svg', 'Hero Banner 4', 'ดูหลักสูตร', '/programs/bachelor', 'สมัครเรียน', '/apply', '["Bachelor", "Master"]'::jsonb, 4, true, '{"overlay":"dark-gray-orange"}'::jsonb);

insert into pages (slug, title, description, status) values
('home', 'หน้าแรก', 'หน้าแรกของเว็บไซต์สาขา', 'published'),
('apply', 'สมัครเรียน', 'ข้อมูลการสมัครเรียน', 'published'),
('about', 'เกี่ยวกับสาขา', 'ข้อมูลภาพรวมของสาขา', 'published'),
('staff', 'บุคลากร', 'รายชื่อบุคลากร', 'published'),
('contact', 'ติดต่อ', 'ช่องทางติดต่อสาขา', 'published'),
('bachelor', 'หลักสูตรปริญญาตรี', 'ข้อมูลหลักสูตรระดับปริญญาตรี', 'published'),
('master', 'หลักสูตรปริญญาโท', 'ข้อมูลหลักสูตรระดับปริญญาโท', 'published'),
('student-works', 'ผลงานนักศึกษา', 'ผลงานตัวอย่างของนักศึกษา', 'published'),
('teacher-works', 'ผลงานอาจารย์', 'ผลงานตัวอย่างของอาจารย์', 'published'),
('registrar', 'ทะเบียน', 'ข้อมูลบริการทะเบียน', 'published'),
('loan', 'กยศ.', 'ข้อมูลกองทุนเงินให้กู้ยืมเพื่อการศึกษา', 'published'),
('welfare', 'สวัสดิการ', 'ข้อมูลสวัสดิการนักศึกษา', 'published'),
('feedback', 'ร้องเรียน/ความคิดเห็น', 'ช่องทางรับเรื่องร้องเรียนและความคิดเห็น', 'published');

insert into page_sections (
  page_id, section_key, section_type, title, subtitle, body, image_url, image_alt,
  button_text, button_url, sort_order, is_active, settings
)
select p.id, v.section_key, v.section_type, v.title, v.subtitle, v.body, v.image_url, v.image_alt,
  v.button_text, v.button_url, v.sort_order, true, '{}'::jsonb
from (
  values
  ('home','hero','hero','แบนเนอร์หน้าแรก','เปิดรับสมัคร','ภาพรวมสาขาและเส้นทางการเรียน','/placeholders/hero-1.svg','Hero Banner','สมัครเรียน','/apply',1),
  ('home','features','grid','จุดเด่นของสาขา','เรียนจริง ทำจริง','เน้นทักษะที่ใช้ได้จริงในงานดิจิทัล','/placeholders/about-placeholder.svg','About',null,null,2),
  ('home','programs','cards','หลักสูตรที่เปิดสอน','ปริญญาตรีและปริญญาโท','ข้อมูลหลักสูตรตัวอย่างสำหรับเว็บไซต์','/placeholders/program-placeholder.svg','Program','ดูหลักสูตร','/programs/bachelor',3),
  ('home','works','cards','ผลงานเด่น','ผลงานนักศึกษา','ตัวอย่างโปรเจกต์จากรายวิชาและกิจกรรม','/placeholders/student-work-placeholder.svg','Student Work','ดูผลงาน','/works/students',4),
  ('home','news','cards','ข่าวล่าสุด','ประกาศและกิจกรรม','ข่าวสารตัวอย่างของสาขา','/placeholders/news-placeholder.svg','News',null,null,5),
  ('apply','overview','content','ภาพรวมการสมัคร','ข้อมูลทดสอบ','รายละเอียดขั้นตอนการสมัครเรียนเบื้องต้น','/placeholders/program-placeholder.svg','Program',null,null,1),
  ('apply','requirements','list','คุณสมบัติผู้สมัคร','ตรวจสอบก่อนสมัคร','เงื่อนไขตัวอย่างสำหรับผู้สมัคร','/placeholders/about-placeholder.svg','About',null,null,2),
  ('apply','timeline','timeline','กำหนดการสมัคร','รอบรับสมัคร','กำหนดการจำลองสำหรับทดสอบระบบ','/placeholders/news-placeholder.svg','News',null,null,3),
  ('apply','contact','cta','สอบถามการสมัคร','ติดต่อเจ้าหน้าที่','ช่องทางสอบถามข้อมูลการสมัคร','/placeholders/staff-placeholder.svg','Staff','ติดต่อ','/about/contact',4),
  ('about','intro','content','เกี่ยวกับสาขา','วิสัยทัศน์และพันธกิจ','ข้อมูลจำลองเกี่ยวกับสาขาวิชา','/placeholders/about-placeholder.svg','About',null,null,1),
  ('about','learning','content','แนวทางการเรียน','Project-based Learning','เรียนรู้จากโจทย์จริงและการทำงานเป็นทีม','/placeholders/student-work-placeholder.svg','Student Work',null,null,2),
  ('about','facilities','content','ห้องปฏิบัติการ','พื้นที่เรียนรู้','พื้นที่ทดลองและเรียนรู้ด้านเทคโนโลยี','/placeholders/hero-3.svg','Campus',null,null,3),
  ('about','network','content','เครือข่ายความร่วมมือ','อุตสาหกรรมและชุมชน','เชื่อมโยงการเรียนกับโลกการทำงาน','/placeholders/hero-4.svg','Network',null,null,4),
  ('contact','map','content','ที่ตั้งสาขา','ข้อมูลทดสอบ','ที่อยู่และแผนที่สำหรับติดต่อ','/placeholders/about-placeholder.svg','About',null,null,1),
  ('contact','channels','list','ช่องทางติดต่อ','โทรศัพท์ อีเมล และโซเชียล','ข้อมูลติดต่อจำลองของสาขา','/placeholders/news-placeholder.svg','News',null,null,2),
  ('contact','form','form','แบบฟอร์มติดต่อ','ส่งข้อความถึงสาขา','แบบฟอร์มติดต่อสำหรับทดสอบ','/placeholders/staff-placeholder.svg','Staff','ส่งข้อความ','/about/contact',3),
  ('registrar','services','list','บริการทะเบียน','เอกสารและคำร้อง','ข้อมูลบริการทะเบียนจำลอง','/placeholders/news-placeholder.svg','News',null,null,1),
  ('registrar','calendar','content','ปฏิทินการศึกษา','กำหนดการสำคัญ','ข้อมูลกำหนดการตัวอย่าง','/placeholders/hero-2.svg','Calendar',null,null,2),
  ('registrar','downloads','list','ดาวน์โหลดเอกสาร','แบบฟอร์มคำร้อง','ลิงก์เอกสารจำลอง','/placeholders/program-placeholder.svg','Program',null,null,3),
  ('loan','overview','content','ข้อมูล กยศ.','ทุนกู้ยืมเพื่อการศึกษา','ข้อมูลจำลองสำหรับนักศึกษา','/placeholders/about-placeholder.svg','About',null,null,1),
  ('loan','steps','list','ขั้นตอนดำเนินการ','ยื่นคำขอและติดตามผล','ขั้นตอนตัวอย่างสำหรับทดสอบ','/placeholders/news-placeholder.svg','News',null,null,2),
  ('loan','contact','cta','ติดต่อผู้รับผิดชอบ','สอบถามข้อมูลเพิ่มเติม','ช่องทางติดต่อจำลอง','/placeholders/staff-placeholder.svg','Staff',null,null,3),
  ('welfare','overview','content','สวัสดิการนักศึกษา','บริการสนับสนุน','ข้อมูลสวัสดิการจำลอง','/placeholders/about-placeholder.svg','About',null,null,1),
  ('welfare','activities','grid','กิจกรรมนักศึกษา','พัฒนาทักษะและชุมชน','กิจกรรมตัวอย่างของสาขา','/placeholders/student-work-placeholder.svg','Student Work',null,null,2),
  ('welfare','support','content','การช่วยเหลือ','คำปรึกษาและแนะแนว','ข้อมูลสนับสนุนนักศึกษาจำลอง','/placeholders/staff-placeholder.svg','Staff',null,null,3),
  ('feedback','intro','content','ร้องเรียน/ความคิดเห็น','ข้อมูลทดสอบ','ช่องทางรับฟังความคิดเห็นและเรื่องร้องเรียน','/placeholders/news-placeholder.svg','News',null,null,1),
  ('feedback','form','form','ส่งเรื่องถึงสาขา','ติดตามด้วยรหัสเรื่อง','แบบฟอร์มจำลองสำหรับทดสอบ','/placeholders/about-placeholder.svg','About','ส่งเรื่อง','/students/complaint',2)
) as v(slug, section_key, section_type, title, subtitle, body, image_url, image_alt, button_text, button_url, sort_order)
join pages p on p.slug = v.slug;

insert into staff_members (full_name, position, role_type, education, expertise, email, phone, office, image_url, image_alt, bio, sort_order, is_active) values
('ดร.อนันต์ ทดสอบดี', 'หัวหน้าสาขาวิชา', 'ผู้บริหารสาขา', 'Ph.D. Information Technology', array['Software Engineering','Digital Transformation'], 'anant.demo@rmutt.ac.th', '0-2549-1001', 'IT-401', '/placeholders/staff-placeholder.svg', 'Staff', 'ข้อมูลบุคลากรจำลองสำหรับทดสอบ', 1, true),
('ผศ.ดร.กานต์ จำลองผล', 'อาจารย์ประจำ', 'อาจารย์ประจำ', 'Ph.D. Computer Science', array['AI','Data Analytics'], 'kan.demo@rmutt.ac.th', '0-2549-1002', 'IT-402', '/placeholders/staff-placeholder.svg', 'Staff', 'ข้อมูลบุคลากรจำลองสำหรับทดสอบ', 2, true),
('อ.มณี ระบบดี', 'อาจารย์ประจำ', 'อาจารย์ประจำ', 'M.Sc. Information Systems', array['Web Application','UX/UI'], 'manee.demo@rmutt.ac.th', '0-2549-1003', 'IT-403', '/placeholders/staff-placeholder.svg', 'Staff', 'ข้อมูลบุคลากรจำลองสำหรับทดสอบ', 3, true),
('อ.ปริญญา เครือข่าย', 'อาจารย์ประจำ', 'อาจารย์ประจำ', 'M.Eng. Computer Engineering', array['Network','Cloud'], 'parinya.demo@rmutt.ac.th', '0-2549-1004', 'IT-404', '/placeholders/staff-placeholder.svg', 'Staff', 'ข้อมูลบุคลากรจำลองสำหรับทดสอบ', 4, true),
('ดร.สุชาดา ข้อมูล', 'อาจารย์ประจำ', 'อาจารย์ประจำ', 'Ph.D. Data Science', array['Database','Business Intelligence'], 'suchada.demo@rmutt.ac.th', '0-2549-1005', 'IT-405', '/placeholders/staff-placeholder.svg', 'Staff', 'ข้อมูลบุคลากรจำลองสำหรับทดสอบ', 5, true),
('อ.ธนพล ไอโอที', 'อาจารย์ประจำ', 'อาจารย์ประจำ', 'M.Sc. Embedded Systems', array['IoT','Mobile Application'], 'thanapon.demo@rmutt.ac.th', '0-2549-1006', 'IT-406', '/placeholders/staff-placeholder.svg', 'Staff', 'ข้อมูลบุคลากรจำลองสำหรับทดสอบ', 6, true),
('คุณนภา ประสานงาน', 'เจ้าหน้าที่บริหารงานทั่วไป', 'เจ้าหน้าที่', 'B.B.A. Management', array['Administration','Student Support'], 'napa.demo@rmutt.ac.th', '0-2549-1007', 'IT-301', '/placeholders/staff-placeholder.svg', 'Staff', 'ข้อมูลเจ้าหน้าที่จำลองสำหรับทดสอบ', 7, true),
('คุณวรินทร์ เอกสาร', 'เจ้าหน้าที่งานวิชาการ', 'เจ้าหน้าที่', 'B.A. Information Management', array['Academic Service','Documentation'], 'warin.demo@rmutt.ac.th', '0-2549-1008', 'IT-302', '/placeholders/staff-placeholder.svg', 'Staff', 'ข้อมูลเจ้าหน้าที่จำลองสำหรับทดสอบ', 8, true);

insert into programs (level, title, degree_name, duration, credits, description, image_url, image_alt, curriculum_url, details, is_active) values
('bachelor', 'เทคโนโลยีสารสนเทศ', 'วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ', '4 ปี', 120, 'หลักสูตรปริญญาตรีจำลอง เน้นซอฟต์แวร์ ข้อมูล เครือข่าย และระบบดิจิทัล', '/placeholders/program-placeholder.svg', 'Program', '#', '{"tracks":["Software","Data","Network"]}'::jsonb, true),
('master', 'เทคโนโลยีสารสนเทศประยุกต์', 'วิทยาศาสตรมหาบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศประยุกต์', '2 ปี', 36, 'หลักสูตรปริญญาโทจำลอง เน้นการประยุกต์ใช้เทคโนโลยีและงานวิจัย', '/placeholders/program-placeholder.svg', 'Program', '#', '{"tracks":["Applied IT","Research"]}'::jsonb, true);

insert into student_works (title, description, category, academic_year, work_type, course_id, course_name, students, advisor_name, technologies, image_url, image_alt, pdf_url, pdf_filename, project_url, external_url, source_type, source_system, sort_order, is_featured, is_active, slug) values
('ระบบจองห้องปฏิบัติการออนไลน์', 'เว็บแอปสำหรับจองและจัดการห้องเรียนจำลอง', 'Web Application', '2567', 'final_project', null, null, array['นักศึกษาทดสอบ 01','นักศึกษาทดสอบ 02'], 'อ.มณี ระบบดี', array['Next.js','PostgreSQL'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'lab-booking-final-project.pdf', '#', '#', 'internal', null, 1, true, true, 'lab-booking-system'),
('ระบบติดตามฝึกงานนักศึกษา', 'ระบบรายงานความก้าวหน้าการฝึกงานจำลอง', 'Web Application', '2567', 'final_project', null, null, array['นักศึกษาทดสอบ 03','นักศึกษาทดสอบ 04'], 'ดร.อนันต์ ทดสอบดี', array['React','Supabase'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'internship-tracking-final-project.pdf', '#', '#', 'internal', null, 2, true, true, 'internship-tracking-system'),
('แอปแจ้งเตือนตารางเรียน', 'โมบายแอปแจ้งเตือนกิจกรรมและตารางเรียน', 'Mobile Application', '2567', 'final_project', null, null, array['นักศึกษาทดสอบ 05'], 'อ.ธนพล ไอโอที', array['Flutter','Firebase'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'class-notification-final-project.pdf', '#', '#', 'internal', null, 3, false, true, 'class-notification-app'),
('แอปนำทางภายในอาคารเรียน', 'ต้นแบบแอปช่วยค้นหาห้องเรียนและบริการ', 'Mobile Application', '2566', 'final_project', null, null, array['นักศึกษาทดสอบ 06','นักศึกษาทดสอบ 07'], 'อ.ปริญญา เครือข่าย', array['React Native','Maps'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'building-navigation-final-project.pdf', '#', '#', 'internal', null, 4, false, true, 'building-navigation-app'),
('แดชบอร์ดวิเคราะห์ผลการเรียน', 'ระบบวิเคราะห์ข้อมูลนักศึกษาเพื่อช่วยวางแผนการเรียน', 'AI/Data', '2567', 'final_project', null, null, array['นักศึกษาทดสอบ 08','นักศึกษาทดสอบ 09'], 'ดร.สุชาดา ข้อมูล', array['Python','Power BI'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'learning-analytics-final-project.pdf', '#', '#', 'internal', null, 5, true, true, 'learning-analytics-dashboard'),
('โมเดลจำแนกคำร้องเรียน', 'ต้นแบบ AI สำหรับจัดหมวดหมู่ข้อความ', 'AI/Data', '2566', 'final_project', null, null, array['นักศึกษาทดสอบ 10'], 'ผศ.ดร.กานต์ จำลองผล', array['Python','NLP'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'complaint-classification-final-project.pdf', '#', '#', 'internal', null, 6, false, true, 'complaint-classification-model'),
('ระบบตรวจวัดสภาพห้องเรียน IoT', 'อุปกรณ์ตรวจวัดอุณหภูมิและคุณภาพอากาศจำลอง', 'IoT', '2567', 'final_project', null, null, array['นักศึกษาทดสอบ 11','นักศึกษาทดสอบ 12'], 'อ.ธนพล ไอโอที', array['ESP32','MQTT'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'classroom-iot-final-project.pdf', '#', '#', 'internal', null, 7, true, true, 'classroom-iot-monitoring'),
('ต้นแบบ UX/UI เว็บสมัครเรียน', 'ออกแบบประสบการณ์ผู้ใช้สำหรับระบบรับสมัคร', 'UX/UI Design', '2567', 'final_project', null, null, array['นักศึกษาทดสอบ 13'], 'อ.มณี ระบบดี', array['Figma','Design System'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'admission-uxui-final-project.pdf', '#', '#', 'internal', null, 8, false, true, 'admission-uxui-prototype'),
('ระบบจัดการกิจกรรมนักศึกษา', 'เว็บแอปจัดการกิจกรรมและการเข้าร่วมของนักศึกษา', 'Web Application', '2566', 'final_project', null, null, array['นักศึกษาทดสอบ 14','นักศึกษาทดสอบ 15'], 'ดร.อนันต์ ทดสอบดี', array['Laravel','MySQL'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'student-activity-final-project.pdf', '#', '#', 'internal', null, 9, false, true, 'student-activity-management'),
('เว็บไซต์แนะนำสถานที่ท่องเที่ยวชุมชน', 'ผลงานรายวิชาการพัฒนาเว็บยุคใหม่สำหรับนำเสนอข้อมูลชุมชนแบบ responsive', 'Course Work', '2567', 'course', '09-142-306', 'การพัฒนาเว็บยุคใหม่', array['นักศึกษาทดสอบ 16','นักศึกษาทดสอบ 17'], 'อ.มณี ระบบดี', array['HTML','CSS','JavaScript'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'course-09-142-306-community-tourism.pdf', '#', '#', 'internal', null, 10, false, true, 'course-09-142-306-community-tourism-2567'),
('ระบบร้านค้าออนไลน์ขนาดเล็ก', 'ผลงานรายวิชาการพัฒนาเว็บยุคใหม่สำหรับฝึกออกแบบหน้าร้านและตะกร้าสินค้า', 'Course Work', '2566', 'course', '09-142-306', 'การพัฒนาเว็บยุคใหม่', array['นักศึกษาทดสอบ 18','นักศึกษาทดสอบ 19'], 'อ.มณี ระบบดี', array['React','Tailwind CSS'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'course-09-142-306-mini-shop.pdf', '#', '#', 'internal', null, 11, false, true, 'course-09-142-306-mini-shop-2566'),
('ฐานข้อมูลระบบยืมคืนอุปกรณ์', 'ผลงานรายวิชาระบบจัดการฐานข้อมูลสำหรับออกแบบ ERD และ query ระบบยืมคืนอุปกรณ์', 'Course Work', '2567', 'course', '09-142-205', 'ระบบจัดการฐานข้อมูล', array['นักศึกษาทดสอบ 20','นักศึกษาทดสอบ 21'], 'ดร.สุชาดา ข้อมูล', array['PostgreSQL','SQL'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'course-09-142-205-equipment-loan.pdf', '#', '#', 'internal', null, 12, false, true, 'course-09-142-205-equipment-loan-2567'),
('ต้นแบบแชตบอตตอบคำถามสาขา', 'ผลงานรายวิชาปัญญาประดิษฐ์เบื้องต้นสำหรับทดลอง rule-based chatbot', 'Course Work', '2567', 'course', '412410', 'ปัญญาประดิษฐ์เบื้องต้น', array['นักศึกษาทดสอบ 22','นักศึกษาทดสอบ 23'], 'ผศ.ดร.กานต์ จำลองผล', array['Python','NLP'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'course-412410-department-chatbot.pdf', '#', '#', 'internal', null, 13, false, true, 'course-412410-department-chatbot-2567'),
('ระบบนัดหมายอาจารย์ที่ปรึกษา', 'ตัวอย่างโปรเจกต์จบสำหรับจัดการเวลานัดหมายและประวัติการให้คำปรึกษา', 'Final Project', '2567', 'final_project', null, null, array['นักศึกษาทดสอบ 24','นักศึกษาทดสอบ 25'], 'ดร.อนันต์ ทดสอบดี', array['Next.js','Supabase'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'advisor-appointment-final-project.pdf', '#', '#', 'internal', null, 14, true, true, 'advisor-appointment-final-project-2567'),
('ระบบบริหารคลังสื่อการสอน', 'ตัวอย่างโปรเจกต์จบสำหรับจัดเก็บ ค้นหา และเผยแพร่สื่อการสอนของสาขา', 'Final Project', '2566', 'final_project', null, null, array['นักศึกษาทดสอบ 26','นักศึกษาทดสอบ 27'], 'อ.ปริญญา เครือข่าย', array['Laravel','MySQL'], '/placeholders/student-work-placeholder.svg', 'Student Work', '/mockups/student-works/sample-student-work.pdf', 'learning-media-repository-final-project.pdf', '#', '#', 'internal', null, 15, false, true, 'learning-media-repository-final-project-2566');

insert into teacher_works (title, description, category, year, teacher_name, image_url, image_alt, project_url, external_url, source_type, source_system, is_featured, is_active) values
('การพัฒนาระบบแนะนำรายวิชาด้วยข้อมูลการเรียน', 'งานวิจัยจำลองด้านระบบแนะนำ', 'งานวิจัย', '2567', 'ผศ.ดร.กานต์ จำลองผล', '/placeholders/teacher-work-placeholder.svg', 'Teacher Work', '#', '#', 'internal', null, true, true),
('แพลตฟอร์มเรียนรู้แบบผสมผสานสำหรับรายวิชา IT', 'งานวิจัยจำลองด้านการเรียนการสอน', 'งานวิจัย', '2566', 'ดร.อนันต์ ทดสอบดี', '/placeholders/teacher-work-placeholder.svg', 'Teacher Work', '#', '#', 'internal', null, false, true),
('แนวทางออกแบบ UX สำหรับระบบบริการนักศึกษา', 'บทความวิชาการจำลอง', 'บทความวิชาการ', '2567', 'อ.มณี ระบบดี', '/placeholders/teacher-work-placeholder.svg', 'Teacher Work', '#', '#', 'internal', null, true, true),
('การประยุกต์ใช้ Cloud สำหรับระบบงานสาขา', 'บทความวิชาการจำลอง', 'บทความวิชาการ', '2566', 'อ.ปริญญา เครือข่าย', '/placeholders/teacher-work-placeholder.svg', 'Teacher Work', '#', '#', 'internal', null, false, true),
('รางวัลนวัตกรรมการเรียนรู้ดิจิทัล', 'ข้อมูลรางวัลจำลองของบุคลากร', 'รางวัล', '2567', 'ดร.สุชาดา ข้อมูล', '/placeholders/teacher-work-placeholder.svg', 'Teacher Work', '#', '#', 'internal', null, true, true),
('รางวัลผลงานบริการวิชาการดีเด่น', 'ข้อมูลรางวัลจำลอง', 'รางวัล', '2566', 'อ.ธนพล ไอโอที', '/placeholders/teacher-work-placeholder.svg', 'Teacher Work', '#', '#', 'internal', null, false, true),
('โครงการอบรมทักษะเว็บแอปให้ชุมชน', 'โครงการบริการวิชาการจำลอง', 'โครงการบริการวิชาการ', '2567', 'อ.มณี ระบบดี', '/placeholders/teacher-work-placeholder.svg', 'Teacher Work', '#', '#', 'internal', null, true, true),
('โครงการยกระดับระบบข้อมูลสำหรับหน่วยงานท้องถิ่น', 'โครงการบริการวิชาการจำลอง', 'โครงการบริการวิชาการ', '2566', 'ดร.อนันต์ ทดสอบดี', '/placeholders/teacher-work-placeholder.svg', 'Teacher Work', '#', '#', 'internal', null, false, true);

insert into news (title, excerpt, content, category, image_url, image_alt, status, published_at) values
('ประกาศรับสมัครนักศึกษาใหม่ ปีการศึกษา 2568', 'ข่าวประชาสัมพันธ์จำลองสำหรับการรับสมัคร', 'เนื้อหาข่าวทดสอบ ไม่ใช่ข้อมูลจริง', 'รับสมัคร', '/placeholders/news-placeholder.svg', 'News', 'published', now() - interval '10 days'),
('กิจกรรมปฐมนิเทศนักศึกษาใหม่', 'ข้อมูลกิจกรรมจำลองของสาขา', 'เนื้อหาข่าวทดสอบ ไม่ใช่ข้อมูลจริง', 'กิจกรรม', '/placeholders/news-placeholder.svg', 'News', 'published', now() - interval '8 days'),
('อบรมพื้นฐาน Git และ Web Development', 'ข่าวอบรมจำลอง', 'เนื้อหาข่าวทดสอบ ไม่ใช่ข้อมูลจริง', 'อบรม', '/placeholders/news-placeholder.svg', 'News', 'published', now() - interval '6 days'),
('นักศึกษานำเสนอผลงานปลายภาค', 'ข่าวผลงานนักศึกษาจำลอง', 'เนื้อหาข่าวทดสอบ ไม่ใช่ข้อมูลจริง', 'ผลงาน', '/placeholders/news-placeholder.svg', 'News', 'published', now() - interval '3 days'),
('ร่างประกาศตารางกิจกรรมเดือนหน้า', 'ข่าวฉบับร่างสำหรับทดสอบ', 'เนื้อหาข่าวทดสอบ ไม่ใช่ข้อมูลจริง', 'กิจกรรม', '/placeholders/news-placeholder.svg', 'News', 'draft', null),
('ร่างข่าวความร่วมมือกับหน่วยงานภายนอก', 'ข่าวฉบับร่างสำหรับทดสอบ', 'เนื้อหาข่าวทดสอบ ไม่ใช่ข้อมูลจริง', 'ความร่วมมือ', '/placeholders/news-placeholder.svg', 'News', 'draft', null);

insert into complaints (tracking_code, complaint_type, title, detail, sender_name, student_id, email, phone, want_contact, attachment_url, status, assigned_to, internal_note) values
('TEST-CP-0001', 'suggestion', 'ข้อมูลทดสอบ: เสนอปรับปรุงหน้าเว็บ', 'รายการนี้เป็นข้อมูลทดสอบสำหรับระบบรับเรื่อง', 'ผู้ทดสอบ 01', 'TEST001', 'test01@example.com', '0800000001', true, null, 'new', null, 'ข้อมูลจำลอง'),
('TEST-CP-0002', 'complaint', 'ข้อมูลทดสอบ: ปัญหาการใช้งานแบบฟอร์ม', 'รายการนี้เป็นข้อมูลทดสอบสำหรับระบบรับเรื่อง', 'ผู้ทดสอบ 02', 'TEST002', 'test02@example.com', null, false, null, 'in_progress', 'เจ้าหน้าที่ทดสอบ', 'ข้อมูลจำลอง'),
('TEST-CP-0003', 'question', 'ข้อมูลทดสอบ: สอบถามกำหนดการ', 'รายการนี้เป็นข้อมูลทดสอบสำหรับระบบรับเรื่อง', null, null, 'test03@example.com', null, true, null, 'new', null, 'ข้อมูลจำลอง'),
('TEST-CP-0004', 'suggestion', 'ข้อมูลทดสอบ: เสนอเพิ่มข่าวประชาสัมพันธ์', 'รายการนี้เป็นข้อมูลทดสอบสำหรับระบบรับเรื่อง', 'ผู้ทดสอบ 04', 'TEST004', null, '0800000004', false, null, 'resolved', 'เจ้าหน้าที่ทดสอบ', 'ข้อมูลจำลอง'),
('TEST-CP-0005', 'complaint', 'ข้อมูลทดสอบ: แจ้งข้อมูลไม่ถูกต้อง', 'รายการนี้เป็นข้อมูลทดสอบสำหรับระบบรับเรื่อง', 'ผู้ทดสอบ 05', 'TEST005', 'test05@example.com', '0800000005', true, null, 'new', null, 'ข้อมูลจำลอง');

insert into media_assets (file_name, file_url, file_type, alt_text, source) values
('hero-1.svg', '/placeholders/hero-1.svg', 'image/svg+xml', 'Hero Banner', 'placeholder'),
('hero-2.svg', '/placeholders/hero-2.svg', 'image/svg+xml', 'Hero Banner', 'placeholder'),
('hero-3.svg', '/placeholders/hero-3.svg', 'image/svg+xml', 'Hero Banner', 'placeholder'),
('hero-4.svg', '/placeholders/hero-4.svg', 'image/svg+xml', 'Hero Banner', 'placeholder'),
('staff-placeholder.svg', '/placeholders/staff-placeholder.svg', 'image/svg+xml', 'Staff', 'placeholder'),
('student-work-placeholder.svg', '/placeholders/student-work-placeholder.svg', 'image/svg+xml', 'Student Work', 'placeholder'),
('teacher-work-placeholder.svg', '/placeholders/teacher-work-placeholder.svg', 'image/svg+xml', 'Teacher Work', 'placeholder'),
('news-placeholder.svg', '/placeholders/news-placeholder.svg', 'image/svg+xml', 'News', 'placeholder'),
('program-placeholder.svg', '/placeholders/program-placeholder.svg', 'image/svg+xml', 'Program', 'placeholder'),
('about-placeholder.svg', '/placeholders/about-placeholder.svg', 'image/svg+xml', 'About', 'placeholder');
