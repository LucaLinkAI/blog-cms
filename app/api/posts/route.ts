import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data";
import { PostFiltersSchema, CreatePostSchema } from "@/lib/validations/post";
import { getServerSession } from "@/lib/auth/session";
import type { CreatePostInput } from "@/lib/data/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const raw = {
    status: searchParams.get("status") ?? undefined,
    categorySlug: searchParams.get("categorySlug") ?? undefined,
    tagSlug: searchParams.get("tagSlug") ?? undefined,
    authorId: searchParams.get("authorId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };

  const parsed = PostFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10));

  const provider = getDataProvider();
  const result = await provider.listPosts(parsed.data, page - 1, pageSize);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const provider = getDataProvider();

  // Slug uniqueness check
  const existingPosts = await provider.listPosts({}, 0, 10000);
  const existingSlugs = existingPosts.data.map((p) => p.slug);

  const slug = parsed.data.slug;
  if (existingSlugs.includes(slug)) {
    return NextResponse.json(
      { error: `Slug "${slug}" is already in use` },
      { status: 409 }
    );
  }

  const input: CreatePostInput = {
    title: parsed.data.title,
    slug,
    content: parsed.data.content,
    excerpt: parsed.data.excerpt,
    coverImageUrl: parsed.data.coverImageUrl,
    categoryId: parsed.data.categoryId,
    tagIds: parsed.data.tagIds,
    metaTitle: parsed.data.metaTitle,
    metaDescription: parsed.data.metaDescription,
    status: parsed.data.status,
  };

  const post = await provider.createPost(input, session.user.id);
  return NextResponse.json(post, { status: 201 });
}
