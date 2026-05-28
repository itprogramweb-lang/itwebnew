-- Round 25.4: RLS hardening to use public.profiles.role as the primary role source.
-- Run this once in Supabase SQL Editor after round23_auth_roles.sql.
-- Public read policies and public complaint insert policy are intentionally left unchanged.

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1
$$;

drop policy if exists "Super admins can manage profiles" on profiles;
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

create policy "Super admins can manage profiles" on profiles for all
  using (public.current_profile_role() = 'super_admin')
  with check (public.current_profile_role() = 'super_admin');

create policy "Admins can manage site settings" on site_settings for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can manage hero slides" on hero_slides for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can manage pages" on pages for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can manage page sections" on page_sections for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can manage staff members" on staff_members for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can manage programs" on programs for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can manage student works" on student_works for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can manage teacher works" on teacher_works for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can manage news" on news for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));

create policy "Admins can read complaints" on complaints for select
  using (public.current_profile_role() in ('website_admin', 'super_admin', 'staff'));

create policy "Admins can manage complaints" on complaints for all
  using (public.current_profile_role() in ('super_admin', 'staff'))
  with check (public.current_profile_role() in ('super_admin', 'staff'));

create policy "Admins can manage media assets" on media_assets for all
  using (public.current_profile_role() in ('website_admin', 'super_admin'))
  with check (public.current_profile_role() in ('website_admin', 'super_admin'));
