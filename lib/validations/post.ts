import { z } from "zod";

export const PostStatusSchema = z.enum(["draft", "published", "archived"]);

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(300),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  content: z.array(z.any()).optional(),
  excerpt: z.string().max(300).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  status: PostStatusSchema.optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial();

export const PostFiltersSchema = z.object({
  status: PostStatusSchema.optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  authorId: z.string().uuid().optional(),
  authorSlug: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type PostFiltersInput = z.infer<typeof PostFiltersSchema>;
