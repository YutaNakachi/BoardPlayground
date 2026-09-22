"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  PlaySetupCard,
  setupPillClass,
} from "@/components/play/shared/PlaySetupCard";
import { RoomCodeInput } from "@/components/play/shared/RoomCodeInput";
import type { PlayMode } from "@/lib/online/types";

type Props = {
  title: string;
  description: string;
  mode: PlayMode;
  onModeChange: (mode: PlayMode) => void;
  onlineSupported: boolean;
  onCreateRoom: (displayName: string) => void;
  onJoinRoom: (code: string, displayName: string) => void;
  onStartLocal: () => void;
  loading?: boolean;
  error?: string | null;
  /** ローカル開始ボタンの上に表示する追加 UI（ルール選択など） */
  extra?: ReactNode;
  /** Waiting room UI */
  waiting?: {
    code: string;
    players: { displayName: string; seatIndex: number }[];
    isHost: boolean;
    onStart: () => void;
    canStart: boolean;
    extra?: ReactNode;
  };
};

export function OnlineSetupPanel({
  title,
  description,
  mode,
  onModeChange,
  onlineSupported,
  onCreateRoom,
  onJoinRoom,
  onStartLocal,
  loading,
  error,
  extra,
  waiting,
}: Props) {
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [action, setAction] = useState<"create" | "join">("create");

  if (waiting) {
    return (
      <PlaySetupCard
        title="部屋を待機中"
        description="参加者にこのコードを共有してください"
      >
        <p className="font-mono text-3xl font-bold tracking-widest text-accent">
          {waiting.code}
        </p>
        {waiting.extra}
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
      </PlaySetupCard>
    );
  }

  return (
    <PlaySetupCard title={title} description={description}>
      {onlineSupported ? (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => onModeChange("local")}
            className={setupPillClass(mode === "local")}
          >
            ローカル
          </button>
          <button
            type="button"
            onClick={() => onModeChange("online")}
            className={setupPillClass(mode === "online")}
          >
            オンライン
          </button>
        </div>
      ) : null}

      {mode === "local" || !onlineSupported ? (
        <>
          {extra}
          <button type="button" onClick={onStartLocal} className="btn-game mt-8">
            ゲーム開始
          </button>
        </>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setAction("create")}
              className={setupPillClass(action === "create")}
            >
              部屋を作る
            </button>
            <button
              type="button"
              onClick={() => setAction("join")}
              className={setupPillClass(action === "join")}
            >
              部屋に入る
            </button>
          </div>

          {action === "create" ? (
            <form
              className="mx-auto max-w-sm space-y-4 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                onCreateRoom(displayName);
              }}
            >
              {extra}
              <label className="block text-sm" htmlFor="online-create-name">
                <span className="text-slate-400">プレイヤー名</span>
                <input
                  id="online-create-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={20}
                  required
                  autoComplete="nickname"
                  enterKeyHint="done"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base text-white"
                  placeholder="プレイヤー1"
                />
              </label>
              <button type="submit" disabled={loading} className="btn-game w-full">
                {loading ? "作成中…" : "部屋を作成"}
              </button>
            </form>
          ) : (
            <form
              className="mx-auto max-w-sm space-y-4 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                onJoinRoom(joinCode, joinName);
              }}
            >
              <label className="block text-sm" htmlFor="online-room-code">
                <span className="text-slate-400">部屋コード</span>
                <RoomCodeInput
                  id="online-room-code"
                  value={joinCode}
                  onChange={setJoinCode}
                  required
                />
              </label>
              <label className="block text-sm" htmlFor="online-join-name">
                <span className="text-slate-400">プレイヤー名</span>
                <input
                  id="online-join-name"
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  maxLength={20}
                  required
                  autoComplete="nickname"
                  enterKeyHint="done"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base text-white"
                />
              </label>
              <button type="submit" disabled={loading} className="btn-game w-full">
                {loading ? "参加中…" : "部屋に参加"}
              </button>
            </form>
          )}
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
    </PlaySetupCard>
  );
}
