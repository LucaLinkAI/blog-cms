import type { Block } from "@/lib/data/types";

/**
 * Extract plain text from a BlockNote Block[] JSON array.
 * Recursively collects text from all inline content nodes.
 */
function extractText(blocks: Block[]): string {
  const parts: string[] = [];

  function processBlock(block: Block) {
    if (!block) return;

    // Process inline content (text nodes)
    if (Array.isArray(block.content)) {
      for (const node of block.content) {
        if (node?.type === "text" && typeof node.text === "string") {
          parts.push(node.text);
        } else if (node?.type === "link" && Array.isArray(node.content)) {
          // Links contain inline text nodes
          for (const child of node.content) {
            if (child?.type === "text" && typeof child.text === "string") {
              parts.push(child.text);
            }
          }
        }
      }
    }

    // Process nested child blocks (e.g., list items with sub-items)
    if (Array.isArray(block.children)) {
      for (const child of block.children) {
        processBlock(child);
      }
    }
  }

  for (const block of blocks) {
    processBlock(block);
  }

  return parts.join(" ");
}

/**
 * Calculate estimated reading time in minutes.
 * Uses 200 words-per-minute reading speed.
 * Returns a minimum of 1 minute.
 */
export function calculateReadingTime(blocks: Block[] | null): number {
  if (!blocks || blocks.length === 0) return 1;

  const text = extractText(blocks);
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return Math.max(1, Math.ceil(wordCount / 200));
}
