"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { getGameBySlug } from "@/lib/games";
import {
  PlaySetupCard,
  PlaySetupStack,
  setupPillClass,
} from "@/components/play/shared/PlaySetupCard";
import {
  PlayModeLocalMatchTabs,
  type LocalMatchSetupKind,
} from "@/components/play/shared/PlayModeLocalMatchTabs";
import { PlayModeLocalOnlineTabs } from "@/components/play/shared/PlayModeLocalOnlineTabs";
import { RoomCodeInput } from "@/components/play/shared/RoomCodeInput";
import type { PlayMode } from "@/lib/online/types";
import { isOnlineGame } from "@/lib/online/types";
import { usePlayStats } from "@/components/PlayStatsProvider";

type Props = {
  title: string;
  description: string;
  mode: PlayMode;
  onModeChange: (mode: PlayMode) => void;
  onlineSupported: boolean;
  onCreateRoom: (displayName: string) => void;
  onJoinRoom: (code: string, displayName: string) => void;
  onStartLocal: (kind: LocalMatchSetupKind) => void;
  /** ローカル対人/CPU タブの変更（extra の出し分け用） */
  onLocalMatchKindChange?: (kind: LocalMatchSetupKind) => void;
  loading?: boolean;
  error?: string | null;
  /**
   * ローカル開始ボタンの上に表示する追加 UI。
   * 関数のときは対人/CPU タブの `kind` を渡す（CPU 専用 UI の出し分け用）。
   */
  extra?: ReactNode | ((kind: LocalMatchSetupKind) => ReactNode);
  /** オンライン「部屋を作る」選択時の追加 UI */
  createExtra?: ReactNode;
  /** オンライン「部屋に入る」選択時の追加 UI */
  joinExtra?: ReactNode;
  /** URL の ?room= から部屋コードを事前入力 */
  initialJoinCode?: string | null;
  /** Waiting room UI */
  waiting?: {
    code: string;
    players: { displayName: string; seatIndex: number }[];
    maxPlayers?: number;
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
  onLocalMatchKindChange,
  loading,
  error,
  extra,
  createExtra,
  joinExtra,
  initialJoinCode,
  waiting,
}: Props) {
  const { gameSlug } = usePlayPage();
  const { onlineEnabled, backendLoading } = usePlayStats();
  const onlineCapable = isOnlineGame(gameSlug);
  const onlineAvailable = onlineCapable && onlineEnabled;
  const resolvedOnlineSupported = onlineCapable
    ? onlineAvailable
    : onlineSupported;
  const cpuSupported = getGameBySlug(gameSlug)?.cpu ?? false;
  const [localMatchKind, setLocalMatchKind] =
    useState<LocalMatchSetupKind>("pvp");
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [action, setAction] = useState<"create" | "join">("create");

  const urlJoinPrefill =
    Boolean(initialJoinCode && !waiting) && action !== "create";
  const shownAction = urlJoinPrefill ? "join" : action;
  const shownJoinCode = urlJoinPrefill
    ? joinCode || initialJoinCode || ""
    : joinCode;
  const displayMode = urlJoinPrefill ? "online" : mode;

  const hasOnlineExtraSplit = createExtra !== undefined || joinExtra !== undefined;
  const extraForOnline =
    typeof extra === "function" ? undefined : extra;
  const onlineExtra =
    hasOnlineExtraSplit
      ? shownAction === "create"
        ? createExtra
        : joinExtra
      : extraForOnline;

  const resolvedLocalExtra =
    extra === undefined
      ? null
      : typeof extra === "function"
        ? extra(localMatchKind)
        : extra;

  if (waiting) {
    const targetCount = waiting.maxPlayers ?? 2;
    const remaining = Math.max(0, targetCount - waiting.players.length);
    return (
      <PlaySetupCard
        title="部屋を待機中"
        description="参加者にこのコードを共有してください"
      >
        <p className="font-mono text-3xl font-bold tracking-widest text-accent">
          {waiting.code}
        </p>
        {waiting.extra}
        <ul className="space-y-2 text-sm text-slate-300">
          {waiting.players.map((p) => (
            <li key={p.seatIndex}>
              席 {p.seatIndex + 1}: {p.displayName}
              {p.seatIndex === 0 ? "（ホスト）" : ""}
            </li>
          ))}
        </ul>
        <p className="text-sm text-slate-400">
          目標人数: {targetCount}人（あと {remaining} 人）
        </p>
        {waiting.isHost && waiting.canStart ? (
          <button
            type="button"
            onClick={waiting.onStart}
            disabled={loading}
            className="btn-game"
          >
            {loading ? "開始中…" : "ゲーム開始"}
          </button>
        ) : (
          <p className="text-sm text-slate-400">
            {remaining > 0
              ? "参加者の入室を待っています…"
              : "ホストの開始を待っています…"}
          </p>
        )}
      </PlaySetupCard>
    );
  }

  return (
    <PlaySetupCard title={title} description={description}>
      <PlayModeLocalOnlineTabs
        mode={displayMode === "online" ? "online" : "local"}
        onModeChange={onModeChange}
        onlineSupported={resolvedOnlineSupported}
        onlineCapable={onlineCapable}
        onlineStatusLoading={backendLoading}
      />

      {displayMode === "local" ? (
        <PlayModeLocalMatchTabs
          kind={localMatchKind}
          onKindChange={(kind) => {
            setLocalMatchKind(kind);
            onLocalMatchKindChange?.(kind);
          }}
          cpuSupported={cpuSupported}
        />
      ) : null}

      {displayMode === "local" && resolvedLocalExtra ? resolvedLocalExtra : null}

      {displayMode === "online" && resolvedOnlineSupported && onlineExtra
        ? onlineExtra
        : null}

      {displayMode === "local" || !resolvedOnlineSupported ? (
        <button
          type="button"
          onClick={() => onStartLocal(localMatchKind)}
          className="btn-game"
        >
          ゲーム開始
        </button>
      ) : (
        <PlaySetupStack>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setAction("create")}
              className={setupPillClass(shownAction === "create")}
            >
              部屋を作る
            </button>
            <button
              type="button"
              onClick={() => setAction("join")}
              className={setupPillClass(shownAction === "join")}
            >
              部屋に入る
            </button>
          </div>

          {shownAction === "create" ? (
            <form
              className="mx-auto max-w-sm space-y-4 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                onCreateRoom(displayName);
              }}
            >
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
                onJoinRoom(shownJoinCode, joinName);
              }}
            >
              <label className="block text-sm" htmlFor="online-room-code">
                <span className="text-slate-400">部屋コード</span>
                <RoomCodeInput
                  id="online-room-code"
                  value={shownJoinCode}
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
        </PlaySetupStack>
      )}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </PlaySetupCard>
  );
}
