import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PostPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
}

function buildPageUrl(
  basePath: string,
  page: number,
  searchParams?: Record<string, string>
): string {
  const params = new URLSearchParams({ ...searchParams, page: String(page) });
  return `${basePath}?${params.toString()}`;
}

export function PostPagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: PostPaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  // Build page window: always show first, last, current ± 1
  const pageNumbers = new Set<number>();
  pageNumbers.add(1);
  pageNumbers.add(totalPages);
  for (let p = Math.max(1, currentPage - 1); p <= Math.min(totalPages, currentPage + 1); p++) {
    pageNumbers.add(p);
  }
  const sortedPages = Array.from(pageNumbers).sort((a, b) => a - b);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 mt-10"
    >
      {prevPage ? (
        <Button variant="outline" size="icon" asChild aria-label="Previous page">
          <Link href={buildPageUrl(basePath, prevPage, searchParams)}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon" disabled aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {sortedPages.map((page, idx) => {
        const prevNum = sortedPages[idx - 1];
        const showEllipsis = prevNum !== undefined && page - prevNum > 1;
        return (
          <span key={page} className="flex items-center gap-2">
            {showEllipsis && (
              <span className="px-1 text-muted-foreground" aria-hidden="true">
                …
              </span>
            )}
            {page === currentPage ? (
              <Button
                variant="default"
                size="icon"
                aria-current="page"
                aria-label={`Page ${page}`}
              >
                {page}
              </Button>
            ) : (
              <Button variant="outline" size="icon" asChild aria-label={`Page ${page}`}>
                <Link href={buildPageUrl(basePath, page, searchParams)}>{page}</Link>
              </Button>
            )}
          </span>
        );
      })}

      {nextPage ? (
        <Button variant="outline" size="icon" asChild aria-label="Next page">
          <Link href={buildPageUrl(basePath, nextPage, searchParams)}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon" disabled aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
