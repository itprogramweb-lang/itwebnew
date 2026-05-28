-- Round 27: contact_messages table
-- Run this migration in Supabase SQL editor AFTER schema.sql, round23, and round25

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table contact_messages enable row level security;

drop policy if exists "public_insert_contact" on contact_messages;
drop policy if exists "admin_select_contact" on contact_messages;
drop policy if exists "admin_update_contact" on contact_messages;

-- public can insert (contact form submissions)
create policy "public_insert_contact" on contact_messages
  for insert with check (true);

-- admin roles can read/update
create policy "admin_select_contact" on contact_messages
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('super_admin', 'website_admin', 'staff')
      and is_active = true
    )
  );

create policy "admin_update_contact" on contact_messages
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('super_admin', 'website_admin', 'staff')
      and is_active = true
    )
  );

-- updated_at trigger (requires update_updated_at_column() function from schema.sql)
drop trigger if exists update_contact_messages_updated_at on contact_messages;
create trigger update_contact_messages_updated_at
  before update on contact_messages
  for each row execute function update_updated_at_column();
