"use client";

import Link from "next/link";
import { useState } from "react";
import { SITE_PRIVACY_PATH } from "@/lib/site";

type Props = {
  configured: boolean;
};

export function ContactForm({ configured }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!configured || status === "sending") return;

    setStatus("sending");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, company }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          typeof data.error === "string"
            ? data.error
            : "送信に失敗しました。時間をおいて再度お試しください"
        );
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setCompany("");
    } catch {
      setStatus("error");
      setErrorMessage("送信に失敗しました。時間をおいて再度お試しください");
    }
  }

  if (!configured) {
    return (
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        現在お問い合わせを受け付けられません。しばらくしてから再度お試しください。
      </p>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          送信しました。内容を確認のうえ、返信が必要な場合はご入力のメールアドレス宛にご連絡します。
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm text-slate-400 underline-offset-2 hover:text-white hover:underline"
        >
          別の内容を送る
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-slate-300">
          お名前またはニックネーム
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-white outline-none transition focus:border-accent/50"
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-slate-300">
          返信用メールアドレス
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-white outline-none transition focus:border-accent/50"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-slate-300">
          お問い合わせ内容
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={8}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-white outline-none transition focus:border-accent/50"
        />
      </div>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="contact-company">会社名</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-300" role="alert">{errorMessage}</p>
      ) : null}

      <p className="text-xs text-slate-500">
        送信内容は
        <Link href={SITE_PRIVACY_PATH} className="text-slate-400 underline-offset-2 hover:text-white hover:underline">
          プライバシーポリシー
        </Link>
        に基づき取り扱います。
      </p>

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-game min-h-11 px-8 disabled:opacity-60"
      >
        {status === "sending" ? "送信中…" : "送信する"}
      </button>
    </form>
  );
}
