-- Round 41: Per-user backend permission overrides.
-- This migration only creates storage for future app logic. It is not applied automatically.
-- Effective permission behavior will be implemented in app code later:
--   base role permissions + allow overrides - deny overrides.
-- App logic must ensure super_admin always keeps all permissions and cannot be reduced by deny overrides.

create table if not exists user_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  permission text not null,
  effect text not null check (effect in ('allow', 'deny')),
  created_by uuid references profiles(id) on delete set null,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_permission_overrides_user_permission_key unique (user_id, permission),
  constraint user_permission_overrides_permission_check check (
    permission in (
      'view_dashboard',
      'manage_users',
      'manage_permissions',
      'manage_hero_slides',
      'manage_staff',
      'manage_programs',
      'manage_news',
      'manage_works',
      'manage_student_works',
      'manage_teacher_works',
      'manage_settings',
      'manage_complaints',
      'view_complaints',
      'view_all_complaints',
      'view_own_complaints',
      'change_complaint_status_all',
      'change_complaint_status_partial',
      'manage_registration',
      'manage_loan',
      'manage_welfare',
      'edit_own_teacher_works',
      'edit_advised_student_works',
      'view_own_profile',
      'manage_pages'
    )
  )
);

comment on table user_permission_overrides is
  'Per-user backend permission allow/deny overrides. Effective permission helper is implemented in app code later.';
comment on column user_permission_overrides.permission is
  'Permission key. Whitelist must stay aligned with src/lib/permissions.ts allPermissions; manage_permissions is reserved for the next app round.';
comment on column user_permission_overrides.effect is
  'allow adds a permission to a user; deny removes a permission for non-super_admin users.';

create table if not exists user_permission_audit_logs (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references profiles(id) on delete cascade,
  actor_user_id uuid references profiles(id) on delete set null,
  action text not null check (
    action in (
      'add_override',
      'update_override',
      'remove_override',
      'bulk_replace_overrides'
    )
  ),
  permission text check (
    permission is null or permission in (
      'view_dashboard',
      'manage_users',
      'manage_permissions',
      'manage_hero_slides',
      'manage_staff',
      'manage_programs',
      'manage_news',
      'manage_works',
      'manage_student_works',
      'manage_teacher_works',
      'manage_settings',
      'manage_complaints',
      'view_complaints',
      'view_all_complaints',
      'view_own_complaints',
      'change_complaint_status_all',
      'change_complaint_status_partial',
      'manage_registration',
      'manage_loan',
      'manage_welfare',
      'edit_own_teacher_works',
      'edit_advised_student_works',
      'view_own_profile',
      'manage_pages'
    )
  ),
  previous_effect text check (previous_effect is null or previous_effect in ('allow', 'deny')),
  new_effect text check (new_effect is null or new_effect in ('allow', 'deny')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table user_permission_audit_logs is
  'Audit log for changes to per-user permission overrides.';

create index if not exists idx_user_permission_overrides_user_id
  on user_permission_overrides(user_id);
create index if not exists idx_user_permission_overrides_permission
  on user_permission_overrides(permission);
create index if not exists idx_user_permission_audit_logs_target_user_id
  on user_permission_audit_logs(target_user_id);
create index if not exists idx_user_permission_audit_logs_actor_user_id
  on user_permission_audit_logs(actor_user_id);
create index if not exists idx_user_permission_audit_logs_created_at
  on user_permission_audit_logs(created_at desc);

drop trigger if exists user_permission_overrides_updated_at on user_permission_overrides;
create trigger user_permission_overrides_updated_at
  before update on user_permission_overrides
  for each row execute function update_updated_at_column();

alter table user_permission_overrides enable row level security;
alter table user_permission_audit_logs enable row level security;

-- Direct client access is intentionally strict.
-- Users cannot read or edit their own permission overrides.
-- Future admin APIs may use the service role, but RLS still protects direct client reads/writes.

drop policy if exists "Super admins can read permission overrides" on user_permission_overrides;
create policy "Super admins can read permission overrides"
  on user_permission_overrides for select
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
        and profiles.is_active = true
    )
  );

drop policy if exists "Super admins can insert permission overrides" on user_permission_overrides;
create policy "Super admins can insert permission overrides"
  on user_permission_overrides for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
        and profiles.is_active = true
    )
  );

drop policy if exists "Super admins can update permission overrides" on user_permission_overrides;
create policy "Super admins can update permission overrides"
  on user_permission_overrides for update
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
        and profiles.is_active = true
    )
  )
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
        and profiles.is_active = true
    )
  );

drop policy if exists "Super admins can delete permission overrides" on user_permission_overrides;
create policy "Super admins can delete permission overrides"
  on user_permission_overrides for delete
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
        and profiles.is_active = true
    )
  );

drop policy if exists "Super admins can read permission audit logs" on user_permission_audit_logs;
create policy "Super admins can read permission audit logs"
  on user_permission_audit_logs for select
  using (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
        and profiles.is_active = true
    )
  );

drop policy if exists "Super admins can insert permission audit logs" on user_permission_audit_logs;
create policy "Super admins can insert permission audit logs"
  on user_permission_audit_logs for insert
  with check (
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
        and profiles.is_active = true
    )
  );
