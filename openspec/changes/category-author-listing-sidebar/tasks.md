## 1. Category Index Page

- [x] 1.1 Create `app/(public)/category/page.tsx` with `export const revalidate = 60` and page metadata (`title: "Categories"`)
- [x] 1.2 Fetch all categories via `getDataProvider().listCategories()` in the server component
- [x] 1.3 Render a grid/list of category cards, each showing name and description (if present), linked to `/category/[slug]`
- [x] 1.4 Add empty state UI when no categories exist

## 2. Author Index Page

- [x] 2.1 Create `app/(public)/author/page.tsx` with `export const revalidate = 60` and page metadata (`title: "Authors"`)
- [x] 2.2 Fetch all authors via `getDataProvider().listAuthors()` in the server component
- [x] 2.3 Render a grid/list of author cards, each showing avatar (if available), display name, and bio snippet (if present), linked to `/author/[slug]`
- [x] 2.4 Add empty state UI when no authors exist

## 3. Blog Sidebar Component

- [x] 3.1 Create `components/blog/BlogSidebar.tsx` as a server component accepting `categories` and `authors` props
- [x] 3.2 Implement a "Categories" section in the sidebar listing each category name linked to `/category/[slug]`, with a "View all" link to `/category`
- [x] 3.3 Implement an "Authors" section in the sidebar listing each author name (and avatar thumbnail if available) linked to `/author/[slug]`, with a "View all" link to `/author`
- [x] 3.4 Handle empty states: omit a section if its data list is empty

## 4. Blog Page Layout Update

- [x] 4.1 Update `app/(public)/blog/page.tsx` to fetch categories and authors alongside existing data (add to the `Promise.all` call)
- [x] 4.2 Refactor the return JSX to a two-column CSS Grid layout: `grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8`
- [x] 4.3 Place the existing search bar, tag pills, post grid, and pagination in the main (left) column
- [x] 4.4 Render `<BlogSidebar categories={...} authors={...} />` in the right column with `sticky top-8` positioning

## 5. Navigation Links (Optional Polish)

- [x] 5.1 Verify the Navbar or footer has links to `/category` and `/author` (add if missing)
