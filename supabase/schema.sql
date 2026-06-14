-- Supabase SQL Editor usage:
-- 1) Run this file first to create schema, indexes, triggers, and RLS policies.
-- 2) Run supabase/seed.sql after this file to insert sample data.

create extension if not exists pgcrypto;

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text not null default 'student' check (role in ('super_admin', 'website_admin', 'teacher', 'staff', 'student')),
  is_active boolean not null default true,
  avatar_url text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text,
  faculty_name text,
  university_name text,
  logo_url text,
  phone text,
  email text,
  address text,
  facebook_url text,
  line_url text,
  theme jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  image_url text,
  image_alt text,
  primary_button_text text,
  primary_button_url text,
  secondary_button_text text,
  secondary_button_url text,
  right_items jsonb default '[]',
  sort_order int default 0,
  is_active boolean default true,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  status text default 'published',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  title text,
  subtitle text,
  body text,
  image_url text,
  image_alt text,
  image_caption text,
  button_text text,
  button_url text,
  sort_order int default 0,
  is_active boolean default true,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists staff_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  position text,
  role_type text,
  education text,
  expertise text[],
  email text,
  phone text,
  office text,
  image_url text,
  image_alt text,
  bio text,
  user_id uuid NULL,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  title text not null,
  degree_name text,
  duration text,
  credits int,
  description text,
  image_url text,
  image_alt text,
  curriculum_url text,
  details jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists student_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  academic_year text,
  work_type text not null default 'final_project' check (work_type in ('course', 'final_project', 'competition')),
  course_id text,
  course_name text,
  students text[],
  advisor_name text,
  technologies text[],
  image_url text,
  image_alt text,
  pdf_url text,
  pdf_filename text,
  project_url text,
  external_url text NULL,
  source_type text default 'internal',
  source_system text NULL,
  sort_order int default 0,
  is_featured boolean default false,
  is_active boolean default true,
  slug text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists teacher_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  year text,
  teacher_name text,
  image_url text,
  image_alt text,
  project_url text,
  external_url text NULL,
  source_type text default 'internal',
  source_system text NULL,
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  content text,
  category text,
  image_url text,
  image_alt text,
  status text default 'draft',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique,
  complaint_type text,
  title text not null,
  detail text not null,
  sender_name text NULL,
  student_id text NULL,
  email text NULL,
  phone text NULL,
  want_contact boolean default false,
  attachment_url text NULL,
  status text default 'new',
  assigned_to text NULL,
  internal_note text NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text,
  file_url text not null,
  file_type text,
  alt_text text,
  source text default 'placeholder',
  created_at timestamptz default now()
);

create index if not exists idx_pages_slug on pages(slug);
create index if not exists idx_hero_slides_is_active on hero_slides(is_active);
create index if not exists idx_hero_slides_sort_order on hero_slides(sort_order);
create index if not exists idx_staff_members_is_active on staff_members(is_active);
create index if not exists idx_programs_level on programs(level);
create index if not exists idx_student_works_category on student_works(category);
create index if not exists idx_student_works_is_featured on student_works(is_featured);
create index if not exists idx_student_works_work_type on student_works(work_type);
create index if not exists idx_student_works_course_id on student_works(course_id);
create index if not exists idx_student_works_academic_year on student_works(academic_year);
create index if not exists idx_student_works_work_type_year on student_works(work_type, academic_year);
create index if not exists idx_teacher_works_category on teacher_works(category);
create index if not exists idx_teacher_works_is_featured on teacher_works(is_featured);
create index if not exists idx_news_status on news(status);
create index if not exists idx_complaints_status on complaints(status);

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at_column();
drop trigger if exists site_settings_updated_at on site_settings;
create trigger site_settings_updated_at before update on site_settings for each row execute function update_updated_at_column();
drop trigger if exists hero_slides_updated_at on hero_slides;
create trigger hero_slides_updated_at before update on hero_slides for each row execute function update_updated_at_column();
drop trigger if exists pages_updated_at on pages;
create trigger pages_updated_at before update on pages for each row execute function update_updated_at_column();
drop trigger if exists page_sections_updated_at on page_sections;
create trigger page_sections_updated_at before update on page_sections for each row execute function update_updated_at_column();
drop trigger if exists staff_members_updated_at on staff_members;
create trigger staff_members_updated_at before update on staff_members for each row execute function update_updated_at_column();
drop trigger if exists programs_updated_at on programs;
create trigger programs_updated_at before update on programs for each row execute function update_updated_at_column();
drop trigger if exists student_works_updated_at on student_works;
create trigger student_works_updated_at before update on student_works for each row execute function update_updated_at_column();
drop trigger if exists teacher_works_updated_at on teacher_works;
create trigger teacher_works_updated_at before update on teacher_works for each row execute function update_updated_at_column();
drop trigger if exists news_updated_at on news;
create trigger news_updated_at before update on news for each row execute function update_updated_at_column();
drop trigger if exists complaints_updated_at on complaints;
create trigger complaints_updated_at before update on complaints for each row execute function update_updated_at_column();

alter table profiles enable row level security;
alter table site_settings enable row level security;
alter table hero_slides enable row level security;
alter table pages enable row level security;
alter table page_sections enable row level security;
alter table staff_members enable row level security;
alter table programs enable row level security;
alter table student_works enable row level security;
alter table teacher_works enable row level security;
alter table news enable row level security;
alter table complaints enable row level security;
alter table media_assets enable row level security;

create policy "Public can read active profiles" on profiles for select using (is_active = true);
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Public can read site settings" on site_settings for select using (true);
create policy "Public can read active hero slides" on hero_slides for select using (is_active = true);
create policy "Public can read published pages" on pages for select using (status = 'published');
create policy "Public can read active page sections" on page_sections for select using (
  is_active = true and exists (
    select 1 from pages where pages.id = page_sections.page_id and pages.status = 'published'
  )
);
create policy "Public can read active staff members" on staff_members for select using (is_active = true);
create policy "Public can read active programs" on programs for select using (is_active = true);
create policy "Public can read active student works" on student_works for select using (is_active = true);
create policy "Public can read active teacher works" on teacher_works for select using (is_active = true);
create policy "Public can read published news" on news for select using (status = 'published');
create policy "Public can insert complaints" on complaints for insert with check (true);
create policy "Public can read placeholder media" on media_assets for select using (source = 'placeholder');

create policy "Super admins can manage profiles" on profiles for all using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');
create policy "Admins can manage site settings" on site_settings for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can manage hero slides" on hero_slides for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can manage pages" on pages for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can manage page sections" on page_sections for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can manage staff members" on staff_members for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can manage programs" on programs for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can manage student works" on student_works for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can manage teacher works" on teacher_works for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can manage news" on news for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
create policy "Admins can read complaints" on complaints for select using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin', 'staff'));
create policy "Admins can manage complaints" on complaints for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('super_admin', 'staff')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('super_admin', 'staff'));
create policy "Admins can manage media assets" on media_assets for all using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin')) with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('website_admin', 'super_admin'));
