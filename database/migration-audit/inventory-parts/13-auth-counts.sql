with auth_counts as (
  select 'auth.users'::text as object_name, count(*)::bigint as row_count from auth.users
  union all
  select 'auth.identities'::text as object_name, count(*)::bigint as row_count from auth.identities
  union all
  select 'auth.sessions'::text as object_name,
         case
           when to_regclass('auth.sessions') is null then null
           else coalesce((
             xpath('/row/c/text()', query_to_xml('select count(*) as c from auth.sessions', true, true, ''))
           )[1]::text::bigint, 0)
         end as row_count
)
select
  'auth_counts' as section,
  object_name,
  row_count
from auth_counts
order by object_name;