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
  'table_counts' as section,
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