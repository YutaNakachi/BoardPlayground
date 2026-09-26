import { NextResponse } from "next/server";
import { Resend } from "resend";
import { apiError } from "@/lib/api/errors";
import { getContactEnv, isContactConfigured } from "@/lib/contact/config";
import { parseContactBody, validateContactPayload } from "@/lib/contact/validate";
import { formatContactFrom } from "@/lib/contact/resend-send";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isContactConfigured()) {
    return apiError("現在お問い合わせを受け付けられません", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("リクエストが不正です", 400);
  }

  const payload = parseContactBody(body);
  if (!payload) {
    return apiError("必須項目が不足しています", 400);
  }

  if (payload.company) {
    return NextResponse.json({ ok: true });
  }

  const validationError = validateContactPayload(payload);
  if (validationError) {
    return apiError(validationError, 400);
  }

  const { resendApiKey, fromEmail, toEmail } = getContactEnv();
  const resend = new Resend(resendApiKey);
  const sentAt = new Date().toISOString();

  const text = [
    `${SITE_NAME} お問い合わせ`,
    "",
    `送信日時: ${sentAt}`,
    `お名前: ${payload.name}`,
    `返信先: ${payload.email}`,
    "",
    "本文:",
    payload.message,
  ].join("\n");

  const { error: notifyError } = await resend.emails.send({
    from: formatContactFrom(fromEmail),
    to: toEmail,
    replyTo: payload.email,
    subject: `【${SITE_NAME}】お問い合わせ: ${payload.name}`,
    text,
  });

  if (notifyError) {
    console.error("contact notify failed", notifyError);
    return apiError("送信に失敗しました。時間をおいて再度お試しください", 503);
  }

  return NextResponse.json({ ok: true });
}
