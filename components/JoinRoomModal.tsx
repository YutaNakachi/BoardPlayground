"use client";

import { joinRoomFlow } from "@/lib/online/join-room-flow";
import { RoomCodeInput } from "@/components/play/shared/RoomCodeInput";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function JoinRoomModal({ open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectingToSlug, setConnectingToSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isBusy = loading || connectingToSlug !== null;
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!connectingToSlug || !open) return;
    const playPath = `/play/${connectingToSlug}`;
    if (pathname === playPath || pathname.startsWith(`${playPath}/`)) {
      setConnectingToSlug(null);
      setLoading(false);
      onClose();
    }
  }, [pathname, connectingToSlug, open, onClose]);

  const close = useCallback(() => {
    if (isBusy) return;
    setError(null);
    setLoading(false);
    onClose();
  }, [isBusy, onClose]);

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await joinRoomFlow({
        code: joinCode,
        displayName,
        navigate: (path) => router.push(path),
      });
      setConnectingToSlug(result.gameSlug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "部屋への参加に失敗しました");
      setLoading(false);
    }
  }, [displayName, joinCode, router]);

  if (!(open || connectingToSlug) || !mounted) return null;

  const backdropClass = connectingToSlug
    ? "fixed inset-0 z-[100] overflow-y-auto bg-[#12101a] p-4 sm:p-6"
    : "fixed inset-0 z-[100] overflow-y-auto bg-black/60 p-4 sm:p-6";

  return createPortal(
    <div
      className={backdropClass}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex min-h-full items-center justify-center py-4">
        <div
          className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-room-title"
        >
          <h2 id="join-room-title" className="text-lg font-bold text-white">
            部屋に入る
          </h2>
          {connectingToSlug ? (
            <p className="mt-2 text-sm text-slate-400">
              部屋に接続しています…しばらくお待ちください
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              部屋コードを入力してください。
            </p>
          )}

          <fieldset
            disabled={isBusy}
            className="mt-6 space-y-4 disabled:opacity-60"
          >
            <label className="block text-sm" htmlFor="global-join-code">
              <span className="text-slate-400">部屋コード</span>
              <RoomCodeInput
                id="global-join-code"
                value={joinCode}
                onChange={setJoinCode}
                required
              />
            </label>
            <label className="block text-sm" htmlFor="global-join-name">
              <span className="text-slate-400">プレイヤー名</span>
              <input
                id="global-join-name"
                type="text"
                maxLength={20}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base text-white"
                placeholder="プレイヤー1"
                autoComplete="nickname"
                enterKeyHint="done"
              />
            </label>
          </fieldset>

          {error ? (
            <p className="mt-4 text-sm text-red-400" role="alert">{error}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={close}
              disabled={isBusy}
              className="min-h-11 rounded-full border border-white/15 px-4 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={isBusy || joinCode.length < 6 || !displayName.trim()}
              className="btn-game min-h-11"
            >
              {connectingToSlug
                ? "接続中…"
                : loading
                  ? "参加中…"
                  : "参加する"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
