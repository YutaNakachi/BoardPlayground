import type { Metadata } from "next";
import Link from "next/link";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { PageContainer } from "@/components/PageContainer";
import { SITE_CONTACT_PATH, SITE_GUIDE_PATH, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "ヘルプ",
  description: `${SITE_NAME}のよくある質問（ランキング・オンライン部屋・表示について）`,
};

type FaqItem = { question: string; answer: string };

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "登録やログインは必要ですか？",
    answer: "不要です。ブラウザでページを開くだけで遊べます。",
  },
  {
    question: "プレイ回数ランキングはどう数えられますか？",
    answer:
      "プレイ画面でゲームを開始したタイミングで1回カウントされます。日本時間（JST）の日付で集計し、週間・月間などの期間別ランキングを表示します。統計用のサーバー設定が有効なときのみ記録・表示されます。",
  },
  {
    question: "オンライン対戦の部屋はどう使いますか？",
    answer:
      "オンライン対応の2人ゲームでは、プレイ画面で「オンライン」を選びます。部屋を作る側は表示されたコードを相手に伝え、相手は「部屋に入る」でコードと表示名を入力します。合言葉を設定した部屋もあります。2人揃ったらホストがゲーム開始します。",
  },
  {
    question: "「オンライン可」の表示が出ない・オンラインタブがない",
    answer:
      "オンライン部屋はサーバー（Supabase 等）の設定が有効なときだけ利用できます。未設定や障害時は、一覧の「オンライン可」バッジ・絞り込み・プレイ画面のオンライン切替は表示されません。ローカルプレイは引き続き利用できます。",
  },
  {
    question: "同じ端末で2人で遊ぶには？",
    answer:
      "プレイ画面でローカルを選び「ゲーム開始」してください。手番が交代するたびに、画面の指示に従って操作します。",
  },
  {
    question: "不具合や要望を伝えたい",
    answer: `サイト上のお問い合わせフォーム（${SITE_CONTACT_PATH}）からご連絡ください。メールアドレスの公開掲示はしていません。`,
  },
];

export default function HelpPage() {
  return (
    <PageContainer>
      <BackToHomeLink />
      <h1 className="mt-4 text-3xl font-bold">ヘルプ</h1>
      <p className="mt-4 leading-relaxed text-slate-300">
        {SITE_NAME}のよくある質問です。概要は
        <Link href={SITE_GUIDE_PATH} className="text-accent hover:underline">
          このサイトについて
        </Link>
        もご覧ください。
      </p>

      <dl className="mt-10 space-y-8">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question}>
            <dt className="text-lg font-semibold text-white">{item.question}</dt>
            <dd className="mt-2 leading-relaxed text-slate-300">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </PageContainer>
  );
}
