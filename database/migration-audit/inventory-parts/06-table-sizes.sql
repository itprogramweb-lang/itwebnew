select
  'table_sizes' as section,
  schemaname as table_schema,
  relname as table_name,
  pg_total_relation_size(format('%I.%I', schemaname, relname)) as total_bytes,
  pg_size_pretty(pg_total_relation_size(format('%I.%I', schemaname, relname))) as total_size
from pg_stat_user_tables
where schemaname in ('public', 'auth')
order by pg_total_relation_size(format('%I.%I', schemaname, relname)) desc, schemaname, relname;