-- Online play rooms
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  game_slug text not null,
  passphrase_hash text not null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  max_players integer not null default 2,
  host_player_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists rooms_code_idx on rooms (code);
create index if not exists rooms_expires_at_idx on rooms (expires_at);

create table if not exists room_players (
  room_id uuid not null references rooms (id) on delete cascade,
  player_id uuid not null,
  seat_index integer not null,
  display_name text not null,
  joined_at timestamptz not null default now(),
  primary key (room_id, player_id),
  unique (room_id, seat_index)
);

create table if not exists room_state (
  room_id uuid primary key references rooms (id) on delete cascade,
  state jsonb not null default '{}',
  version integer not null default 0,
  current_player integer,
  updated_at timestamptz not null default now()
);

-- Realtime: enable replication for room_state (run in Supabase dashboard or via CLI)
alter publication supabase_realtime add table room_state;
