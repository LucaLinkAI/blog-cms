import Image from "next/image";
import { type MediaItem } from "@/lib/data/types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface MediaGridProps {
  items: MediaItem[];
  onSelect?: (item: MediaItem) => void;
  selectedId?: string;
}

export function MediaGrid({ items, onSelect, selectedId }: MediaGridProps) {
  const isPickerMode = !!onSelect;

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No media items yet. Upload your first file above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          role={isPickerMode ? "button" : undefined}
          tabIndex={isPickerMode ? 0 : undefined}
          aria-pressed={isPickerMode ? selectedId === item.id : undefined}
          className={`relative rounded-lg border overflow-hidden transition-colors ${
            isPickerMode ? "cursor-pointer" : ""
          } ${
            selectedId === item.id
              ? "ring-2 ring-primary border-primary"
              : isPickerMode
              ? "hover:border-primary/50"
              : ""
          }`}
          onClick={() => onSelect?.(item)}
          onKeyDown={(e) => {
            if (isPickerMode && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onSelect?.(item);
            }
          }}
        >
          <div className="aspect-square relative bg-muted">
            <Image
              src={item.url}
              alt={item.altText ?? item.filename}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          </div>
          <div className="p-2 text-xs space-y-0.5">
            <p className="truncate font-medium" title={item.filename}>
              {item.filename}
            </p>
            <p className="text-muted-foreground">
              {formatBytes(item.sizeBytes)} · {formatDate(item.createdAt)}
            </p>
          </div>
          {selectedId === item.id && (
            <div
              aria-hidden="true"
              className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
            >
              ✓
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
