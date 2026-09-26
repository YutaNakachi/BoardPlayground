"use client";

import {
  JOIN_NAV_SHIELD_EVENT,
  readJoinNavigationShield,
} from "@/lib/online/join-navigation-shield";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(JOIN_NAV_SHIELD_EVENT, handler);
  return () => window.removeEventListener(JOIN_NAV_SHIELD_EVENT, handler);
}

function getShieldSnapshot(): string | null {
  return readJoinNavigationShield();
}

function getServerShieldSnapshot(): string | null {
  return null;
}

export function JoinNavigationShield() {
  const slug = useSyncExternalStore(
    subscribe,
    getShieldSnapshot,
    getServerShieldSnapshot
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (!slug) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [slug]);

  if (!slug || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-[#12101a] px-6 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-lg font-bold text-white">部屋に接続しています</p>
      <p className="mt-2 text-sm text-slate-400">しばらくお待ちください</p>
    </div>,
    document.body
  );
}
