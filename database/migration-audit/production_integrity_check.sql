-- READ-ONLY aggregate integrity checks for manual Production execution.
-- Allowed statements: SELECT only.

select
  'auth_users_without_profiles' as check_name,
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
  'profiles_without_auth_users' as check_name,
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
  'staff_members_user_id_without_profiles' as check_name,
  case
    when to_regclass('public.staff_members') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.staff_members s
        left join public.profiles p on p.id = s.user_id
        where s.user_id is not null and p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'user_permission_overrides_without_profiles' as check_name,
  case
    when to_regclass('public.user_permission_overrides') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.user_permission_overrides o
        left join public.profiles p on p.id = o.user_id
        where p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'user_permission_audit_logs_actor_without_profiles' as check_name,
  case
    when to_regclass('public.user_permission_audit_logs') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.user_permission_audit_logs a
        left join public.profiles p on p.id = a.actor_user_id
        where a.actor_user_id is not null and p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'user_permission_audit_logs_target_without_profiles' as check_name,
  case
    when to_regclass('public.user_permission_audit_logs') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.user_permission_audit_logs a
        left join public.profiles p on p.id = a.target_user_id
        where a.target_user_id is not null and p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'user_line_connections_without_profiles' as check_name,
  case
    when to_regclass('public.user_line_connections') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.user_line_connections c
        left join public.profiles p on p.id = c.user_id
        where p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'line_oauth_states_without_profiles' as check_name,
  case
    when to_regclass('public.line_oauth_states') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.line_oauth_states s
        left join public.profiles p on p.id = s.user_id
        where p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'line_news_drafts_without_profiles' as check_name,
  case
    when to_regclass('public.line_news_drafts') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.line_news_drafts d
        left join public.profiles p on p.id = d.user_id
        where p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'line_news_drafts_published_news_missing' as check_name,
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

select
  'line_ai_usage_logs_without_profiles' as check_name,
  case
    when to_regclass('public.line_ai_usage_logs') is null or to_regclass('public.profiles') is null then null
    else coalesce((
      xpath('/row/c/text()', query_to_xml($sql$
        select count(*) as c
        from public.line_ai_usage_logs l
        left join public.profiles p on p.id = l.user_id
        where p.id is null
      $sql$, true, true, ''))
    )[1]::text::bigint, 0)
  end as issue_count;

select
  'learning_facilities_exists' as check_name,
  case when to_regclass('public.learning_facilities') is null then 0 else 1 end as issue_count;