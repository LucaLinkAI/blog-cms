import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data";
import { UpdatePostSchema } from "@/lib/validations/post";
import { getServerSession } from "@/lib/auth/session";
import type { PostStatus, UpdatePostInput } from "@/lib/data/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Status transition matrix — enforced here (and by DB trigger in Phase 2)
const ALLOWED_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"], // archived → published is blocked for ALL roles
};

// Only editors and admins can set these target statuses
const EDITOR_ONLY_TARGETS: PostStatus[] = ["archived"];

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const provider = getDataProvider();
  const post = await provider.getPostById(id);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const provider = getDataProvider();

  const post = await provider.getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Ownership check: authors can only edit own posts
  if (session.user.role === "author" && post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Validate status transition
  if (input.status && input.status !== post.status) {
    const allowed = ALLOWED_TRANSITIONS[post.status] ?? [];
    if (!allowed.includes(input.status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition: ${post.status} → ${input.status} is not allowed`,
        },
        { status: 422 }
      );
    }

    // Authors cannot archive posts
    if (
      session.user.role === "author" &&
      EDITOR_ONLY_TARGETS.includes(input.status)
    ) {
      return NextResponse.json(
        { error: "Only editors and admins can archive posts" },
        { status: 403 }
      );
    }
  }

  const updateInput: UpdatePostInput = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.slug !== undefined && { slug: input.slug }),
    ...(input.content !== undefined && { content: input.content }),
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
    ...(input.status !== undefined && { status: input.status }),
  };

  const updated = await provider.updatePost(id, updateInput);

  // Trigger ISR revalidation when a status change occurs (publish/unpublish/archive)
  if (input.status && input.status !== post.status) {
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (revalidateSecret) {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
      fetch(`${origin}/api/revalidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": revalidateSecret,
        },
        body: JSON.stringify({
          type: "post",
          slug: updated.slug,
          categorySlug: updated.category?.slug,
        }),
      }).catch(() => {
        // Non-blocking — revalidation failure should not fail the request
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const provider = getDataProvider();

  const post = await provider.getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Authors can only delete own posts; editors/admins can delete any
  if (session.user.role === "author" && post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await provider.deletePost(id);
  return new NextResponse(null, { status: 204 });
}
