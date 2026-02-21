"use client";

import "@blocknote/shadcn/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { schema } from "./schema";
import { useUiStore } from "@/store/ui";
import { MediaPickerDialog } from "@/components/dashboard/MediaPickerDialog";
import { Button } from "@/components/ui/button";
import type { Block } from "@/lib/data/types";

interface BlockEditorProps {
  initialContent?: Block[];
  onChange: (blocks: Block[]) => void;
  editable?: boolean;
}

export default function BlockEditor({
  initialContent,
  onChange,
  editable = true,
}: BlockEditorProps) {
  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent?.length ? initialContent : undefined,
  });

  const isMediaPickerOpen = useUiStore((s) => s.isMediaPickerOpen);
  const openMediaPicker = useUiStore((s) => s.openMediaPicker);
  const closeMediaPicker = useUiStore((s) => s.closeMediaPicker);

  function handleMediaSelect(url: string) {
    // Insert an image block after the current cursor position
    const currentBlock = editor.getTextCursorPosition().block;
    editor.insertBlocks(
      [{ type: "image", props: { url } }],
      currentBlock,
      "after"
    );
  }

  return (
    <div className="space-y-2">
      {editable && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openMediaPicker}
          >
            Browse Media Library
          </Button>
        </div>
      )}

      <BlockNoteView
        editor={editor}
        onChange={() => onChange(editor.document as Block[])}
        editable={editable}
        theme="light"
      />

      <MediaPickerDialog
        open={isMediaPickerOpen}
        onOpenChange={(open) => {
          if (!open) closeMediaPicker();
        }}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
