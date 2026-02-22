## Context

The blog already has `/category/[slug]` and `/author/[slug]` detail pages, but no index pages at `/category` or `/author`. The `/blog` page is currently a single-column layout with search, tag pills, and a post grid. The data layer (`DataProvider`) already exposes `listCategories()`, `listAuthors()`, and `listPosts()`, so no new data methods are needed.

## Goals / Non-Goals

**Goals:**
- Add a `/category` index page listing all categories
- Add an `/author` index page listing all authors
- Refactor `/blog` to a two-column layout with a right sidebar showing category and author links

**Non-Goals:**
- Pagination on `/category` or `/author` index pages (counts are expected to be small)
- Post count aggregation from the database (use `listPosts` with count if cheap, otherwise omit counts for now)
- Search or filtering on the index pages
- Changes to `/category/[slug]` or `/author/[slug]` detail pages

## Decisions

### Two-column layout for `/blog`
**Decision**: Add a sticky right sidebar using CSS Grid (`grid-cols-[1fr_280px]`) inside the existing container.

**Rationale**: The existing layout uses `max-w-6xl` container; a fixed-width sidebar fits without a major restructure. Sticky positioning keeps the sidebar visible while scrolling the post list.

**Alternative considered**: Separate `BlogSidebar` server component vs. inline JSX in `blog/page.tsx`. A dedicated `components/blog/BlogSidebar.tsx` server component is preferred for reusability.

### Data fetching for index pages
**Decision**: Use `provider.listCategories()` and `provider.listAuthors()` directly in the new page server components — no additional API routes.

**Rationale**: Both calls are already part of `DataProvider`. Server components in Next.js 15 App Router can call them directly.

### Post count on index pages
**Decision**: Omit post counts for the initial implementation to avoid N+1 queries. If the data provider exposes counts cheaply in the future, they can be added.

**Alternative considered**: Fetching `listPosts` per category/author to count — too expensive without a dedicated aggregate query.

### `revalidate` strategy
**Decision**: Set `export const revalidate = 60` on both new pages (matching the existing `/blog` page), so ISR keeps data reasonably fresh.

## Risks / Trade-offs

- **No post counts**: Index pages won't show how many posts each category/author has. → Acceptable for MVP; can add later.
- **Sidebar on mobile**: Two-column grid will stack on small screens using `md:grid-cols-[1fr_280px]`, so mobile stays single-column. → Sidebar appears below posts on mobile, which is acceptable.
- **Static params for new index pages**: `/category` and `/author` are simple index pages with no dynamic segment, so no `generateStaticParams` needed.
