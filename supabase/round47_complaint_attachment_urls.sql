alter table complaints
  add column if not exists attachment_urls text[] null;

comment on column complaints.attachment_urls is
  'Additional complaint image attachment URLs. attachment_url remains the legacy first attachment.';

