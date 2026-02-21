// Shared types for the CMS Blog Platform
// All data providers must conform to the DataProvider interface defined here.

export type UserRole = "admin" | "editor" | "author";
export type PostStatus = "draft" | "published" | "archived";

// BlockNote Block type — using any to avoid coupling to a specific version
// The actual type is Block from @blocknote/core
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Block = any;

export interface Author {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  slug: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: Block[] | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorId: string;
  author?: Author;
  categoryId: string | null;
  category?: Category;
  tagIds: string[];
  tags?: Tag[];
  status: PostStatus;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  readingTime: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  storagePath: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PostFilters {
  status?: PostStatus;
  categorySlug?: string;
  tagSlug?: string;
  authorId?: string;
  authorSlug?: string;
  search?: string;
}

// Input types

export interface CreatePostInput {
  title: string;
  slug: string;
  content?: Block[];
  excerpt?: string;
  coverImageUrl?: string;
  categoryId?: string;
  tagIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  status?: PostStatus;
}

export type UpdatePostInput = Partial<CreatePostInput>;

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CreateTagInput {
  name: string;
  slug: string;
}

export interface UpdateAuthorInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  role?: UserRole;
}

export interface CreateMediaInput {
  filename: string;
  storagePath: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
  uploadedBy: string;
}

// DataProvider interface — all implementations must satisfy this contract

export interface DataProvider {
  // Posts
  listPosts(
    filters: PostFilters,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<Post>>;
  getPostBySlug(slug: string): Promise<Post | null>;
  getPostById(id: string): Promise<Post | null>;
  createPost(input: CreatePostInput, authorId: string): Promise<Post>;
  updatePost(id: string, input: UpdatePostInput): Promise<Post>;
  deletePost(id: string): Promise<void>;

  // Categories
  listCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  createCategory(input: CreateCategoryInput): Promise<Category>;
  updateCategory(id: string, input: UpdateCategoryInput): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Tags
  listTags(): Promise<Tag[]>;
  getTagBySlug(slug: string): Promise<Tag | null>;
  createTag(input: CreateTagInput): Promise<Tag>;
  deleteTag(id: string): Promise<void>;

  // Authors
  listAuthors(): Promise<Author[]>;
  getAuthorById(id: string): Promise<Author | null>;
  getAuthorBySlug(slug: string): Promise<Author | null>;
  updateAuthor(id: string, input: UpdateAuthorInput): Promise<Author>;

  // Media
  listMedia(page: number, pageSize: number): Promise<PaginatedResult<MediaItem>>;
  createMediaItem(input: CreateMediaInput): Promise<MediaItem>;
}
