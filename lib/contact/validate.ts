const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  company?: string;
};

export function parseContactBody(body: unknown): ContactPayload | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const company = typeof raw.company === "string" ? raw.company.trim() : "";
  if (!name || !email || !message) return null;
  return { name, email, message, company };
}

export function validateContactPayload(payload: ContactPayload): string | null {
  if (payload.name.length < 1 || payload.name.length > 80) {
    return "名前は1〜80文字で入力してください";
  }
  if (!EMAIL_RE.test(payload.email) || payload.email.length > 254) {
    return "メールアドレスの形式が正しくありません";
  }
  if (payload.message.length < 1 || payload.message.length > 5000) {
    return "お問い合わせ内容は1〜5000文字で入力してください";
  }
  return null;
}
