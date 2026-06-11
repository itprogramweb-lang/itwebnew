-- Round 44: LINE news webhook hardening.
-- Do not run automatically. Apply manually after round43_line_news_drafts.sql.

create table if not exists line_webhook_events (
  id uuid primary key default gen_random_uuid(),
  line_event_id text,
  line_message_id text,
  line_user_id text,
  event_type text,
  message_type text,
  processed_at timestamptz default now(),
  created_at timestamptz default now()
);

create unique index if not exists idx_line_webhook_events_line_event_id_unique
  on line_webhook_events(line_event_id)
  where line_event_id is not null;

create unique index if not exists idx_line_webhook_events_line_message_id_unique
  on line_webhook_events(line_message_id)
  where line_message_id is not null;

create index if not exists idx_line_webhook_events_line_user_id
  on line_webhook_events(line_user_id);

create index if not exists idx_line_webhook_events_created_at
  on line_webhook_events(created_at);

alter table line_webhook_events enable row level security;

comment on table line_webhook_events is
  'Deduplication log for LINE webhook events. Managed by server/service-role routes only.';

create table if not exists line_ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  line_user_id text not null,
  provider text not null default 'gemini',
  purpose text not null default 'line_news_draft',
  created_at timestamptz default now()
);

create index if not exists idx_line_ai_usage_logs_user_id
  on line_ai_usage_logs(user_id);

create index if not exists idx_line_ai_usage_logs_line_user_id
  on line_ai_usage_logs(line_user_id);

create index if not exists idx_line_ai_usage_logs_provider
  on line_ai_usage_logs(provider);

create index if not exists idx_line_ai_usage_logs_created_at
  on line_ai_usage_logs(created_at);

alter table line_ai_usage_logs enable row level security;

comment on table line_ai_usage_logs is
  'AI usage log for LINE-created news drafts. Managed by server/service-role routes only.';
