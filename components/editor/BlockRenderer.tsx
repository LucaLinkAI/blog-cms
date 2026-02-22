/**
 * Server-side block renderer — converts BlockNote JSON to HTML without
 * loading the editor bundle. Safe for SSR / static generation.
 */
import { type Block } from "@/lib/data/types";

// ——— Inline content helpers ———

interface InlineText {
  type: "text";
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    code?: boolean;
  };
}

interface InlineLink {
  type: "link";
  href: string;
  content: InlineText[];
}

type InlineContent = InlineText | InlineLink;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInline(content: InlineContent[]): string {
  return content
    .map((node) => {
      if (node.type === "link") {
        const inner = renderInline(node.content);
        return `<a href="${escapeHtml(node.href)}" class="text-primary underline">${inner}</a>`;
      }
      let text = escapeHtml(node.text ?? "");
      const s = node.styles ?? {};
      if (s.code) text = `<code class="rounded bg-muted px-1 py-0.5 text-sm font-mono">${text}</code>`;
      if (s.bold) text = `<strong>${text}</strong>`;
      if (s.italic) text = `<em>${text}</em>`;
      if (s.underline) text = `<u>${text}</u>`;
      if (s.strikethrough) text = `<s>${text}</s>`;
      return text;
    })
    .join("");
}

function getInlineContent(block: Record<string, unknown>): string {
  const content = block.content;
  if (!Array.isArray(content)) return "";
  return renderInline(content as InlineContent[]);
}

// ——— Block renderers ———

function renderBlock(block: Record<string, unknown>, depth = 0): string {
  const type = block.type as string;
  const props = (block.props ?? {}) as Record<string, unknown>;
  const children = Array.isArray(block.children) ? block.children as Record<string, unknown>[] : [];
  const inner = getInlineContent(block);

  switch (type) {
    case "paragraph":
      return `<p>${inner}</p>`;

    case "heading": {
      const level = (props.level as number) ?? 1;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      return `<${tag}>${inner}</${tag}>`;
    }

    case "bulletListItem": {
      const childHtml = children.length
        ? `<ul>${children.map((c) => renderBlock(c, depth + 1)).join("")}</ul>`
        : "";
      return `<li>${inner}${childHtml}</li>`;
    }

    case "numberedListItem": {
      const childHtml = children.length
        ? `<ol>${children.map((c) => renderBlock(c, depth + 1)).join("")}</ol>`
        : "";
      return `<li>${inner}${childHtml}</li>`;
    }

    case "checkListItem": {
      const checked = props.checked === true;
      const checkbox = `<input type="checkbox" disabled${checked ? " checked" : ""} class="mr-2"/>`;
      return `<li class="list-none">${checkbox}${inner}</li>`;
    }

    case "image": {
      const url = escapeHtml((props.url as string) ?? "");
      const caption = escapeHtml((props.caption as string) ?? "");
      const alt = caption || "Image";
      if (!url) return "";
      return `<figure><img src="${url}" alt="${alt}" class="rounded-lg max-w-full"/>${caption ? `<figcaption class="text-center text-sm text-muted-foreground mt-2">${caption}</figcaption>` : ""}</figure>`;
    }

    case "codeBlock": {
      const lang = escapeHtml((props.language as string) ?? "");
      return `<pre class="not-prose rounded-lg bg-zinc-950 p-4 overflow-x-auto text-zinc-100 text-sm font-mono leading-relaxed"><code${lang ? ` class="language-${lang}"` : ""}>${inner}</code></pre>`;
    }

    case "quote":
    case "blockquote":
      return `<blockquote class="border-l-4 border-border pl-4 italic text-muted-foreground">${inner}</blockquote>`;

    case "callout": {
      const icon = escapeHtml((props.icon as string) ?? "💡");
      const calloutType = (props.type as string) ?? "info";
      const colors: Record<string, string> = {
        info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
        error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
      };
      const cls = colors[calloutType] ?? colors.info;
      return `<div class="flex gap-3 rounded-lg border p-4 ${cls}"><span class="text-xl">${icon}</span><div>${inner}</div></div>`;
    }

    case "divider":
      return `<hr class="my-4 border-border"/>`;

    case "table": {
      const rows = (props.rows as { cells: InlineContent[][] }[] | undefined) ?? [];
      if (!rows.length) return "";
      const [headerRow, ...bodyRows] = rows;
      const head = headerRow
        ? `<thead><tr>${headerRow.cells.map((cell) => `<th class="border border-border px-4 py-2 text-left font-semibold">${renderInline(cell)}</th>`).join("")}</tr></thead>`
        : "";
      const body = bodyRows
        .map(
          (row) =>
            `<tr>${row.cells.map((cell) => `<td class="border border-border px-4 py-2">${renderInline(cell)}</td>`).join("")}</tr>`
        )
        .join("");
      return `<div class="overflow-x-auto"><table class="w-full border-collapse">${head}<tbody>${body}</tbody></table></div>`;
    }

    default:
      // Unknown block — render children if any, otherwise skip
      if (children.length) {
        return children.map((c) => renderBlock(c, depth + 1)).join("");
      }
      return inner ? `<p>${inner}</p>` : "";
  }
}

// ——— Group consecutive list items ———

function groupBlocks(blocks: Record<string, unknown>[]): string {
  const result: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    const type = block.type as string;

    if (type === "bulletListItem") {
      const items: string[] = [];
      while (i < blocks.length && (blocks[i].type as string) === "bulletListItem") {
        items.push(renderBlock(blocks[i]));
        i++;
      }
      result.push(`<ul class="list-disc pl-6">${items.join("")}</ul>`);
    } else if (type === "numberedListItem") {
      const items: string[] = [];
      while (i < blocks.length && (blocks[i].type as string) === "numberedListItem") {
        items.push(renderBlock(blocks[i]));
        i++;
      }
      result.push(`<ol class="list-decimal pl-6">${items.join("")}</ol>`);
    } else if (type === "checkListItem") {
      const items: string[] = [];
      while (i < blocks.length && (blocks[i].type as string) === "checkListItem") {
        items.push(renderBlock(blocks[i]));
        i++;
      }
      result.push(`<ul class="pl-2">${items.join("")}</ul>`);
    } else {
      result.push(renderBlock(block));
      i++;
    }
  }

  return result.join("\n");
}

// ——— Component ———

interface BlockRendererProps {
  blocks: Block[] | null;
  className?: string;
}

export function BlockRenderer({ blocks, className }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const html = groupBlocks(blocks as Record<string, unknown>[]);

  return (
    <div
      className={`prose dark:prose-invert max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
