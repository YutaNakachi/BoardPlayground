import type { LegalSection } from "@/content/legal/privacy-sections";

type Props = {
  sections: LegalSection[];
  lastUpdated: string;
};

export function LegalDocument({ sections, lastUpdated }: Props) {
  return (
    <div className="space-y-10 text-slate-300">
      <p className="text-sm text-slate-500">最終更新: {lastUpdated}</p>
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xl font-semibold text-white">{section.title}</h2>
          <div className="mt-3 space-y-3 leading-relaxed">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.list ? (
              <ul className="list-disc space-y-2 pl-5">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
