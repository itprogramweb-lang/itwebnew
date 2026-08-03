select
  'indexes' as section,
  schemaname as table_schema,
  tablename as table_name,
  indexname as index_name,
  indexdef as index_definition
from pg_indexes
where schemaname in ('public', 'auth')
order by schemaname, tablename, indexname;