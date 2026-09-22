"use client";

import { getPlayerTurnStyle } from "@/lib/player-colors";

type Props = {
  playerIndex: number;
  playerLabel: string;
  stats?: string;
  action?: string;
  notice?: string;
};

function BannerLine({
  text,
  className,
  first,
}: {
  text?: string;
  className: string;
  first?: boolean;
}) {
  const visible = Boolean(text);
  return (
    <p
      className={`${first ? "mt-2" : "mt-1"} min-h-[1.25rem] pl-7 text-sm ${visible ? className : "invisible"}`}
    >
      {text || "\u00A0"}
    </p>
  );
}

export function TurnBanner({
  playerIndex,
  playerLabel,
  stats,
  action,
  notice,
}: Props) {
  const style = getPlayerTurnStyle(playerIndex);

  return (
    <div
      className={`rounded-2xl border-2 px-4 py-4 ${style.border} ${style.bg} ${style.glow}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`flex h-3.5 w-3.5 shrink-0 animate-pulse rounded-full ${style.dot} ${style.dotShadow}`}
          aria-hidden
        />
        <p className="font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">
          <span className={style.label}>{playerLabel}</span>
          <span className="text-slate-200">の手番</span>
        </p>
      </div>
      <BannerLine text={stats} className="text-slate-400" first />
      <BannerLine text={action} className={`font-medium ${style.label}`} />
      <BannerLine text={notice} className="text-amber-200" />
    </div>
  );
}
