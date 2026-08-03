select
  'triggers' as section,
  trigger_schema,
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing
from information_schema.triggers
where trigger_schema in ('public', 'auth')
order by trigger_schema, event_object_table, trigger_name;