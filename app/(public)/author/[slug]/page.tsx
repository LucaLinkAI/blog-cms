import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDataProvider } from "@/lib/data";
import { createStaticClient } from "@/lib/supabase/server";
import { PostGrid } from "@/components/blog/PostGrid";
import { PostPagination } from "@/components/blog/PostPagination";
import { buildAuthorMetadata } from "@/lib/utils/seo";

const PAGE_SIZE = 10;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[]>>;
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase.from("profiles").select("slug");
  return (data ?? []).map((a: { slug: string }) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = getDataProvider();
  const author = await provider.getAuthorBySlug(slug);
  if (!author) return { title: "Author not found" };
  return buildAuthorMetadata(author);
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const provider = getDataProvider();
  const author = await provider.getAuthorBySlug(slug);
  if (!author) notFound();

  const result = await provider.listPosts(
    { status: "published", authorId: author.id },
    page - 1,
    PAGE_SIZE
  );

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.displayName,
    url: `${SITE_URL}/author/${author.slug}`,
    image: author.avatarUrl ?? undefined,
    description: author.bio ?? undefined,
    worksFor: { "@type": "Organization", name: SITE_NAME },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Author header */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          {author.avatarUrl && (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
              <Image
                src={author.avatarUrl}
                alt={`${author.displayName}'s avatar`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{author.displayName}</h1>
            {author.bio && (
              <p className="mt-2 text-muted-foreground max-w-xl">{author.bio}</p>
            )}
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-6">Posts by {author.displayName}</h2>
        <PostGrid posts={result.data} />
        <PostPagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/author/${slug}`}
        />
      </div>
    </>
  );
}
