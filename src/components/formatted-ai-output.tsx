import React from "react";

export function FormattedAiOutput({ text }: { text: string }) {
  if (!text) return null;

  const normalizedText = text.replace(/\r\n/g, "\n");
  const lines = normalizedText.split("\n");

  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;
  let tableRows: string[][] | null = null;
  let tableHeaders: string[] | null = null;

  const renderInline = (inlineText: string): React.ReactNode[] => {
    // Handle bold (**text**) and inline code (`code`)
    const parts = inlineText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      // Strip LaTeX-style math wrappers like $\le$ or $\ge$ → just render the text inside
      const stripped = part.replace(/\$([^$]+)\$/g, "$1").replace(/\\le\b/g, "≤").replace(/\\ge\b/g, "≥").replace(/\\leq\b/g, "≤").replace(/\\geq\b/g, "≥");
      return <span key={index}>{stripped}</span>;
    });
  };

  const parseTableRow = (line: string): string[] => {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  };

  const isTableSeparator = (line: string): boolean =>
    /^\|?[\s:|-]+\|/.test(line.trim()) && line.includes("-");

  const flushTable = (key: string | number) => {
    if (!tableHeaders || !tableRows) return;
    elements.push(
      <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {tableHeaders.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {renderInline(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, ri) => (
              <tr
                key={ri}
                className={`border-b border-border/60 transition-colors hover:bg-muted/30 ${ri % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
              >
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-3 text-sm text-foreground/90 leading-relaxed">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeaders = null;
    tableRows = null;
  };

  const flushList = (key: string | number) => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${key}`} className="my-3 list-disc pl-6 space-y-1.5 text-muted-foreground">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="pl-1">
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${key}`} className="my-3 list-decimal pl-6 space-y-1.5 text-muted-foreground">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="pl-1">
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Empty line — flush pending lists and tables
    if (trimmedLine === "") {
      flushList(i);
      // Don't flush table on empty line — table may have blank lines between rows
      continue;
    }

    // Table separator row (e.g. | :--- | :--- |) — skip rendering but mark headers done
    if (isTableSeparator(trimmedLine) && tableHeaders) {
      // separator marks end of header, start of body rows
      continue;
    }

    // Table row
    if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
      flushList(i);
      const cells = parseTableRow(trimmedLine);
      if (!tableHeaders) {
        tableHeaders = cells;
        tableRows = [];
      } else {
        tableRows!.push(cells);
      }
      continue;
    } else if (tableHeaders) {
      // Non-table line after table started — flush table
      flushTable(i);
    }

    // Horizontal rule
    if (/^-{3,}$/.test(trimmedLine) || /^\*{3,}$/.test(trimmedLine)) {
      flushList(i);
      elements.push(<div key={i} className="my-4 h-px bg-border" />);
      continue;
    }

    // Headers
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      flushList(i);
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const headerClasses =
        level === 1 ? "text-2xl font-bold font-display mt-6 mb-3 text-foreground" :
        level === 2 ? "text-xl font-bold font-display mt-5 mb-2.5 text-foreground border-b border-border pb-2" :
        level === 3 ? "text-base font-semibold font-display mt-4 mb-2 text-foreground" :
        "text-sm font-semibold font-display mt-3 mb-1 text-foreground";

      elements.push(
        React.createElement(
          `h${Math.min(level, 6)}`,
          { key: i, className: headerClasses },
          renderInline(content)
        )
      );
      continue;
    }

    // Unordered lists
    const ulMatch = trimmedLine.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (currentList && currentList.type !== "ul") flushList(i);
      if (!currentList) currentList = { type: "ul", items: [] };
      currentList.items.push(renderInline(ulMatch[1]));
      continue;
    }

    // Ordered lists
    const olMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (currentList && currentList.type !== "ol") flushList(i);
      if (!currentList) currentList = { type: "ol", items: [] };
      currentList.items.push(renderInline(olMatch[2]));
      continue;
    }

    // Paragraph
    flushList(i);
    elements.push(
      <p key={i} className="text-foreground/90 my-2.5 leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  flushList(lines.length);
  flushTable(lines.length);

  return <div className="space-y-1">{elements}</div>;
}
