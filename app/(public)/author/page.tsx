import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getDataProvider } from "@/lib/data";

export const revalidate = 60;

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";

export const metadata: Metadata = {
  title: "Authors",
  description: `Meet the authors on ${SITE_NAME}.`,
};

export default async function AuthorsPage() {
  const provider = getDataProvider();
  const authors = await provider.listAuthors();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Authors</h1>

      {authors.length === 0 ? (
        <p className="text-muted-foreground">No authors yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <Link
              key={author.id}
              href={`/author/${author.slug}`}
              className="group flex items-start gap-4 rounded-lg border p-5 hover:border-primary transition-colors"
            >
              {author.avatarUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={author.avatarUrl}
                    alt={`${author.displayName}'s avatar`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xl font-semibold">
                  {author.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-semibold group-hover:text-primary transition-colors truncate">
                  {author.displayName}
                </h2>
                {author.bio && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {author.bio}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
