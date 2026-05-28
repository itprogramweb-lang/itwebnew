-- เพิ่มตารางรายวิชาสำหรับให้ระบบ Course Works อ่านจากฐานข้อมูลแทนการเก็บเฉพาะในโค้ด
-- ไฟล์นี้ปลอดภัยต่อการรันซ้ำ: ไม่ลบข้อมูลเดิม และ upsert ด้วย course_id

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  course_id text not null unique,
  course_name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_is_active on courses(is_active);
create index if not exists idx_courses_sort_order on courses(sort_order);
create index if not exists idx_courses_active_sort_order on courses(is_active, sort_order);

drop trigger if exists courses_updated_at on courses;
create trigger courses_updated_at
  before update on courses
  for each row execute function update_updated_at_column();

alter table courses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'courses'
      and policyname = 'Public can read active courses'
  ) then
    create policy "Public can read active courses"
      on courses for select
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'courses'
      and policyname = 'Admins can manage courses'
  ) then
    create policy "Admins can manage courses"
      on courses for all
      using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'))
      with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
  end if;
end $$;

-- รายวิชาจริง 37 วิชา เรียงตามลำดับ catalog ที่ใช้ในหน้า Course Works
insert into courses (course_id, course_name, sort_order, is_active) values
  ('09-142-203', 'การโปรแกรมเชิงวัตถุ', 1, true),
  ('09-142-204', 'การวิเคราะห์และออกแบบระบบสารสนเทศ', 2, true),
  ('09-142-205', 'ระบบจัดการฐานข้อมูล', 3, true),
  ('09-142-214', 'ความมั่นคงทางเทคโนโลยีสารสนเทศ', 4, true),
  ('09-142-302', 'ระบบฝังตัวและอินเทอร์เน็ตทุกสรรพสิ่ง', 5, true),
  ('09-142-306', 'การพัฒนาเว็บยุคใหม่', 6, true),
  ('09-142-313', 'สัมมนาทางเทคโนโลยีสารสนเทศ', 7, true),
  ('09-142-316', 'โครงงานด้านเทคโนโลยีสารสนเทศ 1', 8, true),
  ('09-142-321', 'การวิเคราะห์และออกแบบเครือข่าย', 9, true),
  ('09-142-325', 'การสื่อสารแบบไร้สายและระบบเคลื่อนที่สมัยใหม่', 10, true),
  ('09-142-361', 'การวิเคราะห์ข้อมูลขนาดใหญ่และการทำเหมืองข้อมูล', 11, true),
  ('09-142-364', 'การโจมตีและป้องกันภัยคุกคามทางไซเบอร์', 12, true),
  ('09-142-365', 'การสื่อสารระหว่างเซอร์วิส', 13, true),
  ('09-142-393', 'การบริหารจัดการเครื่องแม่ข่าย', 14, true),
  ('09-142-394', 'การบริหารจัดการโครงการเทคโนโลยีสารสนเทศ', 15, true),
  ('09-142-415', 'มิติทางสังคมและจริยธรรมสำหรับนักเทคโนโลยีสารสนเทศ', 16, true),
  ('09-142-417', 'โครงงานด้านเทคโนโลยีสารสนเทศ 2', 17, true),
  ('09-142-433', 'เทคโนโลยีสื่อสารโทรคมนาคม', 18, true),
  ('09-142-460', 'ปัญญาประดิษฐ์และการประยุกต์ใช้งาน', 19, true),
  ('09-142-461', 'การพัฒนาแอพพลิเคชันบนอุปกรณ์เคลื่อนที่', 20, true),
  ('09-143-301', 'การโปรแกรมสมัยใหม่', 21, true),
  ('09-143-322', 'การพัฒนาระบบงานฐานข้อมูลโดยโปรแกรมประยุกต์', 22, true),
  ('09-143-420', 'ระบบจัดการฐานข้อมูลขั้นสูง', 23, true),
  ('09-143-302', 'เครือข่ายคอมพิวเตอร์ขั้นสูง', 24, true),
  ('09-143-439', 'ระบบปฏิบัติการเครือข่าย', 25, true),
  ('09-143-497', 'การโจมตีและป้องกันภัยคุกคามทางไซเบอร์ขั้นสูง', 26, true),
  ('09-143-209', 'ปฏิสัมพันธ์ระหว่างมนุษย์และคอมพิวเตอร์', 27, true),
  ('09-143-211', 'เครือข่ายในสำนักงาน', 28, true),
  ('09-143-362', 'การเรียนรู้ด้วยเครื่องจักร', 29, true),
  ('09-144-301', 'การเตรียมความพร้อมฝึกประสบการณ์วิชาชีพทางเทคโนโลยีสารสนเทศ', 30, true),
  ('09-144-402', 'สหกิจศึกษาทางเทคโนโลยีสารสนเทศ', 31, true),
  ('09-144-403', 'สหกิจศึกษาต่างประเทศทางเทคโนโลยีสารสนเทศ', 32, true),
  ('09-144-304', 'ฝึกงานทางเทคโนโลยีสารสนเทศ', 33, true),
  ('09-144-305', 'ฝึกงานต่างประเทศทางเทคโนโลยีสารสนเทศ', 34, true),
  ('09-144-406', 'ปัญหาพิเศษจากสถานประกอบการทางเทคโนโลยีสารสนเทศ', 35, true),
  ('09-144-407', 'ประสบการณ์ต่างประเทศทางเทคโนโลยีสารสนเทศ', 36, true),
  ('09-144-408', 'การฝึกเฉพาะตำแหน่งทางเทคโนโลยีสารสนเทศ', 37, true)
on conflict (course_id) do update set
  course_name = excluded.course_name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
