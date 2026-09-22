import { BackToHomeLink } from "@/components/BackToHomeLink";
import { PageContainer } from "@/components/PageContainer";

export default function RankingLoading() {
  return (
    <PageContainer>
      <BackToHomeLink />
      <h1 className="mt-4 text-2xl font-bold">プレイ回数ランキング</h1>
      <p className="mt-2 text-sm text-slate-400">
        ゲーム開始時にカウントされます（JST 基準）
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {["日間", "週間", "月間", "全期間"].map((label) => (
          <span
            key={label}
            className="inline-flex min-h-9 items-center rounded-full bg-white/10 px-4 text-sm text-slate-500 ring-1 ring-white/10"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-8 space-y-3" aria-busy="true" aria-label="ランキングを読み込み中">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10"
          />
        ))}
      </div>
    </PageContainer>
  );
}
