select
  'rls_policies' as section,
  schemaname as table_schema,
  tablename as table_name,
  policyname as policy_name,
  permissive,
  roles,
  cmd as command
from pg_policies
where schemaname in ('public', 'auth')
order by schemaname, tablename, policyname;