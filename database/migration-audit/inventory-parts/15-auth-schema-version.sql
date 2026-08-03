with auth_schema_migrations as (
  select version::text as migration_version
  from auth.schema_migrations
), auth_users_columns as (
  select
    ordinal_position,
    column_name,
    data_type,
    is_nullable,
    coalesce(column_default, 'null') as column_default
  from information_schema.columns
  where table_schema = 'auth'
    and table_name = 'users'
)
select
  'auth_metadata' as section,
  'schema_migration' as item_type,
  migration_version as item_name,
  null::text as detail_1,
  null::text as detail_2,
  null::text as detail_3
from auth_schema_migrations
union all
select
  'auth_metadata' as section,
  'users_column' as item_type,
  column_name as item_name,
  data_type as detail_1,
  is_nullable as detail_2,
  column_default as detail_3
from auth_users_columns
order by item_type, item_name;