import { getDataProvider } from "@/lib/data";
import { getServerSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { FileText, PenSquare, FolderOpen, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const provider = getDataProvider();

  const [published, drafts, categories, authors] = await Promise.all([
    provider.listPosts({ status: "published" }, 0, 1),
    provider.listPosts({ status: "draft" }, 0, 1),
    provider.listCategories(),
    provider.listAuthors(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {session.user.displayName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/posts/new">New Post</Link>
            </Button>
            <form action="/api/auth/logout" method="POST">
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Published Posts"
            value={published.total}
            icon={FileText}
          />
          <StatsCard
            label="Draft Posts"
            value={drafts.total}
            icon={PenSquare}
          />
          <StatsCard
            label="Categories"
            value={categories.length}
            icon={FolderOpen}
          />
          <StatsCard
            label="Authors"
            value={authors.length}
            icon={Users}
          />
        </div>

        <div className="mt-8 flex gap-4 flex-wrap">
          <Button asChild variant="outline">
            <Link href="/dashboard/posts">Manage Posts</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/media">Media Library</Link>
          </Button>
          {(session.user.role === "editor" ||
            session.user.role === "admin") && (
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">Settings</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
