import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — bypasses Row-Level Security entirely.
 *
 * SERVER ONLY. Never import from Client Components or expose to the browser.
 * Used only for privileged server-side operations such as:
 *  - Creating / deleting auth users (register route)
 *  - Seeding the database
 *  - Admin-level writes that bypass RLS intentionally
 *
 * The SUPABASE_SECRET_KEY must NOT be prefixed with NEXT_PUBLIC_.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
