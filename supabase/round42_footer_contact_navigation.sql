-- round42_footer_contact_navigation.sql
-- Add Footer contact items to the existing navigation_items system.
-- Run manually after deploying code. This migration does not seed production data.

alter table navigation_items
  drop constraint if exists navigation_items_location_check;

alter table navigation_items
  add constraint navigation_items_location_check
  check (location in ('navbar', 'footer_main', 'footer_students', 'footer_contact', 'both'));

alter table navigation_items
  drop constraint if exists navigation_items_link_href_check;

alter table navigation_items
  add constraint navigation_items_link_href_check
  check (
    type <> 'link'
    or location = 'footer_contact'
    or nullif(btrim(href), '') is not null
  );
