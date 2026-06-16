-- round43_seed_footer_contact_items.sql
-- Seed default Footer contact items.
-- Prerequisite: run supabase/round42_footer_contact_navigation.sql first.
-- This file is idempotent and does not delete or overwrite existing rows.

insert into navigation_items (
  label,
  label_en,
  href,
  type,
  parent_id,
  sort_order,
  is_active,
  is_external,
  is_core,
  location,
  target,
  description,
  description_en
)
select
  seed.label,
  seed.label_en,
  seed.href,
  'link',
  null,
  seed.sort_order,
  true,
  false,
  false,
  'footer_contact',
  '_self',
  null,
  null
from (
  values
    (
      'เลขที่ 39 หมู่ 1 ถนนรังสิต-นครนายก ตำบลคลองหก อำเภอธัญบุรี จังหวัดปทุมธานี 12110',
      '39 Moo 1 Rangsit-Nakhon Nayok Road, Khlong Hok, Thanyaburi, Pathum Thani 12110',
      null::text,
      1
    ),
    (
      '0-2549-4167',
      '0-2549-4167',
      'tel:025494167',
      2
    ),
    (
      'จันทร์ - ศุกร์ เวลา 08:30 - 16:30 น.',
      'Monday - Friday, 08:30 - 16:30',
      null::text,
      3
    )
) as seed(label, label_en, href, sort_order)
where not exists (
  select 1
  from navigation_items existing
  where existing.location = 'footer_contact'
    and existing.label = seed.label
);
