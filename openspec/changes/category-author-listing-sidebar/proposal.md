## Why

The blog currently lacks index pages for `/category` and `/author`, making it impossible for readers to browse all categories or discover authors directly. Adding these listing pages — plus a contextual sidebar on `/blog` — improves content discoverability and navigation.

## What Changes

- Add a new `/category` index page that lists all categories with their post counts and links to each category's `/category/[slug]` page.
- Add a new `/author` index page that lists all authors with avatar, display name, bio snippet, and post count, linking to each `/author/[slug]` page.
- Add a right-side panel to the `/blog` page containing a compact list of all categories and all authors, each linking to their respective index or detail pages.

## Capabilities

### New Capabilities

- `category-index`: `/category` index page listing all categories with name, description, and post count.
- `author-index`: `/author` index page listing all authors with avatar, display name, bio snippet, and post count.
- `blog-sidebar`: Right-side panel on `/blog` showing categories and authors as a discovery aid.

### Modified Capabilities

- None

## Impact

- **New routes**: `app/(public)/category/page.tsx`, `app/(public)/author/page.tsx`
- **Modified routes**: `app/(public)/blog/page.tsx` — layout changed to two-column (main + sidebar)
- **Data layer**: Requires `listCategories()` and `listAuthors()` calls from the existing `DataProvider`; post counts may need a new aggregation or be approximated
- **New component**: `BlogSidebar` component (or inline within the blog page)
- **No new dependencies** — uses existing `getDataProvider()`, shadcn/ui, and Tailwind
