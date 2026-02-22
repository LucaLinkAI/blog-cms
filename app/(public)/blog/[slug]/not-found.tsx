import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PostNotFound() {
  return (
    <main id="main-content" className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Post not found</h1>
        <p className="text-muted-foreground">
          This post may have been removed or the URL might be incorrect.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/blog">Browse all posts</Link>
      </Button>
    </main>
  );
}
