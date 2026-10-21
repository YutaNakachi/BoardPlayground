#!/usr/bin/env bash
# Sets SUPABASE_DB_URL from .env.local when not already in the environment.
if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  return 0 2>/dev/null || exit 0
fi
[[ -f .env.local ]] || return 0 2>/dev/null || exit 0

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" =~ ^[[:space:]]*SUPABASE_DB_URL=(.*)$ ]] || continue
  val="${BASH_REMATCH[1]}"
  val="${val#"${val%%[![:space:]]*}"}"
  val="${val%"${val##*[![:space:]]}"}"
  if [[ -n "$val" ]]; then
    export SUPABASE_DB_URL="$val"
  fi
  break
done < .env.local
