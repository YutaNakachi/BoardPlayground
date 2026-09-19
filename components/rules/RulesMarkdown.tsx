import type { ReactNode } from "react";

type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; rows: string[][] };

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
    );

  return rows.length > 0 ? { type: "table", rows } : null;
}

function parseLinesIntoBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

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
      !isOrderedListLine(lines[index])
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
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
