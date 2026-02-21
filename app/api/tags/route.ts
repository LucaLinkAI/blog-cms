import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data";
import { CreateTagSchema } from "@/lib/validations/tag";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const provider = getDataProvider();
  const tags = await provider.listTags();
  return NextResponse.json(tags);
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

  const parsed = CreateTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const provider = getDataProvider();
  const existing = await provider.listTags();

  const nameConflict = existing.some(
    (t) => t.name.toLowerCase() === parsed.data.name.toLowerCase()
  );
  const slugConflict = existing.some((t) => t.slug === parsed.data.slug);

  if (nameConflict || slugConflict) {
    return NextResponse.json(
      { error: nameConflict ? "Tag name already in use" : "Tag slug already in use" },
      { status: 409 }
    );
  }

  const tag = await provider.createTag(parsed.data);
  return NextResponse.json(tag, { status: 201 });
}
