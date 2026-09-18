-- Play count statistics (daily aggregation + totals)
create table if not exists game_stats_daily (
  game_slug text not null,
  play_date date not null,
  play_count integer not null default 0,
  primary key (game_slug, play_date)
);

create table if not exists game_stats_total (
  game_slug text primary key,
  play_count integer not null default 0
);

-- Rate limit: same IP + slug within 30 seconds
create table if not exists play_rate_limit (
  ip_hash text not null,
  game_slug text not null,
  recorded_at timestamptz not null default now(),
  primary key (ip_hash, game_slug)
);

create index if not exists play_rate_limit_recorded_at_idx
  on play_rate_limit (recorded_at);
