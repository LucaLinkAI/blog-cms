import { cookies } from "next/headers";
import type { Author } from "@/lib/data/types";

export interface Session {
  user: Author;
}

/**
 * Returns the current server-side session or null if not authenticated.
 *
 * Phase 1 (mock): reads the `mock-session` cookie set by POST /api/auth/login.
 * Phase 2 (Supabase): guarded by NEXT_PUBLIC_DATA_SOURCE === "supabase".
 */
export async function getServerSession(): Promise<Session | null> {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") {
    // Phase 2: delegate to Supabase — implemented in T098
    return null;
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
