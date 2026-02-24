import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "@/lib/auth/session";
import { mockEmailExists, addMockUser } from "@/lib/auth/mock";
import { addMockAuthor } from "@/lib/data/mock/provider";
import { slugify } from "@/lib/utils/slug";
import type { Author } from "@/lib/data/types";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, displayName } = parsed.data;

  // -------------------------------------------------------------------------
  // Supabase user creation
  // -------------------------------------------------------------------------
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") {
    const { supabaseAdmin } = await import("@/lib/supabase/service");

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });

    if (authError) {
      if (authError.message.toLowerCase().includes("already")) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const slug = slugify(displayName);
    await supabaseAdmin
      .from("profiles")
      .update({ display_name: displayName, slug })
      .eq("id", authData.user.id);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    return NextResponse.json(
      { user: { email }, profile: profile ?? null },
      { status: 201 }
    );
  }

  // -------------------------------------------------------------------------
  // Mock user creation
  // -------------------------------------------------------------------------
  if (mockEmailExists(email)) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  const id = uuidv4();
  const slug = slugify(displayName);
  const profile: Author = {
    id,
    displayName,
    avatarUrl: null,
    bio: null,
    role: "author",
    slug,
    createdAt: new Date().toISOString(),
  };

  addMockUser(email, password, profile);
  addMockAuthor(profile);

  return NextResponse.json({ user: { email }, profile }, { status: 201 });
}
