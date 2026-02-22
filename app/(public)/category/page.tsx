import type { Metadata } from "next";
import Link from "next/link";
import { getDataProvider } from "@/lib/data";

export const revalidate = 60;

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Blog CMS";

export const metadata: Metadata = {
  title: "Categories",
  description: `Browse all categories on ${SITE_NAME}.`,
};

export default async function CategoriesPage() {
  const provider = getDataProvider();
  const categories = await provider.listCategories();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Categories</h1>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group rounded-lg border p-5 hover:border-primary transition-colors"
            >
              <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {category.name}
              </h2>
              {category.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
