/**
 * Centralized ISR cache tag strings.
 * Use these in `unstable_cache` and `revalidateTag` calls.
 */
export const cacheTags = {
  /** All post lists */
  posts: "posts",
  /** Single post by slug */
  post: (slug: string) => `post:${slug}`,
  /** Single category by slug */
  category: (slug: string) => `category:${slug}`,
  /** Single tag by slug */
  tag: (slug: string) => `tag:${slug}`,
  /** Single author by id */
  author: (id: string) => `author:${id}`,
  /** Media library */
  media: "media",
} as const;
