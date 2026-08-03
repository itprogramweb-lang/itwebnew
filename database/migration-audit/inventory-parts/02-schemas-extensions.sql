with relevant_schemas as (
  select nspname as schema_name
  from pg_namespace
  where nspname in ('public', 'auth', 'storage')
), installed_extensions as (
  select extname as extension_name, extversion as extension_version
  from pg_extension
)
select
  'schemas_extensions' as section,
  'schema' as item_type,
  schema_name as item_name,
  null::text as detail_1,
  null::text as detail_2
from relevant_schemas
union all
select
  'schemas_extensions' as section,
  'extension' as item_type,
  extension_name as item_name,
  extension_version as detail_1,
  null::text as detail_2
from installed_extensions
order by item_type, item_name;