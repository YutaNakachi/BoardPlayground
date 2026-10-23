-- Server-only secrets for online games with hidden information (e.g. hands).
-- Not exposed to anon Realtime; API uses service_role to read/write.

create table if not exists room_secrets (
  room_id uuid primary key references rooms (id) on delete cascade,
  payload jsonb not null default '{}',
  version integer not null default 0,
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.room_secrets to service_role;
