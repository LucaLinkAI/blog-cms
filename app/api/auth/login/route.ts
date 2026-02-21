import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { validateMockCredentials } from "@/lib/auth/mock";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing or malformed fields", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const profile = validateMockCredentials(email, password);

  if (!profile) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Encode the session as base64 JSON in a cookie
  const sessionPayload = Buffer.from(JSON.stringify(profile)).toString(
    "base64"
  );

  const cookieStore = await cookies();
  cookieStore.set("mock-session", sessionPayload, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    // No maxAge = session cookie (expires on browser close)
  });

  return NextResponse.json({
    user: { id: profile.id, email },
    profile: {
      id: profile.id,
      displayName: profile.displayName,
      role: profile.role,
      slug: profile.slug,
    },
  });
}
