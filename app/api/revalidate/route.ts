import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { cacheTags } from "@/lib/cache-tags";

/**
 * POST /api/revalidate
 *
 * On-demand ISR revalidation endpoint.
 * Secured by the REVALIDATE_SECRET environment variable.
 *
 * Request headers:
 *   x-revalidate-secret: <REVALIDATE_SECRET>
 *
 * Request body:
 *   {
 *     type: "post" | "category" | "tag" | "author" | "posts",
 *     slug?: string,    // for post / category / tag
 *     authorId?: string // for author
 *   }
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    type?: string;
    slug?: string;
    authorId?: string;
    categorySlug?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, slug, authorId } = body;

  // Next.js 16: revalidateTag requires (tag, profile) — pass {} to use default profile
  const profile = {};

  switch (type) {
    case "post":
      // Invalidate the specific post and the global posts list
      revalidateTag(cacheTags.posts, profile);
      if (slug) {
        revalidateTag(cacheTags.post(slug), profile);
        revalidatePath(`/blog/${slug}`);
      }
      // Also invalidate the sitemap since publish state may have changed
      revalidatePath("/sitemap.xml");
      break;

    case "posts":
      revalidateTag(cacheTags.posts, profile);
      revalidatePath("/blog");
      revalidatePath("/");
      break;

    case "category":
      revalidateTag(cacheTags.posts, profile);
      if (slug) {
        revalidateTag(cacheTags.category(slug), profile);
        revalidatePath(`/category/${slug}`);
      }
      revalidatePath("/sitemap.xml");
      break;

    case "tag":
      revalidateTag(cacheTags.posts, profile);
      if (slug) {
        revalidateTag(cacheTags.tag(slug), profile);
        revalidatePath(`/tag/${slug}`);
      }
      revalidatePath("/sitemap.xml");
      break;

    case "author":
      if (authorId) {
        revalidateTag(cacheTags.author(authorId), profile);
      }
      if (slug) {
        revalidatePath(`/author/${slug}`);
      }
      revalidatePath("/sitemap.xml");
      break;

    default:
      return NextResponse.json(
        {
          error:
            'Unknown type. Expected "post", "posts", "category", "tag", or "author".',
        },
        { status: 400 }
      );
  }

  return NextResponse.json({ revalidated: true });
}
