-- round40_navigation_items.sql
-- Navigation Manager Phase 1: schema, API-ready seed data, and RLS foundation.
-- This does not connect public Navbar/MobileMenu/Footer runtime to the table.

create table if not exists navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text,
  type text not null default 'link',
  parent_id uuid references navigation_items(id) on delete restrict,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_external boolean not null default false,
  is_core boolean not null default false,
  location text not null default 'navbar',
  target text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint navigation_items_type_check check (type in ('link', 'dropdown', 'heading')),
  constraint navigation_items_location_check check (location in ('navbar', 'footer_main', 'footer_students', 'both')),
  constraint navigation_items_target_check check (target is null or target in ('_self', '_blank')),
  constraint navigation_items_link_href_check check (type <> 'link' or nullif(btrim(href), '') is not null),
  constraint navigation_items_sort_order_check check (sort_order >= 0)
);

create index if not exists idx_navigation_items_location_active_sort
  on navigation_items(location, is_active, sort_order);

create index if not exists idx_navigation_items_parent_id
  on navigation_items(parent_id);

create index if not exists idx_navigation_items_is_core
  on navigation_items(is_core);

drop trigger if exists navigation_items_updated_at on navigation_items;
create trigger navigation_items_updated_at
  before update on navigation_items
  for each row execute function update_updated_at_column();

alter table navigation_items enable row level security;

drop policy if exists "Public can read active navigation items" on navigation_items;
create policy "Public can read active navigation items"
  on navigation_items for select
  using (is_active = true);

drop policy if exists "Admins can manage navigation items" on navigation_items;
create policy "Admins can manage navigation items"
  on navigation_items for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));

insert into navigation_items
  (id, label, href, type, parent_id, sort_order, is_active, is_external, is_core, location, target, description)
values
  ('10000000-0000-4000-8000-000000000001', 'หน้าแรก', '/', 'link', null, 0, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000000002', 'สมัครเรียน', '/apply', 'link', null, 10, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000000003', 'ข่าวสาร', '/news', 'link', null, 20, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000000004', 'เกี่ยวกับสาขา', null, 'dropdown', null, 30, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000000005', 'หลักสูตร', null, 'dropdown', null, 40, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000000006', 'ผลงาน', null, 'dropdown', null, 50, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000000007', 'นักศึกษาปัจจุบัน', null, 'dropdown', null, 60, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000000101', 'เกี่ยวกับสาขา', '/about', 'link', '10000000-0000-4000-8000-000000000004', 0, true, false, true, 'navbar', null, 'วิสัยทัศน์ พันธกิจ และจุดเด่น'),
  ('10000000-0000-4000-8000-000000000102', 'บุคลากร', '/about/staff', 'link', '10000000-0000-4000-8000-000000000004', 10, true, false, true, 'navbar', null, 'อาจารย์และเจ้าหน้าที่'),
  ('10000000-0000-4000-8000-000000000103', 'อุปกรณ์การเรียนและห้องปฏิบัติการ', '/about/facilities', 'link', '10000000-0000-4000-8000-000000000004', 20, true, false, true, 'navbar', null, 'ห้องเรียน ห้องปฏิบัติการ และอุปกรณ์สนับสนุนการเรียน'),
  ('10000000-0000-4000-8000-000000000104', 'ติดต่อ', '/about/contact', 'link', '10000000-0000-4000-8000-000000000004', 30, true, false, true, 'navbar', null, 'ที่อยู่ และแผนที่'),
  ('10000000-0000-4000-8000-000000000201', 'ปริญญาตรี', '/programs/bachelor', 'link', '10000000-0000-4000-8000-000000000005', 0, true, false, true, 'navbar', null, 'หลักสูตร 4 ปี'),
  ('10000000-0000-4000-8000-000000000202', 'ปริญญาโท', '/programs/master', 'link', '10000000-0000-4000-8000-000000000005', 10, true, false, true, 'navbar', null, 'หลักสูตร 2 ปี'),
  ('10000000-0000-4000-8000-000000000301', 'ผลงานนักศึกษา', '/works/students', 'link', '10000000-0000-4000-8000-000000000006', 0, true, false, true, 'navbar', null, 'ปริญญานิพนธ์ (Thesis) และรางวัล'),
  ('10000000-0000-4000-8000-000000000302', 'ผลงานอาจารย์', '/works/teachers', 'link', '10000000-0000-4000-8000-000000000006', 10, true, false, true, 'navbar', null, 'งานวิจัยและบทความ'),
  ('10000000-0000-4000-8000-000000000401', 'ทะเบียน', '/students/registration', 'link', '10000000-0000-4000-8000-000000000007', 0, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000000402', 'กยศ.', 'https://sd.rmutt.ac.th/?page_id=2274', 'link', '10000000-0000-4000-8000-000000000007', 10, true, true, true, 'navbar', '_blank', null),
  ('10000000-0000-4000-8000-000000000403', 'สวัสดิการ', 'https://sd.rmutt.ac.th/', 'link', '10000000-0000-4000-8000-000000000007', 20, true, true, true, 'navbar', '_blank', null),
  ('10000000-0000-4000-8000-000000000404', 'ร้องเรียน/ความคิดเห็น', '/students/complaint', 'link', '10000000-0000-4000-8000-000000000007', 30, true, false, true, 'navbar', null, null),
  ('10000000-0000-4000-8000-000000001001', 'หน้าแรก', '/', 'link', null, 0, true, false, true, 'footer_main', null, null),
  ('10000000-0000-4000-8000-000000001002', 'สมัครเรียน', '/apply', 'link', null, 10, true, false, true, 'footer_main', null, null),
  ('10000000-0000-4000-8000-000000001003', 'ข่าวสาร', '/news', 'link', null, 20, true, false, true, 'footer_main', null, null),
  ('10000000-0000-4000-8000-000000001004', 'เกี่ยวกับสาขา', '/about', 'link', null, 30, true, false, true, 'footer_main', null, null),
  ('10000000-0000-4000-8000-000000001005', 'อุปกรณ์การเรียนและห้องปฏิบัติการ', '/about/facilities', 'link', null, 40, true, false, true, 'footer_main', null, null),
  ('10000000-0000-4000-8000-000000001006', 'ปริญญาตรี', '/programs/bachelor', 'link', null, 50, true, false, true, 'footer_main', null, null),
  ('10000000-0000-4000-8000-000000001007', 'ปริญญาโท', '/programs/master', 'link', null, 60, true, false, true, 'footer_main', null, null),
  ('10000000-0000-4000-8000-000000002001', 'ทะเบียน', '/students/registration', 'link', null, 0, true, false, true, 'footer_students', null, null),
  ('10000000-0000-4000-8000-000000002002', 'กยศ.', 'https://sd.rmutt.ac.th/?page_id=2274', 'link', null, 10, true, true, true, 'footer_students', '_blank', null),
  ('10000000-0000-4000-8000-000000002003', 'สวัสดิการ', '/students/welfare', 'link', null, 20, true, false, true, 'footer_students', null, null),
  ('10000000-0000-4000-8000-000000002004', 'ร้องเรียน/ความคิดเห็น', '/students/complaint', 'link', null, 30, true, false, true, 'footer_students', null, null),
  ('10000000-0000-4000-8000-000000002005', 'ผลงานนักศึกษา', '/works/students', 'link', null, 40, true, false, true, 'footer_students', null, null)
on conflict (id) do update set
  label = excluded.label,
  href = excluded.href,
  type = excluded.type,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  is_external = excluded.is_external,
  is_core = excluded.is_core,
  location = excluded.location,
  target = excluded.target,
  description = excluded.description;
