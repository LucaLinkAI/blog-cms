// Supabase DataProvider — implemented in Phase 10 (T096)
// Stub export keeps the Phase 1 build from failing when NEXT_PUBLIC_DATA_SOURCE !== "supabase"
import type { DataProvider } from "../types";

export function createSupabaseDataProvider(): DataProvider {
  throw new Error(
    "SupabaseDataProvider is not yet implemented. Set NEXT_PUBLIC_DATA_SOURCE=mock for Phase 1."
  );
}
