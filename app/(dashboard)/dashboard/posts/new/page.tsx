"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostForm, type PostFormData } from "@/components/dashboard/PostForm";
import { useCategoriesAndTags } from "@/hooks/useCategoriesAndTags";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { categories, tags, loading } = useCategoriesAndTags();

  async function handleSave(data: PostFormData) {
    setSaving(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt || undefined,
          content: data.content.length > 0 ? data.content : undefined,
          categoryId: data.categoryId || undefined,
          tagIds: data.tagIds,
          coverImageUrl: data.coverImageUrl || undefined,
          metaTitle: data.metaTitle || undefined,
          metaDescription: data.metaDescription || undefined,
          status: data.status,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create post");
      }

      const post = await res.json();
      router.push(`/dashboard/posts/${post.id}/edit`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">New Post</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <PostForm
          categories={categories}
          tags={tags}
          onSave={handleSave}
          saving={saving}
        />
      </main>
    </div>
  );
}
