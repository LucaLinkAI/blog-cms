"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostForm, type PostFormData } from "@/components/dashboard/PostForm";
import { useCategoriesAndTags } from "@/hooks/useCategoriesAndTags";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/lib/data/types";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const { categories, tags, loading: taxLoading } = useCategoriesAndTags();

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch(`/api/posts/${id}`),
      fetch("/api/auth/me"),
    ])
      .then(async ([postRes, meRes]) => {
        if (postRes.status === 404) {
          setNotFound(true);
          return;
        }

        const [postData, meData] = await Promise.all([
          postRes.json(),
          meRes.ok ? meRes.json() : null,
        ]);

        // Ownership check: redirect authors trying to edit someone else's post
        const role = meData?.profile?.role;
        const userId = meData?.profile?.id;
        if (role === "author" && postData?.authorId !== userId) {
          router.replace("/dashboard/posts?error=access-denied");
          return;
        }

        setPost(postData);
      })
      .catch(() => setNotFound(true))
      .finally(() => setPostLoading(false));
  }, [id, router]);

  async function handleSave(data: PostFormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
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
        throw new Error(err.error ?? "Failed to save post");
      }

      const updated = await res.json();
      setPost(updated);
    } finally {
      setSaving(false);
    }
  }

  const loading = postLoading || taxLoading;

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    );
  }

  if (loading || !post) {
    return (
      <div className="p-8 space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <PostForm
      initial={post}
      categories={categories}
      tags={tags}
      onSave={handleSave}
      saving={saving}
      pageTitle="Edit Post"
    />
  );
}
