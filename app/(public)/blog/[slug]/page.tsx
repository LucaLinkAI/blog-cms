import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDataProvider } from "@/lib/data";
import { createStaticClient } from "@/lib/supabase/server";
import { BlockRenderer } from "@/components/editor/BlockRenderer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { buildPostMetadata } from "@/lib/utils/seo";
import { ShareWechat } from "@/components/blog/ShareWechat";

export const dynamicParams = true;

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("posts")
    .select("slug")
    .eq("status", "published");
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = getDataProvider();
  const post = await provider.getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return buildPostMetadata(post);
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const provider = getDataProvider();
  const post = await provider.getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  const { author, category, tags } = post;

  const authorInitials = author
    ? author.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const publishedDate = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? post.metaDescription ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    url: `${SITE_URL}/blog/${post.slug}`,
    image: post.coverImageUrl ?? undefined,
    author: author
      ? { "@type": "Person", name: author.displayName, url: `${SITE_URL}/author/${author.slug}` }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="container mx-auto max-w-3xl px-4 py-12">
        {/* Category */}
        {category && (
          <div className="mb-4">
            <Link href={`/category/${category.slug}`}>
              <Badge className="text-white" style={{ backgroundColor: category.color ?? undefined }}>
                {category.name}
              </Badge>
            </Link>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {author && (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={author.avatarUrl ?? undefined}
                  alt={`${author.displayName}'s avatar`}
                />
                <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <Link
                  href={`/author/${author.slug}`}
                  className="text-sm font-medium hover:underline"
                >
                  {author.displayName}
                </Link>
                {publishedDate && (
                  <p className="text-xs text-muted-foreground">{publishedDate}</p>
                )}
              </div>
            </div>
          )}

          {post.readingTime && (
            <span className="text-sm text-muted-foreground">
              {post.readingTime} min read
            </span>
          )}
        </div>

        {/* Cover image */}
        {post.coverImageUrl && (
          <>
            <div className="mt-8 relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={post.coverImageUrl}
                alt={`Cover image for ${post.title}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <ShareWechat
                url={`${SITE_URL}/blog/${post.slug}`}
                title={post.title}
              />
            </div>
          </>
        )}

        <Separator className="my-8" />

        {/* Content */}
        <BlockRenderer blocks={post.content} />

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.slug}`}>
                <Badge variant="outline">{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </article>
    </>
  );
}
