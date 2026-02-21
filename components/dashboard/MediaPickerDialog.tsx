"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MediaGrid } from "@/components/dashboard/MediaGrid";
import type { MediaItem } from "@/lib/data/types";

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the selected URL when user confirms. */
  onSelect: (url: string) => void;
}

type Tab = "library" | "url";

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: MediaPickerDialogProps) {
  const [tab, setTab] = useState<Tab>("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedId(undefined);
    setUrlInput("");
    setLoading(true);
    fetch("/api/media?pageSize=50")
      .then((r) => r.json())
      .then((data) => setItems(data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  function handleLibraryConfirm() {
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    onSelect(item.url);
    onOpenChange(false);
  }

  function handleUrlConfirm() {
    const url = urlInput.trim();
    if (!url) return;
    onSelect(url);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>

        {/* Tab strip */}
        <div className="flex gap-1 border-b pb-0 -mb-px">
          {(["library", "url"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "library" ? "Media Library" : "Enter URL"}
            </button>
          ))}
        </div>

        {tab === "library" && (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Loading…
                </p>
              ) : (
                <MediaGrid
                  items={items}
                  onSelect={(item) => setSelectedId(item.id)}
                  selectedId={selectedId}
                />
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleLibraryConfirm}
                disabled={!selectedId}
              >
                Insert Selected
              </Button>
            </div>
          </div>
        )}

        {tab === "url" && (
          <div className="flex flex-col gap-3 pt-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end">
              <Button
                onClick={handleUrlConfirm}
                disabled={!urlInput.trim()}
              >
                Use URL
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
