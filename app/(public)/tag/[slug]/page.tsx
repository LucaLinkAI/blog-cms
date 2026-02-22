import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDataProvider } from "@/lib/data";
import { createStaticClient } from "@/lib/supabase/server";
import { PostGrid } from "@/components/blog/PostGrid";
import { PostPagination } from "@/components/blog/PostPagination";
import { buildTagMetadata } from "@/lib/utils/seo";

const PAGE_SIZE = 10;

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase.from("tags").select("slug");
  return (data ?? []).map((t: { slug: string }) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = getDataProvider();
  const tag = await provider.getTagBySlug(slug);
  if (!tag) return { title: "Tag not found" };
  return buildTagMetadata(tag);
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const provider = getDataProvider();
  const tag = await provider.getTagBySlug(slug);
  if (!tag) notFound();

  const result = await provider.listPosts(
    { status: "published", tagSlug: slug },
    page - 1,
    PAGE_SIZE
  );

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Tag</p>
        <h1 className="text-3xl font-bold">#{tag.name}</h1>
      </div>
      <PostGrid posts={result.data} />
      <PostPagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/tag/${slug}`}
      />
    </div>
  );
}
