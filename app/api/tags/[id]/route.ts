import { NextRequest, NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data";
import { getServerSession } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
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

  const existing = await provider.listTags();
  const tag = existing.find((t) => t.id === id);
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await provider.deleteTag(id);
  return new NextResponse(null, { status: 204 });
}
