import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ user: null, profile: null }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: session.user.id },
    profile: {
      id: session.user.id,
      displayName: session.user.displayName,
      role: session.user.role,
      slug: session.user.slug,
    },
  });
}
