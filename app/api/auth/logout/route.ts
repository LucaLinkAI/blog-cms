import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // -------------------------------------------------------------------------
  // Phase 2: Supabase sign-out
  // -------------------------------------------------------------------------
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  }

  // -------------------------------------------------------------------------
  // Phase 1: delete mock session cookie
  // -------------------------------------------------------------------------
  const cookieStore = await cookies();
  cookieStore.delete("mock-session");
  return NextResponse.json({ success: true });
}
