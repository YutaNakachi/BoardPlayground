-- Row Level Security: block direct anon writes via PostgREST while keeping Realtime working.
-- API routes use service_role (bypasses RLS). Browser anon key is used only for Realtime
-- postgres_changes, which requires SELECT policies on subscribed tables.

-- Stats & rate limiting: server-only (no client policies => anon/authenticated denied)
alter table game_stats_daily enable row level security;
alter table game_stats_total enable row level security;
alter table play_rate_limit enable row level security;

-- Online play tables
alter table rooms enable row level security;
alter table room_players enable row level security;
alter table room_state enable row level security;

-- Realtime: allow anon to receive postgres_changes (read-only; no write policies)
create policy "anon_select_rooms"
  on rooms for select
  to anon
  using (true);

create policy "anon_select_room_players"
  on room_players for select
  to anon
  using (true);

create policy "anon_select_room_state"
  on room_state for select
  to anon
  using (true);
