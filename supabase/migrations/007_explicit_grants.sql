-- Explicit Data API grants for public tables.
-- Supabase stops auto-granting on new tables from 2026-10-30; existing projects keep
-- current grants, but db reset / preview branches need these in migrations.
--
-- anon: Realtime postgres_changes on room tables only (RLS limits to SELECT).
-- service_role: Next.js API routes (bypasses RLS).
-- authenticated: unused (no Supabase Auth in this app).

-- Online play
grant select on public.rooms to anon;
grant select on public.room_players to anon;
grant select on public.room_state to anon;

grant select, insert, update, delete on public.rooms to service_role;
grant select, insert, update, delete on public.room_players to service_role;
grant select, insert, update, delete on public.room_state to service_role;

-- Stats & rate limiting (server-only; no anon grants)
grant select, insert, update, delete on public.game_stats_daily to service_role;
grant select, insert, update, delete on public.game_stats_total to service_role;
grant select, insert, update, delete on public.play_rate_limit to service_role;

-- RPC
grant execute on function public.increment_game_play_count(text, date) to service_role;
