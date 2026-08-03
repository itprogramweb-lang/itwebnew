with table_info as (
  select
    to_regclass('public.learning_facilities') is not null as exists_in_public_schema,
    case
      when to_regclass('public.learning_facilities') is null then null
      else coalesce((
        xpath('/row/c/text()', query_to_xml('select count(*) as c from public.learning_facilities', true, true, ''))
      )[1]::text::bigint, 0)
    end as row_count
), columns_meta as (
  select
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    column_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'learning_facilities'
), constraint_meta as (
  select
    tc.constraint_type,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as column_list,
    max(ccu.table_schema) as foreign_table_schema,
    max(ccu.table_name) as foreign_table_name,
    string_agg(ccu.column_name, ', ' order by ccu.column_name) as foreign_column_list
  from information_schema.table_constraints tc
  left join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
   and tc.table_name = kcu.table_name
  left join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name
   and ccu.constraint_schema = tc.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'learning_facilities'
    and tc.constraint_type in ('PRIMARY KEY', 'UNIQUE', 'FOREIGN KEY')
  group by tc.constraint_type, tc.constraint_name
), rls_meta as (
  select
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'learning_facilities'
    and c.relkind = 'r'
), policy_meta as (
  select
    policyname,
    permissive,
    roles,
    cmd
  from pg_policies
  where schemaname = 'public'
    and tablename = 'learning_facilities'
)
select
  'learning_facilities_metadata' as section,
  'table_status' as item_type,
  'public.learning_facilities' as item_name,
  case when exists_in_public_schema then 'exists' else 'missing' end as detail_1,
  coalesce(row_count::text, 'null') as detail_2,
  null::text as detail_3,
  null::text as detail_4
from table_info
union all
select
  'learning_facilities_metadata' as section,
  'column' as item_type,
  column_name as item_name,
  data_type as detail_1,
  is_nullable as detail_2,
  coalesce(column_default, 'null') as detail_3,
  ordinal_position::text as detail_4
from columns_meta
union all
select
  'learning_facilities_metadata' as section,
  lower(replace(constraint_type, ' ', '_')) as item_type,
  constraint_name as item_name,
  coalesce(column_list, '') as detail_1,
  coalesce(foreign_table_schema, '') as detail_2,
  coalesce(foreign_table_name, '') as detail_3,
  coalesce(foreign_column_list, '') as detail_4
from constraint_meta
union all
select
  'learning_facilities_metadata' as section,
  'rls' as item_type,
  'public.learning_facilities' as item_name,
  rls_enabled::text as detail_1,
  rls_forced::text as detail_2,
  null::text as detail_3,
  null::text as detail_4
from rls_meta
union all
select
  'learning_facilities_metadata' as section,
  'policy' as item_type,
  policyname as item_name,
  permissive as detail_1,
  array_to_string(roles, ', ') as detail_2,
  cmd as detail_3,
  null::text as detail_4
from policy_meta
order by item_type, item_name;