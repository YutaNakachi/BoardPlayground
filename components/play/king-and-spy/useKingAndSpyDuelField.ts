"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const REVEAL_HOLD_MS = 2800;

const emptySlot = (): DuelSlot => ({
  card: null,
  faceDownOnField: false,
  revealed: false,
});

const emptyField = (): DuelFieldState => [emptySlot(), emptySlot()];

const OPPONENT_FIELD_PLACEHOLDER: KingAndSpyCard = {
  id: "field-opponent-hidden",
  kind: "citizen",
};

function slotBack(card: KingAndSpyCard | null): DuelSlot {
  return {
    card: card ?? OPPONENT_FIELD_PLACEHOLDER,
    faceDownOnField: true,
    revealed: false,
  };
}

function slotOpen(card: KingAndSpyCard): DuelSlot {
  return { card, faceDownOnField: false, revealed: true };
}

function lastRevealPlaybackToken(
  publicState: KingAndSpyPublicState
): string | null {
  if (!publicState.lastReveal) return null;
  const [a, b] = publicState.lastReveal.cards;
  return `reveal:${a.id}:${b.id}:${publicState.discards.length}`;
}

function startRevealAnimation(
  a: KingAndSpyCard,
  b: KingAndSpyCard,
  setRevealField: (f: DuelFieldState | null) => void,
  onDone: () => void
) {
  setRevealField([slotBack(a), slotBack(b)]);
  const flipTimer = window.setTimeout(() => {
    setRevealField([slotOpen(a), slotOpen(b)]);
  }, 350);
  const clearTimer = window.setTimeout(() => {
    setRevealField(null);
    onDone();
  }, REVEAL_HOLD_MS);
  return () => {
    window.clearTimeout(flipTimer);
    window.clearTimeout(clearTimer);
  };
}

export function useKingAndSpyDuelField(
  publicState: KingAndSpyPublicState,
  mySeat: 0 | 1,
  myCommittedCard: KingAndSpyCard | null
) {
  const [revealField, setRevealField] = useState<DuelFieldState | null>(null);
  const [playbackDoneToken, setPlaybackDoneToken] = useState<string | null>(null);
  const revealTokenRef = useRef<string | null>(null);
  const discardLenRef = useRef(publicState.discards.length);
  const trickEpochRef = useRef(
    `${publicState.roundNumber}:${publicState.discards.length}`
  );

  const waitingField = useMemo((): DuelFieldState | null => {
    const ready = publicState.committedReady;
    if (!ready[0] && !ready[1]) return null;
    return [
      ready[0] ? slotBack(mySeat === 0 ? myCommittedCard : null) : emptySlot(),
      ready[1] ? slotBack(mySeat === 1 ? myCommittedCard : null) : emptySlot(),
    ];
  }, [publicState.committedReady, mySeat, myCommittedCard]);

  const bothCommitted =
    publicState.committedReady[0] && publicState.committedReady[1];

  const decisiveRevealToken = useMemo(
    () => lastRevealPlaybackToken(publicState),
    [publicState.lastReveal, publicState.discards.length]
  );

  const decisiveRevealPending =
    decisiveRevealToken !== null &&
    playbackDoneToken !== decisiveRevealToken;

  useLayoutEffect(() => {
    const ready = publicState.committedReady;
    const trickEpoch = `${publicState.roundNumber}:${publicState.discards.length}`;

    if (!ready[0] && !ready[1]) {
      discardLenRef.current = publicState.discards.length;
      if (trickEpochRef.current !== trickEpoch) {
        trickEpochRef.current = trickEpoch;
        setRevealField(null);
      }
    }

    if (ready[0] || ready[1]) return;

    if (decisiveRevealToken) {
      if (playbackDoneToken === decisiveRevealToken) return;
      if (revealTokenRef.current === decisiveRevealToken) return;
      revealTokenRef.current = decisiveRevealToken;

      const [a, b] = publicState.lastReveal!.cards;
      return startRevealAnimation(a, b, setRevealField, () => {
        setPlaybackDoneToken(decisiveRevealToken);
        discardLenRef.current = publicState.discards.length;
      });
    }

    const prevLen = discardLenRef.current;
    const added = publicState.discards.length - prevLen;
    discardLenRef.current = publicState.discards.length;

    if (added === 2 && !publicState.lastReveal) {
      const a = publicState.discards[publicState.discards.length - 2];
      const b = publicState.discards[publicState.discards.length - 1];
      if (a.kind !== "citizen" || b.kind !== "citizen") {
        return;
      }
      const token = `tie:${a.id}:${b.id}`;
      if (revealTokenRef.current === token) return;
      revealTokenRef.current = token;

      return startRevealAnimation(a, b, setRevealField, () => {
        setRevealField(null);
      });
    }
  }, [
    publicState.committedReady,
    publicState.lastReveal,
    publicState.discards,
    publicState.roundNumber,
    decisiveRevealToken,
    playbackDoneToken,
  ]);

  const resetField = useCallback(() => {
    revealTokenRef.current = null;
    setRevealField(null);
    setPlaybackDoneToken(null);
    discardLenRef.current = 0;
    trickEpochRef.current = "0:0";
  }, []);

  const field = waitingField ?? revealField ?? emptyField();

  const isFieldAnimating = revealField !== null;
  const isHandLocked =
    bothCommitted ||
    decisiveRevealPending ||
    (isFieldAnimating && publicState.lastReveal !== null);

  return {
    field,
    resetField,
    isHandLocked,
    isFieldAnimating,
    isRevealPlayback: isHandLocked,
  };
}
