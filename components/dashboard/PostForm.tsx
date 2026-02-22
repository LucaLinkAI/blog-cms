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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaPickerDialog } from "@/components/dashboard/MediaPickerDialog";
import { slugify } from "@/lib/utils/slug";
import { calculateReadingTime } from "@/lib/utils/reading-time";
import type { Block, Category, Tag, Post, PostStatus } from "@/lib/data/types";

const BlockEditor = dynamic(() => import("@/components/editor/BlockEditor"), {
  ssr: false,
  loading: () => (
    <div className="space-y-2 pt-4">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-1/2" />
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
  pageTitle?: string;
}

export function PostForm({
  initial,
  categories,
  tags,
  onSave,
  saving = false,
  pageTitle,
}: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugLocked, setSlugLocked] = useState(!!initial?.slug);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState<Block[]>(initial?.content ?? []);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [readingTime, setReadingTime] = useState<number>(initial?.readingTime ?? 1);
  const [error, setError] = useState<string | null>(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  const heading = pageTitle ?? (initial?.id ? "Edit Post" : "New Post");

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

  async function triggerSave(overrideStatus?: PostStatus) {
    setError(null);
    const effectiveStatus = overrideStatus ?? status;
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
        status: effectiveStatus,
      });
      if (overrideStatus) setStatus(overrideStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post.");
    }
  }

  const createdAt = initial?.createdAt
    ? new Date(initial.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Just now";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
          <span className="font-bold text-base hidden sm:block">{heading}</span>

          <div className="ml-auto flex items-center gap-2">
            {error && (
              <span className="text-xs text-destructive hidden md:block max-w-xs truncate">
                {error}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => triggerSave("draft")}
            >
              Save Draft
            </Button>
            {initial?.slug && (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={`/blog/${initial.slug}`} target="_blank" rel="noopener noreferrer">
                  Preview
                </a>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => triggerSave("published")}
            >
              {saving ? "Saving…" : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      {/* Error banner (mobile) */}
      {error && (
        <div
          role="alert"
          className="md:hidden mx-4 mt-3 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Two-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px]">

        {/* Left: writing area */}
        <div className="px-6 sm:px-10 py-8 lg:border-r space-y-0 min-w-0">
          {/* Title */}
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Post title…"
            maxLength={300}
            className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-4"
          />

          {/* Excerpt */}
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Write a brief excerpt or summary…"
            maxLength={300}
            rows={2}
            className="w-full resize-none bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/40 text-base mb-6"
          />

          <Separator className="mb-6" />

          {/* Block editor */}
          <div className="min-h-[400px]">
            <BlockEditor
              initialContent={initial?.content ?? undefined}
              onChange={handleContentChange}
            />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">~{readingTime} min read</p>
        </div>

        {/* Right: sidebar */}
        <div className="px-4 py-6 space-y-4 bg-muted/20">

          {/* Post Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Slug */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug" className="text-sm">Slug</Label>
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
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={slugLocked}
                  placeholder="my-amazing-post"
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  title="Lowercase alphanumeric with hyphens"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm">Category</Label>
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

              {/* Cover Image */}
              <div className="space-y-1.5">
                <Label htmlFor="coverImageUrl" className="text-sm">Cover Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="coverImageUrl"
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setCoverPickerOpen(true)}
                  >
                    Browse
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className={`flex items-center gap-1.5 cursor-pointer rounded-full px-3 py-1 text-xs border transition-colors ${
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
                </div>
              )}

              <MediaPickerDialog
                open={coverPickerOpen}
                onOpenChange={setCoverPickerOpen}
                onSelect={(url) => setCoverImageUrl(url)}
              />
            </CardContent>
          </Card>

          {/* Publishing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-sm">Status</Label>
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
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">Visibility</span>
                <span className="font-medium">Public</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{createdAt}</span>
              </div>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SEO Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-background p-3 text-sm space-y-1">
                <p className="font-medium text-foreground truncate">
                  {metaTitle || title || "Post title will appear here"}
                </p>
                <p className="text-muted-foreground text-xs line-clamp-2">
                  {metaDescription || excerpt || "Post excerpt will appear here as the meta description…"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="metaTitle" className="text-sm">
                  Meta Title{" "}
                  <span className="text-muted-foreground font-normal">({metaTitle.length}/70)</span>
                </Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={70}
                  placeholder="Leave blank to use post title"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="metaDescription" className="text-sm">
                  Meta Description{" "}
                  <span className="text-muted-foreground font-normal">({metaDescription.length}/160)</span>
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

        </div>
      </div>
    </div>
  );
}
