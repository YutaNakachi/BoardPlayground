"use client";

import { useRef } from "react";
import { normalizeRoomCodeInput } from "@/lib/online/room-code";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function RoomCodeInput({ id, value, onChange, required }: Props) {
  const composingRef = useRef(false);

  return (
    <input
      id={id}
      name="room-code"
      type="text"
      inputMode="text"
      autoCapitalize="characters"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint="next"
      lang="en"
      value={value}
      required={required}
      maxLength={6}
      onChange={(event) => {
        const next = event.target.value;
        if (composingRef.current) {
          onChange(next);
          return;
        }
        onChange(normalizeRoomCodeInput(next));
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(event) => {
        composingRef.current = false;
        onChange(normalizeRoomCodeInput(event.currentTarget.value));
      }}
      className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base font-mono tracking-widest text-white"
      placeholder="ABC123"
    />
  );
}
