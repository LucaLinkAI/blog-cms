"use client";

import { createReactBlockSpec } from "@blocknote/react";

export const DividerBlock = createReactBlockSpec(
  {
    type: "divider" as const,
    propSchema: {},
    content: "none",
  },
  {
    render: () => <hr className="my-4 border-border" />,
  }
);
