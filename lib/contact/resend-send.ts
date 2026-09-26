import { SITE_NAME } from "@/lib/site";

export function formatContactFrom(fromEmail: string): string {
  return `${SITE_NAME} <${fromEmail}>`;
}

/** ドメイン認証前の Resend テスト送信元判定（受付確認メール有効化時に利用） */
export function isResendSandboxFrom(fromEmail: string): boolean {
  return fromEmail.toLowerCase().endsWith("@resend.dev");
}
