import type { Metadata } from "next";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { LegalDocument } from "@/components/LegalDocument";
import { PageContainer } from "@/components/PageContainer";
import {
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
} from "@/content/legal/privacy-sections";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}における個人情報の取扱いについて`,
};

export default function PrivacyPage() {
  return (
    <PageContainer>
      <BackToHomeLink />
      <h1 className="mt-4 text-3xl font-bold">プライバシーポリシー</h1>
      <div className="mt-8">
        <LegalDocument sections={PRIVACY_SECTIONS} lastUpdated={PRIVACY_LAST_UPDATED} />
      </div>
    </PageContainer>
  );
}
