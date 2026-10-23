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

/** 両カードが揃ってからオープンまでの間 */
const FACE_DOWN_MS = 800;
/** オープンして結果を見せてから場を空にするまで */
const OPEN_HOLD_MS = 1500;

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

export function kingAndSpyShowcaseToken(
  publicState: KingAndSpyPublicState
): string | null {
  const showcase = publicState.showcase;
  if (!showcase) return null;
  const [a, b] = showcase.cards;
  return `showcase:${a.id}:${b.id}:${showcase.tie ? "tie" : "win"}`;
}

function startShowcase(
  cards: [KingAndSpyCard, KingAndSpyCard],
  setRevealField: (field: DuelFieldState | null) => void,
  onDone: () => void
) {
  setRevealField([slotBack(cards[0]), slotBack(cards[1])]);
  const openTimer = window.setTimeout(() => {
    setRevealField([slotOpen(cards[0]), slotOpen(cards[1])]);
  }, FACE_DOWN_MS);
  const clearTimer = window.setTimeout(() => {
    setRevealField(null);
    onDone();
  }, FACE_DOWN_MS + OPEN_HOLD_MS);
  return () => {
    window.clearTimeout(openTimer);
    window.clearTimeout(clearTimer);
  };
}

export function useKingAndSpyDuelField(
  publicState: KingAndSpyPublicState,
  mySeat: 0 | 1,
  /** 送信済みで、サーバーの committedReady より先に自席へ出すカード */
  localCard: KingAndSpyCard | null,
  onShowcaseDone?: () => void
) {
  const [revealField, setRevealField] = useState<DuelFieldState | null>(null);
  const [playedToken, setPlayedToken] = useState<string | null>(() =>
    kingAndSpyShowcaseToken(publicState)
  );
  const onDoneRef = useRef(onShowcaseDone);
  const publicRef = useRef(publicState);

  const showcaseToken = kingAndSpyShowcaseToken(publicState);
  const showcasePending =
    showcaseToken !== null && playedToken !== showcaseToken;

  const waitingField = useMemo((): DuelFieldState | null => {
    if (showcasePending) return null;
    const ready: [boolean, boolean] = [
      publicState.committedReady[0],
      publicState.committedReady[1],
    ];
    if (localCard && !ready[mySeat]) {
      ready[mySeat] = true;
    }
    if (!ready[0] && !ready[1]) return null;
    return [
      ready[0] ? slotBack(mySeat === 0 ? localCard : null) : emptySlot(),
      ready[1] ? slotBack(mySeat === 1 ? localCard : null) : emptySlot(),
    ];
  }, [showcasePending, publicState.committedReady, localCard, mySeat]);

  useLayoutEffect(() => {
    publicRef.current = publicState;
    onDoneRef.current = onShowcaseDone;
  }, [publicState, onShowcaseDone]);

  useLayoutEffect(() => {
    if (!showcaseToken || playedToken === showcaseToken) return;
    const cards = publicRef.current.showcase?.cards;
    if (!cards) return;

    return startShowcase(cards, setRevealField, () => {
      setPlayedToken(showcaseToken);
      onDoneRef.current?.();
    });
  }, [showcaseToken, playedToken]);

  const resetField = useCallback(() => {
    setRevealField(null);
    setPlayedToken(null);
  }, []);

  const field = revealField ?? waitingField ?? emptyField();

  const isHandLocked =
    showcasePending ||
    revealField !== null ||
    publicState.committedReady[mySeat] ||
    localCard !== null;

  return {
    field,
    resetField,
    isHandLocked,
    isFieldAnimating: revealField !== null,
    isRevealPlayback: isHandLocked,
  };
}
