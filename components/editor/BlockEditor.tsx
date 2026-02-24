"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
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

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", "post-content");

  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Upload failed");
  }

  const media = await res.json();
  return media.url as string;
}

export default function BlockEditor({
  initialContent,
  onChange,
  editable = true,
}: BlockEditorProps) {
  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent?.length ? initialContent : undefined,
    uploadFile,
  });

  const isMediaPickerOpen = useUiStore((s) => s.isMediaPickerOpen);
  const openMediaPicker = useUiStore((s) => s.openMediaPicker);
  const closeMediaPicker = useUiStore((s) => s.closeMediaPicker);

  function handleMediaSelect(url: string) {
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
