import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getDataProvider } from "@/lib/data";
import { SettingsClient } from "@/components/dashboard/SettingsClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const provider = getDataProvider();
  const isAdmin = session.user.role === "admin";
  const isEditorOrAdmin =
    session.user.role === "editor" || isAdmin;

  const [categories, tags, allAuthors] = isEditorOrAdmin
    ? await Promise.all([
        provider.listCategories(),
        provider.listTags(),
        isAdmin ? provider.listAuthors() : Promise.resolve([]),
      ])
    : [[], [], []];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <SettingsClient
          currentUser={session.user}
          initialCategories={categories}
          initialTags={tags}
          isEditorOrAdmin={isEditorOrAdmin}
          isAdmin={isAdmin}
          initialAuthors={allAuthors}
        />
      </main>
    </div>
  );
}
