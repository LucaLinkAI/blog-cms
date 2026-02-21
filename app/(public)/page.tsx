import type { Metadata } from "next";
import Link from "next/link";
import { getDataProvider } from "@/lib/data";
import { PostGrid } from "@/components/blog/PostGrid";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: `Welcome to ${SITE_NAME} — a modern CMS-powered blog featuring articles on technology, design, and engineering.`,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: SITE_NAME,
    description: `Welcome to ${SITE_NAME}`,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

export default async function HomePage() {
  const provider = getDataProvider();
  const { data: posts } = await provider.listPosts({ status: "published" }, 0, 9);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Hero */}
      <section className="border-b bg-muted/30 py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{SITE_NAME}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Insights and articles on technology, design, engineering, and more.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/blog">Read the Blog</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest posts */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Latest Posts</h2>
            <Button variant="ghost" asChild>
              <Link href="/blog">View all →</Link>
            </Button>
          </div>
          <PostGrid posts={posts} />
        </div>
      </section>
    </>
  );
}
