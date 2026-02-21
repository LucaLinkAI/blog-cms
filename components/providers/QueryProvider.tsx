"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Instantiate QueryClient in useState to prevent cross-request state leakage
  // during server-side rendering (one client per render, not module-level)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 min — most dashboard data is fresh enough
            gcTime: 5 * 60_000, // 5 min garbage collection
            refetchOnWindowFocus: false, // CMS editors don't want surprise refetches
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
