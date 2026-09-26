"use client";

import { PlaySetupCard } from "@/components/play/shared/PlaySetupCard";

export function PendingJoinConnecting() {
  return (
    <PlaySetupCard title="部屋に入る" description="部屋に接続しています…">
      <p className="text-sm text-slate-400">しばらくお待ちください</p>
    </PlaySetupCard>
  );
}
