"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaPickerDialog } from "@/components/dashboard/MediaPickerDialog";
import { slugify } from "@/lib/utils/slug";
import { calculateReadingTime } from "@/lib/utils/reading-time";
import type { Block, Category, Tag, Post, PostStatus } from "@/lib/data/types";

// Load BlockEditor only on the client to keep public-page bundles clean
const BlockEditor = dynamic(() => import("@/components/editor/BlockEditor"), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  ),
});

export interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: Block[];
  categoryId: string;
  tagIds: string[];
  coverImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  status: PostStatus;
}

interface PostFormProps {
  initial?: Partial<Post>;
  categories: Category[];
  tags: Tag[];
  onSave: (data: PostFormData) => Promise<void>;
  saving?: boolean;
}

export function PostForm({
  initial,
  categories,
  tags,
  onSave,
  saving = false,
}: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugLocked, setSlugLocked] = useState(!!initial?.slug);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState<Block[]>(initial?.content ?? []);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [coverImageUrl, setCoverImageUrl] = useState(
    initial?.coverImageUrl ?? ""
  );
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initial?.metaDescription ?? ""
  );
  const [status, setStatus] = useState<PostStatus>(
    initial?.status ?? "draft"
  );
  const [readingTime, setReadingTime] = useState<number>(
    initial?.readingTime ?? 1
  );
  const [error, setError] = useState<string | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  function handleTitleBlur() {
    if (!slugLocked && title) {
      setSlug(slugify(title));
    }
  }

  const handleContentChange = useCallback((blocks: Block[]) => {
    setContent(blocks);
    setReadingTime(calculateReadingTime(blocks));
  }, []);

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSave({
        title,
        slug,
        excerpt,
        content,
        categoryId,
        tagIds,
        coverImageUrl,
        metaTitle,
        metaDescription,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Core fields */}
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="My amazing post"
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slug">Slug *</Label>
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setSlugLocked((v) => !v)}
              >
                {slugLocked ? "Edit" : "Lock"}
              </button>
            </div>
            <Input
              id="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={slugLocked}
              placeholder="my-amazing-post"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              title="Lowercase alphanumeric with hyphens"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary of the post…"
              maxLength={300}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {excerpt.length}/300
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId || "__none__"}
                onValueChange={(v) => setCategoryId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PostStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="coverImageUrl"
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCoverPickerOpen(true)}
              >
                Browse Library
              </Button>
            </div>
          </div>

          <MediaPickerDialog
            open={coverPickerOpen}
            onOpenChange={setCoverPickerOpen}
            onSelect={(url) => setCoverImageUrl(url)}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      {tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className={`flex items-center gap-1.5 cursor-pointer rounded-full px-3 py-1 text-sm border transition-colors ${
                    tagIds.includes(tag.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content</CardTitle>
            <span className="text-sm text-muted-foreground">
              ~{readingTime} min read
            </span>
          </div>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          <BlockEditor
            initialContent={initial?.content ?? undefined}
            onChange={handleContentChange}
          />
        </CardContent>
      </Card>

      {/* SEO fields */}
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">
              Meta Title{" "}
              <span className="text-muted-foreground font-normal">
                ({metaTitle.length}/70)
              </span>
            </Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={70}
              placeholder="Leave blank to use post title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">
              Meta Description{" "}
              <span className="text-muted-foreground font-normal">
                ({metaDescription.length}/160)
              </span>
            </Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Leave blank to use excerpt"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Post"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
