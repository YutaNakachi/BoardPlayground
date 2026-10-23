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

/** 両者確定が解決済み（オープン演出待ち）のトリック。committedReady が両方 false のときのみ */
export function kingAndSpyResolvedTrickToken(
  publicState: KingAndSpyPublicState
): string | null {
  if (publicState.committedReady[0] || publicState.committedReady[1]) {
    return null;
  }
  if (publicState.lastReveal) {
    const [a, b] = publicState.lastReveal.cards;
    return `decisive:${a.id}:${b.id}:${publicState.discards.length}`;
  }
  const len = publicState.discards.length;
  if (len < 2) return null;
  const a = publicState.discards[len - 2];
  const b = publicState.discards[len - 1];
  if (a.kind === "citizen" && b.kind === "citizen") {
    return `tie:${a.id}:${b.id}:${len}`;
  }
  return null;
}

function cardsForTrickToken(
  publicState: KingAndSpyPublicState,
  token: string
): [KingAndSpyCard, KingAndSpyCard] | null {
  if (token.startsWith("decisive:")) {
    if (!publicState.lastReveal) {
      return null;
    }
    return publicState.lastReveal.cards;
  }
  if (token.startsWith("tie:")) {
    const len = publicState.discards.length;
    if (len < 2) return null;
    return [
      publicState.discards[len - 2],
      publicState.discards[len - 1],
    ];
  }
  return null;
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
  myCommittedCard: KingAndSpyCard | null,
  /** オンライン: サーバー反映前の自席確定表示のみ（ルールはサーバー側） */
  pendingMyCommit = false
) {
  const [revealField, setRevealField] = useState<DuelFieldState | null>(null);
  const [playbackDoneToken, setPlaybackDoneToken] = useState<string | null>(
    null
  );
  const revealTokenRef = useRef<string | null>(null);
  /** マウント時点で既に終わっているトリックは再生しない */
  const [historicalSkipToken, setHistoricalSkipToken] = useState(
    () => kingAndSpyResolvedTrickToken(publicState)
  );

  const resolvedTrickToken = useMemo(
    () => kingAndSpyResolvedTrickToken(publicState),
    [publicState]
  );

  /** サーバーが既にトリック解決済みなら送信中の裏表示を重ねない（2人目確定の取りこぼし防止） */
  const pendingOverlayActive =
    pendingMyCommit && resolvedTrickToken === null;

  const displayReady = useMemo((): [boolean, boolean] => {
    const r = [...publicState.committedReady] as [boolean, boolean];
    if (pendingOverlayActive) {
      r[mySeat] = true;
    }
    return r;
  }, [publicState.committedReady, pendingOverlayActive, mySeat]);

  const waitingField = useMemo((): DuelFieldState | null => {
    if (resolvedTrickToken !== null && !pendingOverlayActive) {
      return null;
    }
    if (!displayReady[0] && !displayReady[1]) return null;
    return [
      displayReady[0]
        ? slotBack(mySeat === 0 ? myCommittedCard : null)
        : emptySlot(),
      displayReady[1]
        ? slotBack(mySeat === 1 ? myCommittedCard : null)
        : emptySlot(),
    ];
  }, [displayReady, mySeat, myCommittedCard, resolvedTrickToken, pendingOverlayActive]);

  const trickPlaybackToken = resolvedTrickToken;

  const decisivePlaybackPending =
    trickPlaybackToken !== null &&
    trickPlaybackToken.startsWith("decisive:") &&
    playbackDoneToken !== trickPlaybackToken &&
    trickPlaybackToken !== historicalSkipToken;

  useLayoutEffect(() => {
    if (publicState.committedReady[0] || publicState.committedReady[1]) {
      return;
    }

    const token = kingAndSpyResolvedTrickToken(publicState);
    if (!token) {
      return;
    }

    if (
      playbackDoneToken === token ||
      token === historicalSkipToken
    ) {
      return;
    }

    if (revealTokenRef.current === token) {
      return;
    }

    const pair = cardsForTrickToken(publicState, token);
    if (!pair) return;

    revealTokenRef.current = token;
    const [a, b] = pair;

    return startRevealAnimation(a, b, setRevealField, () => {
      setPlaybackDoneToken(token);
      revealTokenRef.current = token;
      setHistoricalSkipToken(token);
    });
  }, [
    publicState,
    playbackDoneToken,
    historicalSkipToken,
  ]);

  const resetField = useCallback(() => {
    revealTokenRef.current = null;
    setHistoricalSkipToken(null);
    setRevealField(null);
    setPlaybackDoneToken(null);
  }, []);

  const field =
    revealField !== null
      ? revealField
      : waitingField ?? emptyField();

  const isFieldAnimating = revealField !== null;
  const myPlaced = displayReady[mySeat];
  const bothPlaced = displayReady[0] && displayReady[1];

  const isHandLocked =
    myPlaced ||
    bothPlaced ||
    decisivePlaybackPending ||
    (isFieldAnimating && publicState.lastReveal !== null);

  return {
    field,
    resetField,
    isHandLocked,
    isFieldAnimating,
    isRevealPlayback: isHandLocked,
  };
}
