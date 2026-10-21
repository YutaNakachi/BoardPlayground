"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  KingAndSpyCard,
  KingAndSpyPublicState,
} from "@/lib/play/king-and-spy/types";

export type DuelSlot = {
  card: KingAndSpyCard | null;
  faceDownOnField: boolean;
  revealed: boolean;
};

export type DuelFieldState = [DuelSlot, DuelSlot];

const emptySlot = (): DuelSlot => ({
  card: null,
  faceDownOnField: false,
  revealed: false,
});

const emptyField = (): DuelFieldState => [emptySlot(), emptySlot()];

function slotBack(card: KingAndSpyCard | null): DuelSlot {
  return { card, faceDownOnField: true, revealed: false };
}

function slotOpen(card: KingAndSpyCard): DuelSlot {
  return { card, faceDownOnField: false, revealed: true };
}

export function useKingAndSpyDuelField(
  publicState: KingAndSpyPublicState,
  mySeat: 0 | 1,
  myCommittedCard: KingAndSpyCard | null
) {
  const [revealField, setRevealField] = useState<DuelFieldState | null>(null);
  const revealTokenRef = useRef<string | null>(null);
  const discardLenRef = useRef(publicState.discards.length);

  const waitingField = useMemo((): DuelFieldState | null => {
    const ready = publicState.committedReady;
    if (!ready[0] && !ready[1]) return null;
    return [
      ready[0] ? slotBack(mySeat === 0 ? myCommittedCard : null) : emptySlot(),
      ready[1] ? slotBack(mySeat === 1 ? myCommittedCard : null) : emptySlot(),
    ];
  }, [publicState.committedReady, mySeat, myCommittedCard]);

  useEffect(() => {
    const ready = publicState.committedReady;
    if (ready[0] || ready[1]) return;

    if (publicState.lastReveal) {
      const [a, b] = publicState.lastReveal.cards;
      const token = `${a.id}:${b.id}:${publicState.discards.length}`;
      if (revealTokenRef.current === token) return;
      revealTokenRef.current = token;

      setRevealField([slotBack(a), slotBack(b)]);
      const flipTimer = window.setTimeout(() => {
        setRevealField([slotOpen(a), slotOpen(b)]);
      }, 350);
      const clearTimer = window.setTimeout(() => {
        setRevealField(null);
      }, 2800);
      return () => {
        window.clearTimeout(flipTimer);
        window.clearTimeout(clearTimer);
      };
    }

    const prevLen = discardLenRef.current;
    const added = publicState.discards.length - prevLen;
    discardLenRef.current = publicState.discards.length;

    if (added === 2 && !publicState.lastReveal) {
      const a = publicState.discards[publicState.discards.length - 2];
      const b = publicState.discards[publicState.discards.length - 1];
      const token = `tie:${a.id}:${b.id}`;
      if (revealTokenRef.current === token) return;
      revealTokenRef.current = token;

      setRevealField([slotBack(a), slotBack(b)]);
      const flipTimer = window.setTimeout(() => {
        setRevealField([slotOpen(a), slotOpen(b)]);
      }, 350);
      const clearTimer = window.setTimeout(() => {
        setRevealField(null);
      }, 2800);
      return () => {
        window.clearTimeout(flipTimer);
        window.clearTimeout(clearTimer);
      };
    }
  }, [
    publicState.committedReady,
    publicState.lastReveal,
    publicState.discards,
  ]);

  const registerMyCommit = useCallback((_card: KingAndSpyCard) => {
    /* 場表示は waitingField（committedReady）で同期 */
  }, []);

  const resetField = useCallback(() => {
    revealTokenRef.current = null;
    setRevealField(null);
  }, []);

  const field = waitingField ?? revealField ?? emptyField();

  return { field, registerMyCommit, resetField };
}
