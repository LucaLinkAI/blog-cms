"use client";

import { useRouter } from "next/navigation";
import { PostTable } from "@/components/dashboard/PostTable";
import type { Post, PostStatus, UserRole } from "@/lib/data/types";

interface PostsTableClientProps {
  posts: Post[];
  currentUserId: string;
  currentRole: UserRole;
}

export function PostsTableClient({
  posts,
  currentUserId,
  currentRole,
}: PostsTableClientProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleStatusChange(id: string, status: PostStatus) {
    await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <PostTable
      posts={posts}
      currentUserId={currentUserId}
      currentRole={currentRole}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
    />
  );
}
