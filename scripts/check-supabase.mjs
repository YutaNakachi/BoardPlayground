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

process.exit(failed ? 1 : 0);
