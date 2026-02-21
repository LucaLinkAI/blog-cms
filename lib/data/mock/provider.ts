import { v4 as uuidv4 } from "uuid";
import type {
  DataProvider,
  Post,
  Category,
  Tag,
  Author,
  MediaItem,
  PaginatedResult,
  PostFilters,
  CreatePostInput,
  UpdatePostInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTagInput,
  UpdateAuthorInput,
  CreateMediaInput,
  PostStatus,
} from "../types";
import {
  mockPosts,
  mockCategories,
  mockTags,
  mockAuthors,
  mockMedia,
} from "./data";
import { calculateReadingTime } from "@/lib/utils/reading-time";

// Mutable in-memory state (reset on server restart)
let posts = [...mockPosts];
let categories = [...mockCategories];
let tags = [...mockTags];
let authors = [...mockAuthors];
let media = [...mockMedia];

// Status transition matrix from FR-013
const ALLOWED_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"], // archived → published is NOT allowed
};

function isValidTransition(from: PostStatus, to: PostStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

function populatePost(post: Post): Post {
  const author = authors.find((a) => a.id === post.authorId);
  const category = post.categoryId
    ? categories.find((c) => c.id === post.categoryId) ?? null
    : null;
  const postTags = tags.filter((t) => post.tagIds.includes(t.id));
  return { ...post, author, category: category ?? undefined, tags: postTags };
}

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const total = items.length;
  const start = page * pageSize;
  const data = items.slice(start, start + pageSize);
  return { data, total, page, pageSize };
}

