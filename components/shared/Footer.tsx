import Link from "next/link";

export function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {year} {siteName}. All rights reserved.
          </p>
          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-6" role="list">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap.xml"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
