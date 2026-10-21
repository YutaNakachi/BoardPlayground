#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const checks = [
  { table: "game_stats_total", label: "stats" },
  { table: "rooms", label: "rooms" },
];

let failed = false;

for (const { table, label } of checks) {
  const { error } = await db.from(table).select("*").limit(1);
  if (error) {
    console.error(`[fail] ${label}: ${error.message}`);
    failed = true;
  } else {
    console.log(`[ok] ${label}`);
  }
}

const { error: optionsError } = await db.from("rooms").select("game_options").limit(1);
if (optionsError) {
  console.warn(`[warn] game_options column: ${optionsError.message}`);
  console.warn("       Run: npm run db:migrate");
} else {
  console.log("[ok] game_options column");
}

if (anonKey) {
  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: anonRoomsError } = await anon.from("rooms").select("id").limit(1);
  if (anonRoomsError) {
    console.error(`[fail] anon rooms: ${anonRoomsError.message}`);
    console.error("       Check 007_explicit_grants.sql and Realtime RLS policies");
    failed = true;
  } else {
    console.log("[ok] anon select on rooms");
  }

  const { error: anonStatsError } = await anon
    .from("game_stats_total")
    .select("game_slug")
    .limit(1);
  if (
    anonStatsError &&
    (anonStatsError.code === "42501" ||
      /permission denied/i.test(anonStatsError.message))
  ) {
    console.log("[ok] anon denied on game_stats_total (expected)");
  } else if (!anonStatsError) {
    console.warn(
      "[warn] anon can query game_stats_total — legacy auto-grants may still apply; ensure 007_explicit_grants.sql is applied before 2026-10-30",
    );
  } else {
    console.warn(`[warn] anon game_stats_total: ${anonStatsError.message}`);
  }
} else {
  console.warn("[skip] anon GRANT checks (set NEXT_PUBLIC_SUPABASE_ANON_KEY)");
}

process.exit(failed ? 1 : 0);
