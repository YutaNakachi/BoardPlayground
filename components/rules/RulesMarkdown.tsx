type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; rows: string[][] };

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const chunks = content.split(/\n{2,}/);

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    if (lines.every((line) => line.trim().startsWith("|"))) {
      const rows = lines
        .filter((line) => !/^\|\s*[-:]+/.test(line.trim()))
        .map((line) =>
          line
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim())
        );
      if (rows.length > 0) {
        blocks.push({ type: "table", rows });
        continue;
      }
    }

    if (lines.every((line) => line.trim().startsWith("- "))) {
      blocks.push({
        type: "list",
        items: lines.map((line) => line.trim().slice(2)),
      });
      continue;
    }

    blocks.push({ type: "paragraph", text: trimmed.replace(/\n/g, " ") });
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
          return <p key={index}>{block.text}</p>;
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
                      {cell}
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
                        {cell}
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
