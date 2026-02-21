"use client";

import { createReactBlockSpec } from "@blocknote/react";

export const CalloutBlock = createReactBlockSpec(
  {
    type: "callout" as const,
    propSchema: {
      icon: { default: "💡" },
      type: {
        default: "info" as "info" | "warning" | "error",
        values: ["info", "warning", "error"] as const,
      },
    },
    content: "inline",
  },
  {
    render: ({ block, contentRef }) => {
      const colors: Record<string, string> = {
        info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        warning:
          "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
        error:
          "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
      };
      const cls = colors[block.props.type] ?? colors.info;
      return (
        <div
          className={`callout callout--${block.props.type} flex gap-3 rounded-lg border p-4 ${cls}`}
        >
          <span className="text-xl select-none">{block.props.icon}</span>
          <div ref={contentRef} className="flex-1 min-w-0" />
        </div>
      );
    },
  }
);
