-- Round 23 migration: Supabase Auth profiles + role accounts.
-- Run this on existing Supabase projects before using /dashboard/users.

alter table profiles add column if not exists is_active boolean;
update profiles set is_active = (status = 'active') where is_active is null;
alter table profiles alter column is_active set default true;
alter table profiles alter column is_active set not null;

update profiles set role = 'website_admin' where role = 'admin';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('super_admin', 'website_admin', 'teacher', 'staff', 'student'));

alter table profiles drop constraint if exists profiles_id_auth_users_fkey;
alter table profiles
  add constraint profiles_id_auth_users_fkey
  foreign key (id) references auth.users(id) on delete cascade not valid;

drop policy if exists "Public can read active profiles" on profiles;
drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Admins can manage profiles" on profiles;
drop policy if exists "Super admins can manage profiles" on profiles;
create policy "Public can read active profiles" on profiles for select using (is_active = true);
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Super admins can manage profiles" on profiles for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

drop policy if exists "Admins can manage site settings" on site_settings;
drop policy if exists "Admins can manage hero slides" on hero_slides;
drop policy if exists "Admins can manage pages" on pages;
drop policy if exists "Admins can manage page sections" on page_sections;
drop policy if exists "Admins can manage staff members" on staff_members;
drop policy if exists "Admins can manage programs" on programs;
drop policy if exists "Admins can manage student works" on student_works;
drop policy if exists "Admins can manage teacher works" on teacher_works;
drop policy if exists "Admins can manage news" on news;
drop policy if exists "Admins can read complaints" on complaints;
drop policy if exists "Admins can manage complaints" on complaints;
drop policy if exists "Admins can manage media assets" on media_assets;

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
