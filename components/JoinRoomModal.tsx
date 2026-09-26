"use client";

import { joinRoomFlow } from "@/lib/online/join-room-flow";
import { RoomCodeInput } from "@/components/play/shared/RoomCodeInput";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function JoinRoomModal({ open, onClose }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    setError(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await joinRoomFlow({
        code: joinCode,
        displayName,
        navigate: (path) => router.push(path),
      });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "部屋への参加に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [displayName, joinCode, close, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-room-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-xl">
        <h2 id="join-room-title" className="text-lg font-bold text-white">
          部屋に入る
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          部屋コードを入力してください。ゲームの種類に合ったプレイ画面へ移動します。
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300" htmlFor="global-join-name">
            表示名
            <input
              id="global-join-name"
              type="text"
              maxLength={20}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base text-white"
              placeholder="ニックネーム"
              autoComplete="nickname"
            />
          </label>
          <label className="block text-sm text-slate-300" htmlFor="global-join-code">
            部屋コード
            <RoomCodeInput
              id="global-join-code"
              value={joinCode}
              onChange={setJoinCode}
              required
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="min-h-11 rounded-full border border-white/15 px-4 text-sm text-slate-300 hover:bg-white/5"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading || joinCode.length < 6 || !displayName.trim()}
            className="btn-game min-h-11"
          >
            {loading ? "参加中…" : "参加する"}
          </button>
        </div>
      </div>
    </div>
  );
}
