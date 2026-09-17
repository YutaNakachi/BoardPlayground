"use client";

import { useEffect } from "react";
import type { GameRulesDocument } from "@/lib/game-rules";
import { GameRulesView } from "@/components/rules/GameRulesView";

type Props = {
  rules: GameRulesDocument;
  open: boolean;
  onClose: () => void;
};

export function GameRulesOverlay({ rules, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 p-0 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${rules.title}のルール`}
        className="mx-auto flex h-full max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-none border border-surface-border bg-surface shadow-2xl sm:my-auto sm:h-[min(90vh,900px)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <GameRulesView rules={rules} variant="overlay" onClose={onClose} />
      </div>
    </div>
  );
}
