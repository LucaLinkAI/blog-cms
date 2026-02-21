import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data";
import { CreateCategorySchema } from "@/lib/validations/category";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const provider = getDataProvider();
  const categories = await provider.listCategories();
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "author") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const provider = getDataProvider();
  const existing = await provider.listCategories();

  const nameConflict = existing.some(
    (c) => c.name.toLowerCase() === parsed.data.name.toLowerCase()
  );
  const slugConflict = existing.some((c) => c.slug === parsed.data.slug);

  if (nameConflict || slugConflict) {
    return NextResponse.json(
      { error: nameConflict ? "Category name already in use" : "Category slug already in use" },
      { status: 409 }
    );
  }

  const category = await provider.createCategory(parsed.data);
  return NextResponse.json(category, { status: 201 });
}
