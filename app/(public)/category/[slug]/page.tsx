import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDataProvider } from "@/lib/data";
import { PostGrid } from "@/components/blog/PostGrid";
import { PostPagination } from "@/components/blog/PostPagination";
import { buildCategoryMetadata } from "@/lib/utils/seo";

const PAGE_SIZE = 10;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export async function generateStaticParams() {
  const provider = getDataProvider();
  const categories = await provider.listCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = getDataProvider();
  const category = await provider.getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return buildCategoryMetadata(category);
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const provider = getDataProvider();
  const category = await provider.getCategoryBySlug(slug);
  if (!category) notFound();

  const result = await provider.listPosts(
    { status: "published", categorySlug: slug },
    (page - 1) * PAGE_SIZE,
    PAGE_SIZE
  );

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Category</p>
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>
      <PostGrid posts={result.data} />
      <PostPagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/category/${slug}`}
      />
    </div>
  );
}
