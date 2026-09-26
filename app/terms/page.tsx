import type { Metadata } from "next";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { LegalDocument } from "@/components/LegalDocument";
import { PageContainer } from "@/components/PageContainer";
import { TERMS_LAST_UPDATED, TERMS_SECTIONS } from "@/content/legal/terms-sections";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "利用規約",
  description: `${SITE_NAME}の利用条件`,
};

export default function TermsPage() {
  return (
    <PageContainer>
      <BackToHomeLink />
      <h1 className="mt-4 text-3xl font-bold">利用規約</h1>
      <div className="mt-8">
        <LegalDocument sections={TERMS_SECTIONS} lastUpdated={TERMS_LAST_UPDATED} />
      </div>
    </PageContainer>
  );
}
