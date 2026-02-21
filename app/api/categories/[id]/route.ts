import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data";
import { UpdateCategorySchema } from "@/lib/validations/category";
import { getServerSession } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "author") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const provider = getDataProvider();

  const existing = await provider.listCategories();
  const category = existing.find((c) => c.id === id);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Uniqueness checks (skip self)
  if (parsed.data.name) {
    const nameConflict = existing.some(
      (c) =>
        c.id !== id &&
        c.name.toLowerCase() === parsed.data.name!.toLowerCase()
    );
    if (nameConflict) {
      return NextResponse.json(
        { error: "Category name already in use" },
        { status: 409 }
      );
    }
  }
  if (parsed.data.slug) {
    const slugConflict = existing.some(
      (c) => c.id !== id && c.slug === parsed.data.slug
    );
    if (slugConflict) {
      return NextResponse.json(
        { error: "Category slug already in use" },
        { status: 409 }
      );
    }
  }

  const updated = await provider.updateCategory(id, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "author") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const provider = getDataProvider();

  const existing = await provider.listCategories();
  const category = existing.find((c) => c.id === id);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await provider.deleteCategory(id);
  return new NextResponse(null, { status: 204 });
}
