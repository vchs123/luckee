-- ─────────────────────────────────────────────────────────────────────────────
-- Contact form messages
-- Run this in the Supabase SQL editor.
--
-- Replaces publishing an email address on the site: the /contact form writes
-- here and the admin dashboard's Messages page reads it.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,          -- where to reply
  topic text not null,          -- general | partnership | privacy | copyright | other
  message text not null,
  user_id uuid references auth.users(id) on delete set null,  -- set when sent while signed in
  handled_at timestamptz,       -- null = still waiting for a reply
  created_at timestamptz not null default now(),
  constraint contact_messages_name_len check (char_length(name) between 1 and 100),
  constraint contact_messages_email_len check (char_length(email) between 3 and 254),
  constraint contact_messages_message_len check (char_length(message) between 1 and 5000)
);
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);

-- Messages hold people's names and email addresses. Row-level security with no
-- policies means the public anon key can neither read nor write this table;
-- only the server, using the service-role key (which bypasses RLS), can.
alter table contact_messages enable row level security;
