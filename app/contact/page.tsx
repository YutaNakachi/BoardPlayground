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
      <div className="mt-4 space-y-3 leading-relaxed text-slate-300">
        <p>不具合のご報告や、各種ご意見・ご要望は以下のフォームよりお送りください。</p>
        <p>返信が必要な場合は、ご入力いただいたメールアドレスへご連絡いたします。</p>
        <p>
          また、お仕事のご依頼やご相談につきましても同フォームよりお気軽にお問い合わせください。
        </p>
      </div>
      <div className="relative mt-8">
        <ContactForm configured={configured} />
      </div>
    </PageContainer>
  );
}
