import Image from "next/image";
import Link from "next/link";
import type { Category, Author } from "@/lib/data/types";

interface BlogSidebarProps {
  categories: Category[];
  authors: Author[];
}

export function BlogSidebar({ categories, authors }: BlogSidebarProps) {
  return (
    <aside className="space-y-8">
      {categories.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Categories
          </h2>
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="block text-sm py-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/category"
            className="mt-3 inline-block text-xs text-primary hover:underline"
          >
            View all categories →
          </Link>
        </div>
      )}

      {authors.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Authors
          </h2>
          <ul className="space-y-2">
            {authors.map((author) => (
              <li key={author.id}>
                <Link
                  href={`/author/${author.slug}`}
                  className="flex items-center gap-2 group"
                >
                  {author.avatarUrl ? (
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={author.avatarUrl}
                        alt={`${author.displayName}'s avatar`}
                        fill
                        className="object-cover"
                        sizes="28px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                      {author.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {author.displayName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/author"
            className="mt-3 inline-block text-xs text-primary hover:underline"
          >
            View all authors →
          </Link>
        </div>
      )}
    </aside>
  );
}
