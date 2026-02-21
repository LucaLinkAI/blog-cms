"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/category/technology", label: "Categories" },
];

export function Navbar() {
  const pathname = usePathname();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Skip to main content — WCAG FR-039 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>

        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold text-foreground hover:text-primary transition-colors"
          aria-label={`${siteName} — home`}
        >
          {siteName}
        </Link>

        {/* Navigation */}
        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-6" role="list">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === href || pathname.startsWith(href + "/")
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  aria-current={pathname === href ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/dashboard"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
