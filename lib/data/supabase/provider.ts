import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";
import type {
  DataProvider,
  Post,
  Author,
  Category,
  Tag,
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
} from "../types";

// ---------------------------------------------------------------------------
// Shape mappers (snake_case DB → camelCase TS)
// ---------------------------------------------------------------------------

function mapProfile(row: Record<string, unknown>): Author {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    role: row.role as Author["role"],
    slug: row.slug as string,
    createdAt: row.created_at as string,
  };
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string | null) ?? null,
    color: (row.color as string | null) ?? null,
  };
}

function mapTag(row: Record<string, unknown>): Tag {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
  };
}

function mapMedia(row: Record<string, unknown>): MediaItem {
  return {
    id: row.id as string,
    filename: row.filename as string,
    storagePath: row.storage_path as string,
    url: row.url as string,
    mimeType: row.mime_type as string,
    sizeBytes: row.size_bytes as number,
    altText: (row.alt_text as string | null) ?? null,
    uploadedBy: row.uploaded_by as string,
    createdAt: row.created_at as string,
  };
}

function mapPost(row: Record<string, unknown>): Post {
  const tagRows = Array.isArray(row.post_tags) ? (row.post_tags as Array<{ tag_id: string; tags?: Record<string, unknown> }>) : [];

  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    content: (row.content as Post["content"]) ?? null,
    excerpt: (row.excerpt as string | null) ?? null,
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    authorId: row.author_id as string,
    author: row.profiles ? mapProfile(row.profiles as Record<string, unknown>) : undefined,
    categoryId: (row.category_id as string | null) ?? null,
    category: row.categories ? mapCategory(row.categories as Record<string, unknown>) : undefined,
    tagIds: tagRows.map((pt) => pt.tag_id),
    tags: tagRows
      .filter((pt) => pt.tags)
      .map((pt) => mapTag(pt.tags as Record<string, unknown>)),
    status: row.status as Post["status"],
    publishedAt: (row.published_at as string | null) ?? null,
    metaTitle: (row.meta_title as string | null) ?? null,
    metaDescription: (row.meta_description as string | null) ?? null,
    readingTime: (row.reading_time as number | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Cached fetchers (only used for read operations)
// ---------------------------------------------------------------------------

const POST_SELECT = `
  *,
  profiles (id, display_name, avatar_url, bio, role, slug, created_at),
  categories (id, name, slug, description, color),
  post_tags (tag_id, tags (id, name, slug))
`;

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

export function createSupabaseDataProvider(): DataProvider {
  // -------------------------------------------------------------------------
  // Posts
  // -------------------------------------------------------------------------

  async function listPosts(
    filters: PostFilters,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<Post>> {
    const supabase = await createClient();
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("posts")
      .select(POST_SELECT, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.authorId) {
      query = query.eq("author_id", filters.authorId);
    }
    if (filters.categorySlug) {
      // Join via categories table — filter by slug
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", filters.categorySlug)
        .single();
      if (cat) {
        query = query.eq("category_id", cat.id);
      } else {
        return { data: [], total: 0, page, pageSize };
      }
    }
    if (filters.tagSlug) {
      const { data: tag } = await supabase
        .from("tags")
        .select("id")
        .eq("slug", filters.tagSlug)
        .single();
      if (tag) {
        // Filter posts that have this tag via post_tags
        const { data: ptRows } = await supabase
          .from("post_tags")
          .select("post_id")
          .eq("tag_id", tag.id);
        const postIds = (ptRows ?? []).map((r: { post_id: string }) => r.post_id);
        if (postIds.length === 0) {
          return { data: [], total: 0, page, pageSize };
        }
        query = query.in("id", postIds);
      } else {
        return { data: [], total: 0, page, pageSize };
      }
    }
    if (filters.search) {
      // Full-text search using ilike (simple; GIN index used for production)
      query = query.or(
        `title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`
      );
    }
    if (filters.authorSlug) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", filters.authorSlug)
        .single();
      if (profile) {
        query = query.eq("author_id", profile.id);
      } else {
        return { data: [], total: 0, page, pageSize };
      }
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []).map((r) => mapPost(r as Record<string, unknown>)),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async function getPostBySlug(slug: string): Promise<Post | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return mapPost(data as Record<string, unknown>);
  }

  async function getPostById(id: string): Promise<Post | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapPost(data as Record<string, unknown>);
  }

  async function createPost(
    input: CreatePostInput,
    authorId: string
  ): Promise<Post> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: input.title,
        slug: input.slug,
        content: input.content ?? null,
        excerpt: input.excerpt ?? null,
        cover_image_url: input.coverImageUrl ?? null,
        author_id: authorId,
        category_id: input.categoryId ?? null,
        meta_title: input.metaTitle ?? null,
        meta_description: input.metaDescription ?? null,
        status: input.status ?? "draft",
      })
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to create post");

    // Insert tag associations
    if (input.tagIds?.length) {
      const tagRows = input.tagIds.map((tagId) => ({
        post_id: (data as { id: string }).id,
        tag_id: tagId,
      }));
      const { error: tagError } = await supabase.from("post_tags").insert(tagRows);
      if (tagError) throw new Error(tagError.message);
    }

    const post = await getPostById((data as { id: string }).id);
    if (!post) throw new Error("Failed to fetch created post");
    return post;
  }

  async function updatePost(id: string, input: UpdatePostInput): Promise<Post> {
    const supabase = await createClient();

    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.content !== undefined) patch.content = input.content;
    if (input.excerpt !== undefined) patch.excerpt = input.excerpt;
    if (input.coverImageUrl !== undefined) patch.cover_image_url = input.coverImageUrl;
    if (input.categoryId !== undefined) patch.category_id = input.categoryId || null;
    if (input.metaTitle !== undefined) patch.meta_title = input.metaTitle;
    if (input.metaDescription !== undefined) patch.meta_description = input.metaDescription;
    if (input.status !== undefined) patch.status = input.status;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("posts").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    }

    // Update tag associations
    if (input.tagIds !== undefined) {
      const { error: delError } = await supabase
        .from("post_tags")
        .delete()
        .eq("post_id", id);
      if (delError) throw new Error(delError.message);

      if (input.tagIds.length > 0) {
        const tagRows = input.tagIds.map((tagId) => ({
          post_id: id,
          tag_id: tagId,
        }));
        const { error: insertError } = await supabase.from("post_tags").insert(tagRows);
        if (insertError) throw new Error(insertError.message);
      }
    }

    const post = await getPostById(id);
    if (!post) throw new Error("Post not found after update");
    return post;
  }

  async function deletePost(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------

  async function listCategories(): Promise<Category[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapCategory(r as Record<string, unknown>));
  }

  async function getCategoryBySlug(slug: string): Promise<Category | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return mapCategory(data as Record<string, unknown>);
  }

  async function createCategory(input: CreateCategoryInput): Promise<Category> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        color: input.color ?? null,
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create category");
    return mapCategory(data as Record<string, unknown>);
  }

  async function updateCategory(
    id: string,
    input: UpdateCategoryInput
  ): Promise<Category> {
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.description !== undefined) patch.description = input.description;
    if (input.color !== undefined) patch.color = input.color;

    const { data, error } = await supabase
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to update category");
    return mapCategory(data as Record<string, unknown>);
  }

  async function deleteCategory(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // -------------------------------------------------------------------------
  // Tags
  // -------------------------------------------------------------------------

  async function listTags(): Promise<Tag[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapTag(r as Record<string, unknown>));
  }

  async function getTagBySlug(slug: string): Promise<Tag | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return mapTag(data as Record<string, unknown>);
  }

  async function createTag(input: CreateTagInput): Promise<Tag> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tags")
      .insert({ name: input.name, slug: input.slug })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create tag");
    return mapTag(data as Record<string, unknown>);
  }

  async function deleteTag(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  // -------------------------------------------------------------------------
  // Authors (profiles)
  // -------------------------------------------------------------------------

  async function listAuthors(): Promise<Author[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("display_name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapProfile(r as Record<string, unknown>));
  }

  async function getAuthorById(id: string): Promise<Author | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return mapProfile(data as Record<string, unknown>);
  }

  async function getAuthorBySlug(slug: string): Promise<Author | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return mapProfile(data as Record<string, unknown>);
  }

  async function updateAuthor(
    id: string,
    input: UpdateAuthorInput & { role?: string }
  ): Promise<Author> {
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.bio !== undefined) patch.bio = input.bio;
    if ((input as { role?: string }).role !== undefined)
      patch.role = (input as { role?: string }).role;

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to update author");
    return mapProfile(data as Record<string, unknown>);
  }

  // -------------------------------------------------------------------------
  // Media
  // -------------------------------------------------------------------------

  async function listMedia(
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<MediaItem>> {
    const supabase = await createClient();
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("media")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return {
      data: (data ?? []).map((r) => mapMedia(r as Record<string, unknown>)),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async function createMediaItem(input: CreateMediaInput): Promise<MediaItem> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("media")
      .insert({
        filename: input.filename,
        storage_path: input.storagePath,
        url: input.url,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes,
        alt_text: input.altText ?? null,
        uploaded_by: input.uploadedBy,
      })
      .select()
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to create media item");
    return mapMedia(data as Record<string, unknown>);
  }

  // -------------------------------------------------------------------------
  // Assemble provider
  // -------------------------------------------------------------------------
  return {
    listPosts,
    getPostBySlug,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    listCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    listTags,
    getTagBySlug,
    createTag,
    deleteTag,
    listAuthors,
    getAuthorById,
    getAuthorBySlug,
    updateAuthor,
    listMedia,
    createMediaItem,
  };
}
