"use client";

import { createReactBlockSpec } from "@blocknote/react";

export const BlockquoteBlock = createReactBlockSpec(
  {
    type: "blockquote" as const,
    propSchema: {},
    content: "inline",
  },
  {
    render: ({ contentRef }) => (
      <blockquote
        ref={contentRef}
        className="border-l-4 border-border pl-4 italic text-muted-foreground"
      />
    ),
  }
);
