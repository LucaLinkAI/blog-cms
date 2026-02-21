import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getDataProvider } from "@/lib/data";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
  const rawSize = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20;
  const pageSize = Math.min(50, Math.max(1, rawSize));

  const provider = getDataProvider();
  const result = await provider.listMedia(page, pageSize);
  return NextResponse.json(result);
}
