-- Speed up period ranking queries (play_date range scans)
create index if not exists game_stats_daily_play_date_idx
  on game_stats_daily (play_date);
