-- READ-ONLY verification script for manual execution on the self-hosted Candidate after restore.
-- Allowed statements: SELECT only.

select 'server_version' as section, version() as value;

select 'schemas' as section, nspname as schema_name
from pg_namespace
where nspname in ('public', 'auth', 'storage')
order by nspname;

select 'extensions' as section, extname as extension_name, extversion as extension_version
from pg_extension
order by extname;

select 'tables_public' as section, table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
order by table_name;

select 'tables_auth' as section, table_name
from information_schema.tables
where table_schema = 'auth' and table_type = 'BASE TABLE'
order by table_name;

with target_tables(table_schema, table_name) as (
  values
    ('public', 'profiles'),
    ('public', 'site_settings'),
    ('public', 'hero_slides'),
    ('public', 'pages'),
    ('public', 'page_sections'),
    ('public', 'staff_members'),
    ('public', 'programs'),
    ('public', 'student_works'),
    ('public', 'teacher_works'),
    ('public', 'news'),
    ('public', 'complaints'),
    ('public', 'media_assets'),
    ('public', 'courses'),
    ('public', 'user_permission_overrides'),
    ('public', 'user_permission_audit_logs'),
    ('public', 'user_line_connections'),
    ('public', 'line_oauth_states'),
    ('public', 'line_news_drafts'),
    ('public', 'line_webhook_events'),
    ('public', 'line_ai_usage_logs'),
    ('public', 'learning_facilities')
)
select
  'row_counts' as section,
  table_schema,
  table_name,
  case
    when to_regclass(format('%I.%I', table_schema, table_name)) is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), true, true, ''))
    )[1]::text::bigint, 0)
  end as row_count
from target_tables
order by table_schema, table_name;

select 'auth_aggregate_counts' as section, 'auth.users' as object_name, count(*) as row_count
from auth.users
union all
select 'auth_aggregate_counts' as section, 'auth.identities' as object_name, count(*) as row_count
from auth.identities;

select 'learning_facilities_existence' as section, to_regclass('public.learning_facilities') is not null as exists_in_public_schema;

select
  'rls_state' as section,
  n.nspname as table_schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r' and n.nspname in ('public', 'auth')
order by n.nspname, c.relname;

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

select
  'functions' as section,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_function_result(p.oid) as returns
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'auth')
order by n.nspname, p.proname, pg_get_function_identity_arguments(p.oid);

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

select
  'foreign_keys' as section,
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.constraint_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema in ('public', 'auth')
order by tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position;

select
  'integrity_auth_users_without_profiles' as check_name,
  case
    when to_regclass('auth.users') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from auth.users u
        left join public.profiles p on p.id = u.id
        where p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'integrity_profiles_without_auth_users' as check_name,
  case
    when to_regclass('auth.users') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.profiles p
        left join auth.users u on u.id = p.id
        where u.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'integrity_line_news_drafts_published_news_missing' as check_name,
  case
    when to_regclass('public.line_news_drafts') is null or to_regclass('public.news') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.line_news_drafts d
        left join public.news n on n.id = d.published_news_id
        where d.published_news_id is not null and n.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;