export const mockDataProvider: DataProvider = {
  // ── Posts ────────────────────────────────────────────────────────────────

  async listPosts(filters: PostFilters, page: number, pageSize: number) {
    let filtered = posts;

    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }
    if (filters.authorId) {
      filtered = filtered.filter((p) => p.authorId === filters.authorId);
    }
    if (filters.authorSlug) {
      const author = authors.find((a) => a.slug === filters.authorSlug);
      if (author) {
        filtered = filtered.filter((p) => p.authorId === author.id);
      } else {
        filtered = [];
      }
    }
    if (filters.categorySlug) {
      const cat = categories.find((c) => c.slug === filters.categorySlug);
      if (cat) {
        filtered = filtered.filter((p) => p.categoryId === cat.id);
      } else {
        filtered = [];
      }
    }
    if (filters.tagSlug) {
      const tag = tags.find((t) => t.slug === filters.tagSlug);
      if (tag) {
        filtered = filtered.filter((p) => p.tagIds.includes(tag.id));
      } else {
        filtered = [];
      }
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt?.toLowerCase().includes(q) ?? false)
      );
    }

    // Sort by publishedAt desc, then createdAt desc
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.publishedAt ?? a.createdAt;
      const dateB = b.publishedAt ?? b.createdAt;
      return dateB.localeCompare(dateA);
    });

    const result = paginate(filtered, page, pageSize);
    return { ...result, data: result.data.map(populatePost) };
  },

  async getPostBySlug(slug: string) {
    const post = posts.find((p) => p.slug === slug);
    return post ? populatePost(post) : null;
  },

  async getPostById(id: string) {
    const post = posts.find((p) => p.id === id);
    return post ? populatePost(post) : null;
  },

  async createPost(input: CreatePostInput, authorId: string) {
    const now = new Date().toISOString();
    const content = input.content ?? null;
    const newPost: Post = {
      id: uuidv4(),
      title: input.title,
      slug: input.slug,
      content,
      excerpt: input.excerpt ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      authorId,
      categoryId: input.categoryId ?? null,
      tagIds: input.tagIds ?? [],
      status: input.status ?? "draft",
      publishedAt:
        input.status === "published" ? now : null,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      readingTime: calculateReadingTime(content),
      createdAt: now,
      updatedAt: now,
    };
    posts = [...posts, newPost];
    return populatePost(newPost);
  },

  async updatePost(id: string, input: UpdatePostInput) {
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Post ${id} not found`);

    const existing = posts[idx];

    // Enforce status transition
    if (input.status && input.status !== existing.status) {
      if (!isValidTransition(existing.status, input.status)) {
        throw new Error(
          `Invalid status transition: ${existing.status} → ${input.status}`
        );
      }
    }

    const now = new Date().toISOString();
    const newStatus = input.status ?? existing.status;

    // Auto-manage publishedAt
    let publishedAt = existing.publishedAt;
    if (newStatus === "published" && existing.status !== "published") {
      publishedAt = now;
    } else if (newStatus !== "published" && existing.status === "published") {
      publishedAt = null;
    }

    const content =
      input.content !== undefined ? input.content : existing.content;

    const updated: Post = {
      ...existing,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.excerpt !== undefined && { excerpt: input.excerpt }),
      ...(input.coverImageUrl !== undefined && {
        coverImageUrl: input.coverImageUrl,
      }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.tagIds !== undefined && { tagIds: input.tagIds }),
      ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
      ...(input.metaDescription !== undefined && {
        metaDescription: input.metaDescription,
      }),
      content,
      readingTime: calculateReadingTime(content),
      status: newStatus,
      publishedAt,
      updatedAt: now,
    };

    posts = [...posts.slice(0, idx), updated, ...posts.slice(idx + 1)];
    return populatePost(updated);
  },

  async deletePost(id: string) {
    posts = posts.filter((p) => p.id !== id);
  },

  // ── Categories ───────────────────────────────────────────────────────────

  async listCategories() {
    return [...categories];
  },

  async getCategoryBySlug(slug: string) {
    return categories.find((c) => c.slug === slug) ?? null;
  },

  async createCategory(input: CreateCategoryInput) {
    const newCat: Category = {
      id: uuidv4(),
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      color: input.color ?? null,
    };
    categories = [...categories, newCat];
    return newCat;
  },

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Category ${id} not found`);
    const updated = { ...categories[idx], ...input };
    categories = [
      ...categories.slice(0, idx),
      updated,
      ...categories.slice(idx + 1),
    ];
    return updated;
  },

  async deleteCategory(id: string) {
    categories = categories.filter((c) => c.id !== id);
    // Set category_id to null on affected posts (ON DELETE SET NULL behaviour)
    posts = posts.map((p) =>
      p.categoryId === id ? { ...p, categoryId: null } : p
    );
  },

  // ── Tags ─────────────────────────────────────────────────────────────────

  async listTags() {
    return [...tags];
  },

  async getTagBySlug(slug: string) {
    return tags.find((t) => t.slug === slug) ?? null;
  },

  async createTag(input: CreateTagInput) {
    const newTag: Tag = { id: uuidv4(), name: input.name, slug: input.slug };
    tags = [...tags, newTag];
    return newTag;
  },

  async deleteTag(id: string) {
    tags = tags.filter((t) => t.id !== id);
    // Remove tag from all posts (cascade)
    posts = posts.map((p) => ({
      ...p,
      tagIds: p.tagIds.filter((tid) => tid !== id),
    }));
  },

  // ── Authors ──────────────────────────────────────────────────────────────

  async listAuthors() {
    return [...authors];
  },

  async getAuthorById(id: string) {
    return authors.find((a) => a.id === id) ?? null;
  },

  async getAuthorBySlug(slug: string) {
    return authors.find((a) => a.slug === slug) ?? null;
  },

  async updateAuthor(id: string, input: UpdateAuthorInput) {
    const idx = authors.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Author ${id} not found`);
    const updated = { ...authors[idx], ...input };
    authors = [...authors.slice(0, idx), updated, ...authors.slice(idx + 1)];
    return updated;
  },

  // ── Media ─────────────────────────────────────────────────────────────────

  async listMedia(page: number, pageSize: number) {
    const sorted = [...media].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    return paginate(sorted, page, pageSize);
  },

  async createMediaItem(input: CreateMediaInput) {
    const newItem: MediaItem = {
      id: uuidv4(),
      filename: input.filename,
      storagePath: input.storagePath,
      url: input.url,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      altText: input.altText ?? null,
      uploadedBy: input.uploadedBy,
      createdAt: new Date().toISOString(),
    };
    media = [...media, newItem];
    return newItem;
  },
};

/** Append a new author to the in-memory store (used by mock registration). */
export function addMockAuthor(author: Author): void {
  authors = [...authors, author];
}
