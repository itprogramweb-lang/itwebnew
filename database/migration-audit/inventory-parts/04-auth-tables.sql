select
  'auth_tables' as section,
  table_name
from information_schema.tables
where table_schema = 'auth'
  and table_type = 'BASE TABLE'
order by table_name;