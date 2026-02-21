import type { Metadata } from "next";
import type { Post, Author, Category, Tag } from "@/lib/data/types";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function buildPostMetadata(post: Post): Metadata {
  const title = post.metaTitle ?? post.title;
  const description =
    post.metaDescription ?? post.excerpt ?? `Read "${post.title}" on ${SITE_NAME}`;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
      publishedTime: post.publishedAt ?? undefined,
      images: post.coverImageUrl
        ? [{ url: post.coverImageUrl, alt: post.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  };
}

export function buildAuthorMetadata(author: Author): Metadata {
  const title = `${author.displayName} — ${SITE_NAME}`;
  const description =
    author.bio ?? `Read posts by ${author.displayName} on ${SITE_NAME}`;
  const url = `${SITE_URL}/author/${author.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: author.avatarUrl
        ? [{ url: author.avatarUrl, alt: author.displayName }]
        : [],
    },
  };
}

export function buildCategoryMetadata(category: Category): Metadata {
  const title = `${category.name} — ${SITE_NAME}`;
  const description =
    category.description ?? `Browse ${category.name} posts on ${SITE_NAME}`;
  const url = `${SITE_URL}/category/${category.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE_NAME,
    },
  };
}

export function buildTagMetadata(tag: Tag): Metadata {
  const title = `${tag.name} — ${SITE_NAME}`;
  const description = `Browse posts tagged "${tag.name}" on ${SITE_NAME}`;
  const url = `${SITE_URL}/tag/${tag.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE_NAME,
    },
  };
}
