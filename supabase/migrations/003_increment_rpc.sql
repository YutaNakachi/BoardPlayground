-- Atomic play count increment (avoids race conditions on concurrent plays)
create or replace function public.increment_game_play_count(
  p_game_slug text,
  p_play_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into game_stats_daily (game_slug, play_date, play_count)
  values (p_game_slug, p_play_date, 1)
  on conflict (game_slug, play_date)
  do update set play_count = game_stats_daily.play_count + 1;

  insert into game_stats_total (game_slug, play_count)
  values (p_game_slug, 1)
  on conflict (game_slug)
  do update set play_count = game_stats_total.play_count + 1;
end;
$$;
