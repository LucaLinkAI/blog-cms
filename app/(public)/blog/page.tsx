import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getDataProvider } from "@/lib/data";
import { PostGrid } from "@/components/blog/PostGrid";
import { PostPagination } from "@/components/blog/PostPagination";
import { SearchBar } from "@/components/blog/SearchBar";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { PostFiltersSchema } from "@/lib/validations/post";

export const revalidate = 60;

const PAGE_SIZE = 12;
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";

export const metadata: Metadata = {
  title: "Blog",
  description: `Browse all articles on ${SITE_NAME}.`,
};

interface BlogPageProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams;
  const raw = {
    page: typeof sp.page === "string" ? sp.page : "1",
    categorySlug:
      typeof sp.categorySlug === "string" ? sp.categorySlug : undefined,
    tagSlug: typeof sp.tagSlug === "string" ? sp.tagSlug : undefined,
    search: typeof sp.search === "string" ? sp.search : undefined,
    status: "published",
  };

  const parsed = PostFiltersSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : { status: "published" as const };
  const page = Math.max(1, parseInt(raw.page, 10) || 1);
  const activeTagSlug =
    typeof sp.tagSlug === "string" ? sp.tagSlug : undefined;
  const currentSearch =
    typeof sp.search === "string" ? sp.search : undefined;

  const provider = getDataProvider();
  const [result, allTags, allCategories, allAuthors] = await Promise.all([
    provider.listPosts(
      { ...filters, status: "published" },
      page - 1,
      PAGE_SIZE
    ),
    provider.listTags(),
    provider.listCategories(),
    provider.listAuthors(),
  ]);

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  const extraParams: Record<string, string> = {};
  if (typeof sp.categorySlug === "string")
    extraParams.categorySlug = sp.categorySlug;
  if (typeof sp.tagSlug === "string") extraParams.tagSlug = sp.tagSlug;
  if (typeof sp.search === "string") extraParams.search = sp.search;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12 overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Blog</h1>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 items-start">
        {/* Main column */}
        <div className="min-w-0">
          {/* Search bar */}
          <div className="mb-6">
            <Suspense fallback={null}>
              <SearchBar defaultValue={currentSearch} />
            </Suspense>
          </div>

          {/* Tag filter pills */}
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 w-full min-w-0">
              {allTags.map((tag) => {
                const isSelected = tag.slug === activeTagSlug;
                const tagParams = new URLSearchParams();
                if (!isSelected) tagParams.set("tagSlug", tag.slug);
                if (currentSearch) tagParams.set("search", currentSearch);
                const tagHref = `/blog${tagParams.toString() ? `?${tagParams.toString()}` : ""}`;

                return (
                  <Link
                    key={tag.id}
                    href={tagHref}
                    className={`flex-shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground hover:text-foreground hover:border-foreground"
                    }`}
                  >
                    {tag.name}
                  </Link>
                );
              })}
            </div>
          )}

          <PostGrid posts={result.data} search={currentSearch} />
          <PostPagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/blog"
            searchParams={extraParams}
          />
        </div>

        {/* Right sidebar */}
        <div className="sticky top-8">
          <BlogSidebar categories={allCategories} authors={allAuthors} />
        </div>
      </div>
    </div>
  );
}
