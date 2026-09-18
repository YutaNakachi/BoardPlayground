"use client";

import { useState } from "react";
import type { PlayMode } from "@/lib/online/types";

type Props = {
  mode: PlayMode;
  onModeChange: (mode: PlayMode) => void;
  onlineSupported: boolean;
  onCreateRoom: (displayName: string) => void;
  onJoinRoom: (code: string, displayName: string) => void;
  onStartLocal: () => void;
  loading?: boolean;
  error?: string | null;
  /** Waiting room UI */
  waiting?: {
    code: string;
    players: { displayName: string; seatIndex: number }[];
    isHost: boolean;
    onStart: () => void;
    canStart: boolean;
  };
};

export function OnlineSetupPanel({
  mode,
  onModeChange,
  onlineSupported,
  onCreateRoom,
  onJoinRoom,
  onStartLocal,
  loading,
  error,
  waiting,
}: Props) {
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [action, setAction] = useState<"create" | "join">("create");

  if (waiting) {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">部屋を待機中</h2>
        <p className="mt-2 text-sm text-[#a1a1a6]">
          参加者にこのコードを共有してください
        </p>
        <p className="mt-4 font-mono text-3xl font-bold tracking-widest text-accent">
          {waiting.code}
        </p>
        <ul className="mt-6 space-y-2 text-sm text-slate-300">
          {waiting.players.map((p) => (
            <li key={p.seatIndex}>
              席 {p.seatIndex + 1}: {p.displayName}
              {p.seatIndex === 0 ? "（ホスト）" : ""}
            </li>
          ))}
        </ul>
        {waiting.isHost && waiting.canStart ? (
          <button
            type="button"
            onClick={waiting.onStart}
            disabled={loading}
            className="btn-game mt-8"
          >
            {loading ? "開始中…" : "ゲーム開始"}
          </button>
        ) : (
          <p className="mt-8 text-sm text-slate-400">
            {waiting.players.length < 2
              ? "相手の参加を待っています…"
              : "ホストの開始を待っています…"}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 sm:p-8">
      {onlineSupported ? (
        <div className="mb-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onModeChange("local")}
            className={`min-h-11 rounded-full px-5 text-sm font-medium transition ${
              mode === "local"
                ? "bg-[#f5f5f7] text-[#1d1d1f]"
                : "bg-white/10 text-[#c7c7cc] ring-1 ring-white/10 hover:bg-white/15"
            }`}
          >
            ローカル
          </button>
          <button
            type="button"
            onClick={() => onModeChange("online")}
            className={`min-h-11 rounded-full px-5 text-sm font-medium transition ${
              mode === "online"
                ? "bg-[#f5f5f7] text-[#1d1d1f]"
                : "bg-white/10 text-[#c7c7cc] ring-1 ring-white/10 hover:bg-white/15"
            }`}
          >
            オンライン
          </button>
        </div>
      ) : null}

      {mode === "local" || !onlineSupported ? (
        <div className="text-center">
          <button type="button" onClick={onStartLocal} className="btn-game">
            ゲーム開始
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setAction("create")}
              className={`min-h-9 rounded-full px-4 text-sm transition ${
                action === "create"
                  ? "bg-accent/30 text-white ring-1 ring-accent/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              部屋を作る
            </button>
            <button
              type="button"
              onClick={() => setAction("join")}
              className={`min-h-9 rounded-full px-4 text-sm transition ${
                action === "join"
                  ? "bg-accent/30 text-white ring-1 ring-accent/50"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              部屋に入る
            </button>
          </div>

          {action === "create" ? (
            <form
              className="mx-auto max-w-sm space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onCreateRoom(displayName);
              }}
            >
              <label className="block text-left text-sm">
                <span className="text-slate-400">プレイヤー名</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={20}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                  placeholder="プレイヤー1"
                />
              </label>
              <button type="submit" disabled={loading} className="btn-game w-full">
                {loading ? "作成中…" : "部屋を作成"}
              </button>
            </form>
          ) : (
            <form
              className="mx-auto max-w-sm space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onJoinRoom(joinCode, joinName);
              }}
            >
              <label className="block text-left text-sm">
                <span className="text-slate-400">部屋コード</span>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono uppercase text-white"
                  placeholder="ABC123"
                />
              </label>
              <label className="block text-left text-sm">
                <span className="text-slate-400">プレイヤー名</span>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  maxLength={20}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
              </label>
              <button type="submit" disabled={loading} className="btn-game w-full">
                {loading ? "参加中…" : "部屋に参加"}
              </button>
            </form>
          )}
        </div>
      )}

      {error ? <p className="mt-4 text-center text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
