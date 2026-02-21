import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { getDataProvider } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PostsTableClient } from "@/components/dashboard/PostsTableClient";
import type { PostStatus } from "@/lib/data/types";

export const dynamic = "force-dynamic";

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; error?: string }>;
}

export default async function PostsPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const statusFilter = (params.status as PostStatus | undefined) ?? undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = 20;

  const provider = getDataProvider();
  const result = await provider.listPosts(
    {
      status: statusFilter,
      authorId:
        session.user.role === "author" ? session.user.id : undefined,
    },
    (page - 1) * pageSize,
    pageSize
  );

  const activeTab = params.status ?? "all";
  const totalPages = Math.ceil(result.total / pageSize);
  const accessDenied = params.error === "access-denied";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Posts</h1>
            <p className="text-sm text-muted-foreground">
              {result.total} total
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/posts/new">New Post</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {accessDenied && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive"
          >
            Access denied — you can only edit your own posts.
          </div>
        )}
        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 border-b">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={
                tab.value === "all"
                  ? "/dashboard/posts"
                  : `/dashboard/posts?status=${tab.value}`
              }
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <PostsTableClient
          posts={result.data}
          currentUserId={session.user.id}
          currentRole={session.user.role}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button asChild variant="outline" size="sm" disabled={page <= 1}>
              <Link
                href={`/dashboard/posts?${new URLSearchParams({
                  ...(activeTab !== "all" ? { status: activeTab } : {}),
                  page: String(page - 1),
                })}`}
              >
                Previous
              </Link>
            </Button>
            <span className="flex items-center text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
            >
              <Link
                href={`/dashboard/posts?${new URLSearchParams({
                  ...(activeTab !== "all" ? { status: activeTab } : {}),
                  page: String(page + 1),
                })}`}
              >
                Next
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
