/** 送信者向け受付確認メール（ドメイン認証後に API から有効化予定） */
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function buildContactAutoReplySubject(): string {
  return `【${SITE_NAME}】お問い合わせを受け付けました`;
}

export function buildContactAutoReplyText(name: string): string {
  const greeting = name ? `${name} 様` : "お客様";
  return [
    greeting,
    "",
    `${SITE_NAME} へのお問い合わせを受け付けました。`,
    "内容を確認のうえ、必要に応じてご入力いただいたメールアドレス宛にご連絡します。",
    "返信までお時間をいただく場合があります。",
    "",
    "このメールは送信の自動確認です。このメールアドレスへの返信はお受けできません。",
    "お急ぎの場合は、改めてサイトのお問い合わせフォームからご連絡ください。",
    "",
    SITE_URL,
  ].join("\n");
}
