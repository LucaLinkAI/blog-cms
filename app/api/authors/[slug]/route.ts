import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

const UpdateAuthorSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  // `role` is accepted here but stripped for non-admins in the handler
  role: z.enum(["admin", "editor", "author"]).optional(),
});

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const provider = getDataProvider();
  const author = await provider.getAuthorBySlug(slug);

  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  return NextResponse.json(author);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const provider = getDataProvider();

  // Param can be a UUID (id) or a slug — detect by format
  const author = UUID_REGEX.test(slug)
    ? await provider.getAuthorById(slug)
    : await provider.getAuthorBySlug(slug);

  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  // Authors can only update their own profile
  if (session.user.role === "author" && author.id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateAuthorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Strip `role` for non-admins (silently ignored, not a 403)
  const { role, ...profileFields } = input;
  const updateInput =
    session.user.role === "admin" && role ? { ...profileFields, role } : profileFields;

  const updated = await provider.updateAuthor(author.id, updateInput);
  return NextResponse.json(updated);
}
