import { cookies } from "next/headers";
import type { Author } from "@/lib/data/types";

export interface Session {
  user: Author;
}

/**
 * Returns the current server-side session or null if not authenticated.
 *
 * Phase 1 (mock): reads the `mock-session` cookie set by POST /api/auth/login.
 * Phase 2 (Supabase): calls supabase.auth.getUser() and fetches the profiles row.
 */
export async function getServerSession(): Promise<Session | null> {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") {
    // Phase 2: validate session via Supabase Auth (never trust getSession())
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch the profiles row to get role, slug, and display_name
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio, role, slug, created_at")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    const author: Author = {
      id: profile.id as string,
      displayName: profile.display_name as string,
      avatarUrl: (profile.avatar_url as string | null) ?? null,
      bio: (profile.bio as string | null) ?? null,
      role: profile.role as Author["role"],
      slug: profile.slug as string,
      createdAt: profile.created_at as string,
    };

    return { user: author };
  }

  // Phase 1: decode the mock-session cookie
  const cookieStore = await cookies();
  const raw = cookieStore.get("mock-session")?.value;
  if (!raw) return null;

  try {
    const user: Author = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    if (!user?.id || !user?.role) return null;
    return { user };
  } catch {
    return null;
  }
}
