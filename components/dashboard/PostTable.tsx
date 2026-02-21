"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post, UserRole } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PostTableProps {
  posts: Post[];
  currentUserId: string;
  currentRole: UserRole;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: "draft" | "published" | "archived") => void;
}

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function PostTable({
  posts,
  currentUserId,
  currentRole,
  onDelete,
  onStatusChange,
}: PostTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const visiblePosts =
    currentRole === "author"
      ? posts.filter((p) => p.authorId === currentUserId)
      : posts;

  const isEditorOrAdmin = currentRole === "editor" || currentRole === "admin";

  async function handleDelete(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    setDeleting(id);
    try {
      await onDelete?.(id);
    } finally {
      setDeleting(null);
    }
  }

  if (visiblePosts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">No posts found.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Title</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            {isEditorOrAdmin && (
              <th className="text-left px-4 py-3 font-medium">Author</th>
            )}
            <th className="text-left px-4 py-3 font-medium">Category</th>
            <th className="text-left px-4 py-3 font-medium">Updated</th>
            <th className="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visiblePosts.map((post, idx) => (
            <tr
              key={post.id}
              className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
            >
              <td className="px-4 py-3 max-w-xs">
                <span className="font-medium line-clamp-1">{post.title}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[post.status]}`}
                >
                  {post.status}
                </span>
              </td>
              {isEditorOrAdmin && (
                <td className="px-4 py-3 text-muted-foreground">
                  {post.author?.displayName ?? "—"}
                </td>
              )}
              <td className="px-4 py-3">
                {post.category ? (
                  <Badge
                    variant="outline"
                    style={
                      post.category.color
                        ? { borderColor: post.category.color, color: post.category.color }
                        : undefined
                    }
                  >
                    {post.category.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {new Date(post.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/posts/${post.id}/edit`}>Edit</Link>
                  </Button>

                  {isEditorOrAdmin && post.status === "published" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange?.(post.id, "archived")}
                    >
                      Archive
                    </Button>
                  )}

                  {isEditorOrAdmin && post.status === "archived" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange?.(post.id, "draft")}
                    >
                      Unarchive
                    </Button>
                  )}

                  <Separator orientation="vertical" className="h-4" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deleting === post.id}
                    onClick={() => handleDelete(post.id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
