import Link from "next/link";
import { PostCard } from "@/components/blog/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { type Post } from "@/lib/data/types";

interface PostGridProps {
  posts?: Post[];
  search?: string;
}

function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <Skeleton className="aspect-video w-full" />
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="px-5 pb-5 flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function PostGrid({ posts, search }: PostGridProps) {
  if (!posts) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="mb-2">No posts found. Try different search terms.</p>
        <Link
          href="/blog"
          className="text-sm underline hover:text-foreground transition-colors"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div>
      {search && (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing results for &ldquo;{search}&rdquo;
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
