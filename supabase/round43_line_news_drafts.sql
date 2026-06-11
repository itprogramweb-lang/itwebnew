-- Round 43: LINE news draft storage.
-- Do not run automatically. Apply manually when enabling LINE news draft flow.

create table if not exists line_news_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  line_user_id text not null,
  status text not null default 'pending' check (
    status in ('pending', 'previewed', 'published', 'cancelled', 'expired')
  ),
  raw_text text,
  parsed_title text,
  parsed_category text,
  parsed_excerpt text,
  parsed_content text,
  parsed_status text,
  parsed_is_featured boolean default false,
  parsed_published_at timestamptz,
  parsed_notes_for_ai text,
  cover_image_url text,
  cover_image_alt text,
  content_image_urls text[] default '{}',
  ai_output_json jsonb default '{}',
  preview_text text,
  published_news_id uuid,
  confirmed_at timestamptz,
  published_at timestamptz,
  cancelled_at timestamptz,
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_line_news_drafts_line_user_id
  on line_news_drafts(line_user_id);
create index if not exists idx_line_news_drafts_user_id
  on line_news_drafts(user_id);
create index if not exists idx_line_news_drafts_status
  on line_news_drafts(status);
create index if not exists idx_line_news_drafts_expires_at
  on line_news_drafts(expires_at);
create index if not exists idx_line_news_drafts_published_news_id
  on line_news_drafts(published_news_id);

create unique index if not exists idx_line_news_drafts_one_active_per_user
  on line_news_drafts(user_id)
  where status in ('pending', 'previewed');

drop trigger if exists line_news_drafts_updated_at on line_news_drafts;
create trigger line_news_drafts_updated_at
  before update on line_news_drafts
  for each row execute function update_updated_at_column();

alter table line_news_drafts enable row level security;

comment on table line_news_drafts is
  'Pending LINE-created news drafts. Managed by server/service-role routes only.';
