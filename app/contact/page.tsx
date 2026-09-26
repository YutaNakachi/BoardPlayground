import type { Metadata } from "next";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { ContactForm } from "@/components/ContactForm";
import { PageContainer } from "@/components/PageContainer";
import { isContactConfigured } from "@/lib/contact/config";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: `${SITE_NAME}へのお問い合わせフォーム`,
};

export default function ContactPage() {
  const configured = isContactConfigured();

  return (
    <PageContainer className="max-w-2xl">
      <BackToHomeLink />
      <h1 className="mt-4 text-3xl font-bold">お問い合わせ</h1>
      <p className="mt-4 leading-relaxed text-slate-300">
        不具合の報告、ご意見・ご要望などは以下のフォームからお送りください。返信が必要な場合は、入力いただいたメールアドレス宛にご連絡します。
      </p>
      <div className="relative mt-8">
        <ContactForm configured={configured} />
      </div>
    </PageContainer>
  );
}
