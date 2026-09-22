-- Per-room game options (e.g. tic-tac-toe mode). Set by host at room creation.
alter table rooms
  add column if not exists game_options jsonb not null default '{}';
