-- Round 42: LINE account linking storage.
-- LINE Login is only for linking an already-authenticated website account.
-- Do not store LINE access tokens or refresh tokens in these tables.

create table if not exists user_line_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  line_user_id text not null unique,
  line_display_name text,
  line_picture_url text,
  notify_enabled boolean not null default true,
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

comment on table user_line_connections is
  'One LINE account connection per authenticated website user. Created server-side after LINE Login callback.';
comment on column user_line_connections.user_id is
  'References profiles.id, which mirrors Supabase auth.users.id in this project.';
comment on column user_line_connections.line_user_id is
  'LINE user id from LINE Login. Unique so one LINE account cannot be linked to multiple website users.';
comment on column user_line_connections.notify_enabled is
  'User preference for future LINE notifications. Complaint routing still resolves the current department head dynamically.';
comment on column user_line_connections.revoked_at is
  'Set when the account is unlinked or disabled instead of storing LINE tokens.';

create table if not exists line_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  state_hash text not null unique,
  redirect_path text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table line_oauth_states is
  'Short-lived one-time OAuth state storage for LINE account linking. Store a hash of the state, not the raw state.';
comment on column line_oauth_states.state_hash is
  'Hash of the OAuth state token generated server-side.';
comment on column line_oauth_states.consumed_at is
  'Set after successful callback validation so the state cannot be reused.';

create index if not exists idx_user_line_connections_user_id
  on user_line_connections(user_id);
create index if not exists idx_user_line_connections_line_user_id
  on user_line_connections(line_user_id);
create index if not exists idx_user_line_connections_notify_enabled
  on user_line_connections(notify_enabled);

create index if not exists idx_line_oauth_states_state_hash
  on line_oauth_states(state_hash);
create index if not exists idx_line_oauth_states_user_id
  on line_oauth_states(user_id);
create index if not exists idx_line_oauth_states_expires_at
  on line_oauth_states(expires_at);
create index if not exists idx_line_oauth_states_consumed_at
  on line_oauth_states(consumed_at);

drop trigger if exists user_line_connections_updated_at on user_line_connections;
create trigger user_line_connections_updated_at
  before update on user_line_connections
  for each row execute function update_updated_at_column();

alter table user_line_connections enable row level security;
alter table line_oauth_states enable row level security;

drop policy if exists "Users can read own LINE connection" on user_line_connections;
create policy "Users can read own LINE connection"
  on user_line_connections for select
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own LINE connection" on user_line_connections;
create policy "Users can delete own LINE connection"
  on user_line_connections for delete
  using (auth.uid() = user_id);

-- No client insert/update policies are created for user_line_connections.
-- LINE linking must be performed by server routes after validating LINE OAuth.
-- No client access policies are created for line_oauth_states; service-role
-- server routes create, validate, consume, and clean up OAuth states.
