import type { ReactNode } from "react";

type Block =
  | { type: "heading"; level: 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "meta-summary"; items: { label: string; value: string }[] }
  | { type: "table"; rows: string[][] };

function parseHeadingLine(line: string): { level: 3 | 4 | 5 | 6; text: string } | null {
  const match = /^(#{3,6})\s+(.+)$/.exec(line.trim());
  if (!match) return null;
  const level = match[1].length as 3 | 4 | 5 | 6;
  return { level, text: match[2].trim() };
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={index} className="font-semibold text-slate-200">
          {bold[1]}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function isUnorderedListLine(line: string): boolean {
  return /^-\s/.test(line.trim());
}

function isOrderedListLine(line: string): boolean {
  return /^\d+\.\s/.test(line.trim());
}

const HIDDEN_RULE_TABLE_ROWS = new Set(["ジャンル"]);

function isMetaSummaryTable(rows: string[][]): boolean {
  if (rows.length < 2) return false;
  const [header, ...body] = rows;
  if (header.length !== 2 || header[0] !== "項目" || header[1] !== "内容") {
    return false;
  }
  return body.every((row) => row.length === 2);
}

function parseTableBlock(lines: string[]): Block | null {
  if (!lines.every((line) => line.trim().startsWith("|"))) {
    return null;
  }

  const rows = lines
    .filter((line) => !/^\|\s*[-:]+/.test(line.trim()))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
    )
    .filter((row, index) => index === 0 || !HIDDEN_RULE_TABLE_ROWS.has(row[0] ?? ""));

  if (rows.length === 0) return null;

  if (isMetaSummaryTable(rows)) {
    const [, ...body] = rows;
    return {
      type: "meta-summary",
      items: body.map(([label, value]) => ({ label, value })),
    };
  }

  return { type: "table", rows };
}

function parseLinesIntoBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const heading = parseHeadingLine(line);
    if (heading) {
      blocks.push({ type: "heading", ...heading });
      index += 1;
      continue;
    }

    if (isUnorderedListLine(line)) {
      const items: string[] = [];
      while (index < lines.length && isUnorderedListLine(lines[index])) {
        items.push(lines[index].trim().replace(/^-\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    if (isOrderedListLine(line)) {
      const items: string[] = [];
      while (index < lines.length && isOrderedListLine(lines[index])) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      !isUnorderedListLine(lines[index]) &&
      !isOrderedListLine(lines[index]) &&
      !parseHeadingLine(lines[index])
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    const text = paragraphLines.join(" ").trim();
    if (text) {
      blocks.push({ type: "paragraph", text });
    }
  }

  return blocks;
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const chunks = content.split(/\n{2,}/);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    const table = parseTableBlock(lines);
    if (table) {
      blocks.push(table);
      continue;
    }

    blocks.push(...parseLinesIntoBlocks(lines));
  }

  return blocks;
}

type Props = {
  content: string;
  className?: string;
};

export function RulesMarkdown({ content, className = "" }: Props) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 text-slate-300 leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const headingClass =
            block.level === 3
              ? "mt-2 text-base font-semibold text-slate-100"
              : block.level === 4
                ? "mt-1 text-sm font-semibold text-slate-100"
                : "mt-1 text-sm font-semibold text-slate-200";
          if (block.level === 3) {
            return (
              <h3 key={index} className={headingClass}>
                {renderInline(block.text)}
              </h3>
            );
          }
          if (block.level === 4) {
            return (
              <h4 key={index} className={headingClass}>
                {renderInline(block.text)}
              </h4>
            );
          }
          if (block.level === 5) {
            return (
              <h5 key={index} className={headingClass}>
                {renderInline(block.text)}
              </h5>
            );
          }
          return (
            <h6 key={index} className={headingClass}>
              {renderInline(block.text)}
            </h6>
          );
        }

        if (block.type === "paragraph") {
          return <p key={index}>{renderInline(block.text)}</p>;
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          const listClass = block.ordered
            ? "list-decimal space-y-2 pl-5"
            : "list-disc space-y-2 pl-5";
          return (
            <ListTag key={index} className={listClass}>
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "meta-summary") {
          return (
            <p key={index} className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
              {block.items.map((item) => (
                <span key={item.label}>
                  <span className="text-slate-500">{item.label}</span>
                  <span className="ml-1.5">{renderInline(item.value)}</span>
                </span>
              ))}
            </p>
          );
        }

        const [header, ...body] = block.rows;
        return (
          <div key={index} className="overflow-x-auto">
            <table className="w-full min-w-[16rem] border-collapse text-sm">
              <thead>
                <tr>
                  {header.map((cell) => (
                    <th
                      key={cell}
                      className="border border-surface-border bg-surface px-3 py-2 text-left font-semibold text-slate-200"
                    >
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="border border-surface-border px-3 py-2 align-top"
                      >
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
