import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "@/lib/auth/session";
import { getDataProvider } from "@/lib/data";
import { MediaLibraryClient } from "@/components/dashboard/MediaLibraryClient";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const provider = getDataProvider();
  const result = await provider.listMedia(0, 50);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Media Library</h1>
            <p className="text-sm text-muted-foreground">
              {result.total} items
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <MediaLibraryClient initialItems={result.data} />
      </main>
    </div>
  );
}
