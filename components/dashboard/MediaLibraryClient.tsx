"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/dashboard/MediaGrid";
import type { MediaItem } from "@/lib/data/types";

interface MediaLibraryClientProps {
  initialItems: MediaItem[];
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
];

export function MediaLibraryClient({ initialItems }: MediaLibraryClientProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUploadClick() {
    setUploadMsg(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = "";

    setUploading(true);
    setUploadMsg(null);

    // Pick bucket based on MIME type
    const bucket = file.type.startsWith("video/")
      ? "post-content"
      : "post-covers";

    const fd = new FormData();
    fd.append("file", file);
    fd.append("bucket", bucket);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: fd,
      });

      if (res.status === 201) {
        const item: MediaItem = await res.json();
        setItems((prev) => [item, ...prev]);
        setUploadMsg({ type: "success", text: `"${file.name}" uploaded.` });
      } else if (res.status === 413) {
        setUploadMsg({ type: "error", text: "File is too large for this bucket." });
      } else {
        const err = await res.json();
        setUploadMsg({
          type: "error",
          text: err.error ?? "Upload failed.",
        });
      }
    } catch {
      setUploadMsg({ type: "error", text: "Network error during upload." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={handleUploadClick} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload File"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileChange}
          aria-label="Upload media file"
        />
        {uploadMsg && (
          <p
            className={`text-sm ${
              uploadMsg.type === "success"
                ? "text-green-600"
                : "text-destructive"
            }`}
          >
            {uploadMsg.text}
          </p>
        )}
      </div>

      <MediaGrid items={items} />
    </div>
  );
}
