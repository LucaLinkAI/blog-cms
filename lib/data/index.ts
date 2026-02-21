import type { DataProvider } from "./types";

// Re-export all types so consumers import from one place
export type {
  DataProvider,
  Post,
  Category,
  Tag,
  Author,
  MediaItem,
  PaginatedResult,
  PostFilters,
  CreatePostInput,
  UpdatePostInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTagInput,
  UpdateAuthorInput,
  CreateMediaInput,
  Block,
  UserRole,
  PostStatus,
} from "./types";

let _provider: DataProvider | null = null;

/**
 * Returns the active DataProvider.
 * Switch between "mock" and "supabase" via NEXT_PUBLIC_DATA_SOURCE env var.
 *
 * Call this inside Server Components, Route Handlers, or Server Actions only.
 * Never call from Client Components.
 */
export function getDataProvider(): DataProvider {
  // For Supabase, a new client is created per call (needs fresh cookie context)
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSupabaseDataProvider } = require("./supabase/provider");
    return createSupabaseDataProvider();
  }

  // Mock provider is a singleton (stateful in-memory arrays)
  if (!_provider) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mockDataProvider } = require("./mock/provider");
    _provider = mockDataProvider;
  }

  return _provider!;
}
