# Tasks: CMS Blog Platform

**Input**: Design documents from `/specs/001-cms-blog-platform/`
**Branch**: `001-cms-blog-platform`
**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/ ✓, research.md ✓, quickstart.md ✓

**Tests**: No test tasks generated — no TDD requirement specified in the feature spec. Tests can be added in the Polish phase as needed.

**Organization**: Tasks grouped by user story to enable independent implementation and testing. Phase 1 (Mock Data) tasks come first; Phase 2 (Supabase) tasks are isolated in their own phase at the end.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete task dependencies)
- **[Story]**: Which user story (US1–US7). Setup and Foundational phases have no story label.
- All file paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: Initialize the Next.js 15 project and configure all base tooling.

- [x] T001 Initialize Next.js 15 App Router project with TypeScript: `npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir=false --import-alias="@/*"`
- [x] T002 Install all required dependencies: `@blocknote/react @blocknote/core @blocknote/shadcn @blocknote/server-util @supabase/ssr @supabase/supabase-js @tanstack/react-query zustand zod next-themes`
- [x] T003 [P] Replace Tailwind v3 config with Tailwind v4 CSS-first setup: update `postcss.config.mjs` to use `@tailwindcss/postcss`, rewrite `app/globals.css` with `@import "tailwindcss"` and `@theme {}` block for font variables
- [x] T004 [P] Initialize shadcn/ui: run `npx shadcn@latest init`, then add base components: button, card, badge, input, textarea, select, dropdown-menu, dialog, toast, separator, skeleton, avatar, label
- [x] T005 [P] Configure `tsconfig.json` path aliases (`@/*` → `./*`) and set `strict: true`; add `transpilePackages: ["@blocknote/react","@blocknote/core","@blocknote/shadcn"]` to `next.config.ts`
- [x] T006 Create `.env.example` with all required variables (`NEXT_PUBLIC_DATA_SOURCE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `REVALIDATE_SECRET`) and create `.env.local` with `NEXT_PUBLIC_DATA_SOURCE="mock"` and `NEXT_PUBLIC_SITE_URL="http://localhost:3000"`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data layer, utilities, and shared shell that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Define all shared TypeScript types and the `DataProvider` interface in `lib/data/types.ts`: `UserRole`, `PostStatus`, `Author`, `Category`, `Tag`, `Post`, `MediaItem`, `PaginatedResult<T>`, `PostFilters`, and all `Create*/Update*Input` types — copy exactly from `data-model.md §TypeScript Types`
- [x] T008 Create static mock fixture arrays in `lib/data/mock/data.ts`: 5 author profiles (1 admin, 1 editor, 3 authors), 8 categories (Technology, Design, Engineering, Product, Business, Culture, Tutorial, News) with slugs and hex colors, 20 tags (React, Next.js, TypeScript, CSS, AI, etc.), 25 posts (18 published, 5 draft, 2 archived) with realistic titles/excerpts/readingTime and properly populated `tagIds`/`categoryId`/`authorId`, 15 media items using Picsum placeholder URLs
- [x] T009 Implement `MockDataProvider` in `lib/data/mock/provider.ts` satisfying the full `DataProvider` interface: `listPosts` (filter by status/categorySlug/tagSlug/authorId/search, paginate), `getPostBySlug`, `getPostById`, `createPost` (generates uuid, auto-calculates readingTime, appends to array), `updatePost` (merges patch, enforces status transition matrix from FR-013), `deletePost`, all category/tag/author/media CRUD methods
- [x] T010 Create provider switch in `lib/data/index.ts`: export `getDataProvider()` that returns `mockDataProvider` when `NEXT_PUBLIC_DATA_SOURCE === "mock"`, otherwise lazy-requires `createSupabaseDataProvider`; re-export all types from `lib/data/types.ts`
- [x] T011 [P] Create slug utilities in `lib/utils/slug.ts`: `slugify(text: string): string` (lowercase, strip non-alphanumeric, collapse hyphens), `generateUniqueSlug(base: string, existing: string[]): string` (appends `-2`, `-3`… until unique)
- [x] T012 [P] Create reading time utility in `lib/utils/reading-time.ts`: `calculateReadingTime(blocks: Block[] | null): number` that extracts plain text from BlockNote JSON, counts words, returns `Math.ceil(wordCount / 200)` (minimum 1)
- [x] T013 [P] Create SEO utility helpers in `lib/utils/seo.ts`: `buildPostMetadata(post)`, `buildAuthorMetadata(author)`, `buildCategoryMetadata(category)`, `buildTagMetadata(tag)` — each returns a Next.js `Metadata` object with `title`, `description`, `canonical`, `openGraph` and `twitter` fields
- [x] T014 [P] Create centralized ISR cache tag strings in `lib/cache-tags.ts`: `cacheTags.posts`, `cacheTags.post(slug)`, `cacheTags.category(slug)`, `cacheTags.tag(slug)`, `cacheTags.author(id)`, `cacheTags.media`
- [x] T015 Create Zod validation schemas in `lib/validations/post.ts` (`CreatePostSchema`, `UpdatePostSchema`, `PostFiltersSchema`), `lib/validations/category.ts` (`CreateCategorySchema`, `UpdateCategorySchema`), `lib/validations/tag.ts` (`CreateTagSchema`), `lib/validations/media.ts` (`UploadMetadataSchema`) — field constraints from `data-model.md §Validation rules`
- [x] T016 [P] Create Zustand editor store in `store/editor.ts`: state fields `blocks: Block[]`, `isDirty: boolean`, `selectedBlockId: string | null`; actions `setBlocks`, `markDirty`, `markClean`, `selectBlock`; exported as `useEditorStore`
- [x] T017 [P] Create Zustand UI store in `store/ui.ts`: state `isMediaPickerOpen: boolean`, `isCommandMenuOpen: boolean`; actions `openMediaPicker`, `closeMediaPicker`; exported as `useUiStore`
- [x] T018 Create root layout in `app/layout.tsx`: import `next/font` (Inter for sans, JetBrains Mono for mono), wire CSS variables to `@theme` in `globals.css`, wrap children in `QueryClientProvider` (client component provider in `components/providers/QueryProvider.tsx`) and `ThemeProvider` from `next-themes`
- [x] T019 [P] Create `components/providers/QueryProvider.tsx` ("use client"): instantiate `QueryClient` in `useState` (not module-level), wrap children in `QueryClientProvider`; default options: `staleTime: 60_000`, `refetchOnWindowFocus: false`
- [x] T020 [P] Create `components/shared/Navbar.tsx`: site logo/name from `NEXT_PUBLIC_SITE_NAME`, navigation links (Blog, Categories), login/dashboard button; client component with `usePathname` for active state; fully keyboard-navigable (WCAG)
- [x] T021 [P] Create `components/shared/Footer.tsx`: site name, copyright year, navigation links; static server component
- [x] T022 [P] Create `components/shared/ThemeProvider.tsx` ("use client"): re-export `next-themes` `ThemeProvider` with `attribute="class"` and `defaultTheme="light"`; add dark mode toggle button component `components/shared/ThemeToggle.tsx`

**Checkpoint**: Foundation complete — data provider, types, utilities, and shell ready for user story implementation.

---

## Phase 3: User Story 1 — Visitor Reads Published Content (Priority: P1) 🎯 MVP

**Goal**: Complete public-facing blog visible without login — listing, filtering, post reading, author profiles, SEO, sitemap.

**Independent Test**: Open homepage → click into blog listing → apply a category filter → open a post → verify content renders, reading time shows, author name/avatar shows → open author profile → verify bio and posts list.

### Implementation

- [x] T023 [US1] Create `components/editor/BlockRenderer.tsx`: server component that accepts `blocks: Block[] | null` and renders HTML using `blocksToHTML()` from `@blocknote/server-util` with the shared schema; returns a `<div className="prose ...">` wrapper with the rendered HTML; no editor JS shipped to client
- [x] T024 [P] [US1] Create `components/blog/PostCard.tsx`: displays post `title`, `excerpt`, `coverImageUrl` (via `next/image`), `author.displayName`, `author.avatarUrl`, `category.name` with badge color, `publishedAt` date, `readingTime`, and a link to `/blog/[slug]`; all images must have meaningful `alt` text (WCAG FR-039)
- [x] T025 [P] [US1] Create `components/blog/PostGrid.tsx`: renders a responsive CSS grid of `PostCard` components from a `posts: Post[]` prop; shows skeleton loading state when `posts` is undefined
- [x] T026 [P] [US1] Create `components/blog/PostPagination.tsx`: renders page number links using URL search params (`?page=N`); shows current page, total pages, prev/next buttons; all controls keyboard-accessible
- [x] T027 [US1] Create `app/(public)/layout.tsx`: wraps children with `Navbar` and `Footer`; sets `<html lang="en">`
- [x] T028 [US1] Implement homepage in `app/(public)/page.tsx`: call `getDataProvider().listPosts({ status: 'published' }, 0, 9)`, render `PostGrid`; add `generateMetadata()` with site title and description; add JSON-LD `WebSite` schema; `export const revalidate = 3600`
- [x] T029 [US1] Implement blog listing page in `app/(public)/blog/page.tsx`: read `page`, `categorySlug`, `tagSlug` from `searchParams`; call `getDataProvider().listPosts(filters, page, 10)`; render `PostGrid` + `PostPagination`; add `generateMetadata()`; `export const revalidate = 60`
- [x] T030 [US1] Implement post detail page in `app/(public)/blog/[slug]/page.tsx`: call `getPostBySlug`, return 404 if null; render `BlockRenderer` with `post.content`; display author avatar, name (linked to `/author/[slug]`), `readingTime`, category badge, tag list, `publishedAt`; add `generateStaticParams` for top 50 published posts; `export const dynamicParams = true`
- [x] T031 [P] [US1] Add `generateMetadata()` to post detail page `app/(public)/blog/[slug]/page.tsx`: return `title`, `description` (from `metaTitle`/`metaDescription` or fallbacks), `canonical`, `openGraph` with `type: 'article'`, `publishedTime`, and cover image
- [x] T032 [P] [US1] Add JSON-LD Article schema to post detail page `app/(public)/blog/[slug]/page.tsx`: render `<script type="application/ld+json">` with `@type: Article`, `headline`, `author` (Person), `datePublished`, `image` per FR-025
- [x] T033 [US1] Implement category archive page in `app/(public)/category/[slug]/page.tsx`: call `getCategoryBySlug` (404 if null), `listPosts({ status: 'published', categorySlug })` with pagination; render `PostGrid` + `PostPagination`; add `generateMetadata()` and `generateStaticParams`
- [x] T034 [US1] Implement tag archive page in `app/(public)/tag/[slug]/page.tsx`: call `getTagBySlug` (404 if null), `listPosts({ status: 'published', tagSlug })` with pagination; render `PostGrid` + `PostPagination`; add `generateMetadata()` and `generateStaticParams`
- [x] T035 [US1] Implement author profile page in `app/(public)/author/[slug]/page.tsx`: call `getAuthorBySlug` (404 if null), `listPosts({ status: 'published', authorId: author.id })` with pagination; render author avatar, name, bio, published post list; add `generateMetadata()` with `author.displayName`; add JSON-LD Person schema per FR-026; `generateStaticParams` for all authors
- [x] T036 [P] [US1] Implement `GET /api/posts` route handler in `app/api/posts/route.ts`: parse `page`, `pageSize`, `status`, `categorySlug`, `tagSlug`, `authorId`, `search` from URL search params; validate with `PostFiltersSchema`; call `getDataProvider().listPosts(...)`; return paginated JSON response
- [x] T037 [P] [US1] Implement `GET /api/posts/[id]` route handler in `app/api/posts/[id]/route.ts`: call `getPostById`; return 404 JSON if null
- [x] T038 [P] [US1] Implement `GET /api/categories` route handler in `app/api/categories/route.ts`: call `listCategories()`; return JSON array
- [x] T039 [P] [US1] Implement `GET /api/tags` route handler in `app/api/tags/route.ts`: call `listTags()`; return JSON array
- [x] T040 [P] [US1] Implement `GET /api/authors` route handler in `app/api/authors/route.ts`: call `listAuthors()`; return JSON array
- [x] T041 [P] [US1] Implement `GET /api/authors/[slug]` route handler in `app/api/authors/[slug]/route.ts`: call `getAuthorBySlug`; return 404 JSON if null
- [x] T042 [US1] Create `app/sitemap.ts`: call `listPosts({ status: 'published' }, 0, 1000)`, `listCategories()`, `listTags()`, `listAuthors()` and return a `MetadataRoute.Sitemap` array including all public URLs with `lastModified`; `export const revalidate = 86400`
- [x] T043 [US1] Create `app/robots.ts`: return `MetadataRoute.Robots` allowing `/` and disallowing `/dashboard`, `/api`

**Checkpoint**: US1 complete — public blog browsable, post content renders, SEO metadata present, sitemap generated.

---

## Phase 4: User Story 2 — Author Creates and Publishes a Post (Priority: P1)

**Goal**: Block editor with all 12 block types, post create/edit/publish dashboard, slug auto-generation, reading time, SEO fields, mock auth login.

**Independent Test**: Log in as `author1@example.com` → create a new post → type a title (verify slug auto-generates) → use `/` to insert a callout block → assign a category → save as draft → publish → verify post appears on `/blog`.

### Implementation

- [x] T044 Create shared BlockNote schema in `components/editor/schema.ts`: import `BlockNoteSchema`, `defaultBlockSpecs`; define `CalloutBlock`, `BlockquoteBlock`, `DividerBlock`; export `schema = BlockNoteSchema.create({ blockSpecs: { ...defaultBlockSpecs, callout, blockquote, divider } })`
- [x] T045 Create `CalloutBlock` spec in `components/editor/blocks/CalloutBlock.tsx`: `createReactBlockSpec` with `type: "callout"`, props `icon: { default: "💡" }` and `type: { default: "info", values: ["info","warning","error"] }`, `content: "inline"`; render as `<div className="callout callout--{type}"><span>{icon}</span><div ref={contentRef}/></div>`; add callout CSS to `globals.css`
- [x] T046 [P] Create `BlockquoteBlock` spec in `components/editor/blocks/BlockquoteBlock.tsx`: `createReactBlockSpec` with `type: "blockquote"`, `content: "inline"`; render as `<blockquote className="border-l-4 pl-4 italic" ref={contentRef}/>`
- [x] T047 [P] Create `DividerBlock` spec in `components/editor/blocks/DividerBlock.tsx`: `createReactBlockSpec` with `type: "divider"`, `propSchema: {}`, `content: "none"`; render as `<hr className="my-4 border-border"/>`; no contentRef needed
- [x] T048 Create `BlockEditor` client component in `components/editor/BlockEditor.tsx` ("use client"): import `useCreateBlockNote` from `@blocknote/react`, `BlockNoteView` from `@blocknote/shadcn`, import schema from `components/editor/schema.ts`; accept props `initialContent?: Block[]`, `onChange: (blocks: Block[]) => void`, `editable?: boolean`; call `useCreateBlockNote({ schema, initialContent })`, render `<BlockNoteView editor={editor} onChange={() => onChange(editor.document)} editable={editable ?? true}/>`; wrap with `import "@blocknote/shadcn/style.css"`; update `BlockRenderer` to use same schema for `blocksToHTML`
- [x] T049 Implement mock auth: create `lib/auth/mock.ts` with `MOCK_USERS` array (same 5 users from fixtures), `getMockUser(email): Author | null`, `getMockSession(): { user: Author } | null` (reads from a module-level variable); create `app/(auth)/login/page.tsx` with email+password form (shadcn Card, Input, Button) that calls `POST /api/auth/login`
- [x] T050 Implement `POST /api/auth/login` mock handler in `app/api/auth/login/route.ts`: validate `email`+`password` with Zod (min 8 chars password), look up `getMockUser(email)`, set a mock session cookie `mock-session` with base64-encoded user JSON, return 200 with `{ user, profile }` per auth contract; return 401 if user not found
- [x] T051 Implement `POST /api/auth/logout` handler in `app/api/auth/logout/route.ts`: clear the `mock-session` cookie; return `{ success: true }`
- [x] T052 Create `lib/auth/session.ts`: export `getServerSession()` that reads the `mock-session` cookie (Phase 1) or calls Supabase `getUser()` (Phase 2, guarded by `NEXT_PUBLIC_DATA_SOURCE`); returns `{ user: Author } | null`
- [x] T053 Create dashboard auth guard layout in `app/(dashboard)/layout.tsx`: call `getServerSession()`; if null, redirect to `/login?redirectedFrom=<pathname>`; otherwise render children; add `export const dynamic = 'force-dynamic'`
- [x] T054 Create `components/dashboard/StatsCard.tsx`: displays a label, a numeric value, and an optional trend indicator; used on the dashboard overview
- [x] T055 Implement dashboard overview page in `app/(dashboard)/dashboard/page.tsx`: show total published posts, draft posts, categories, and authors using `StatsCard`; call `getDataProvider()` for counts; `export const dynamic = 'force-dynamic'`
- [x] T056 Create `components/dashboard/PostTable.tsx`: accepts `posts: Post[]`, `currentUserId: string`, `currentRole: UserRole`; renders shadcn Table with columns: title, status badge, author name, category, updated date, actions (Edit, Delete, status change); authors see only own posts (filter client-side if role is author); Edit links to `/dashboard/posts/[id]/edit`
- [x] T057 Implement post management page in `app/(dashboard)/dashboard/posts/page.tsx`: call `getServerSession()` for role/userId; call `listPosts({ status: filter, authorId: role==='author' ? userId : undefined })` with page param; render `PostTable`; add filter tabs (All, Draft, Published, Archived); `export const dynamic = 'force-dynamic'`
- [x] T058 Create `components/dashboard/PostForm.tsx` ("use client"): form with fields: title (Input, triggers slug auto-gen on blur using `slugify`), slug (Input with lock/edit toggle), excerpt (Textarea), category (Select from `listCategories()`), tags (multi-select checkboxes from `listTags()`), cover image URL (Input), metaTitle (Input, max 70 chars counter), metaDescription (Textarea, max 160 chars counter), status (Select: draft/published/archived), and a full-width `BlockEditor` for content; wires `calculateReadingTime` on content change; shows estimated reading time below editor; calls `onSave(data)` prop on submit
- [x] T059 [US2] Implement new post page in `app/(dashboard)/dashboard/posts/new/page.tsx`: fetch categories and tags server-side; render `PostForm` with empty defaults; on save, call `POST /api/posts`; on success redirect to `/dashboard/posts/[id]/edit`
- [x] T060 [US2] Implement edit post page in `app/(dashboard)/dashboard/posts/[id]/edit/page.tsx`: load post by `id` via `getPostById`; render `PostForm` with existing values; on save, call `PATCH /api/posts/[id]`; load `BlockEditor` via `dynamic(() => import(...), { ssr: false, loading: <EditorSkeleton/> })`
- [x] T061 [US2] Add `POST /api/posts` to `app/api/posts/route.ts`: authenticate via `getServerSession()` (return 401 if none); validate body with `CreatePostSchema`; compute slug uniqueness via `getDataProvider().listPosts`; calculate `readingTime`; call `createPost(input, session.user.id)`; return 201 with created post
- [x] T062 [US2] Add `PATCH /api/posts/[id]` and `DELETE /api/posts/[id]` to `app/api/posts/[id]/route.ts`: authenticate; for PATCH — validate `UpdatePostInput`, enforce status transition matrix from FR-013 (return 422 with message if invalid), check ownership (authors can only edit own posts — return 403 otherwise), call `updatePost`; for DELETE — check ownership/role, call `deletePost`; return appropriate status codes per posts contract

**Checkpoint**: US2 complete — author can log in, create/edit a post with the block editor, publish it, and see it on the public blog.

---

## Phase 5: User Story 3 — Editor Manages All Content (Priority: P2)

**Goal**: Editors see all authors' posts in dashboard, can archive, and can manage categories and tags.

**Independent Test**: Log in as `editor@example.com` → post management page shows all 25 mock posts from all authors → archive a published post → verify it disappears from public blog listing → create a new category → verify it appears in author's category dropdown.

### Implementation

- [x] T063 [US3] Update `PostTable` to show all posts when `currentRole` is `editor` or `admin` (no author filter); add author name column to table; add archive action button (visible to editors and admins, hidden from authors) that calls `PATCH /api/posts/[id]` with `{ status: 'archived' }`
- [x] T064 [US3] Create category/tag management UI in `app/(dashboard)/dashboard/settings/page.tsx`: split into two sections — "Categories" (list with edit/delete, inline create form) and "Tags" (list with delete, inline create form); restrict page render to `role === 'editor' || role === 'admin'`, redirect authors to `/dashboard`
- [x] T065 [P] [US3] Add `POST /api/categories` to `app/api/categories/route.ts`: authenticate; check role (return 403 if `author`); validate with `CreateCategorySchema` (check name and slug uniqueness — 409 if conflict); call `createCategory()`; return 201
- [x] T066 [P] [US3] Implement `app/api/categories/[id]/route.ts` with `PATCH` (validate `UpdateCategorySchema`, slug uniqueness check, call `updateCategory`, return 200) and `DELETE` (call `deleteCategory` — sets `category_id = null` on posts per data model, return 204); both require editor/admin role
- [x] T067 [P] [US3] Add `POST /api/tags` to `app/api/tags/route.ts`: authenticate; check role (403 if author); validate `CreateTagSchema` (name and slug unique — 409 if conflict); call `createTag()`; return 201
- [x] T068 [P] [US3] Implement `app/api/tags/[id]/route.ts` with `DELETE`: authenticate; check role (403 if author); call `deleteTag()`; return 204

**Checkpoint**: US3 complete — editors can see and manage all content and taxonomy.

---

## Phase 6: User Story 4 — Author Manages Their Own Posts Only (Priority: P2)

**Goal**: Authors are blocked from other authors' posts at the UI and API level; authors can update their own profile.

**Independent Test**: Log in as `author1@example.com` → post list shows only author1's posts → attempt `GET /dashboard/posts/{id-owned-by-author2}/edit` → verify redirect to dashboard with access-denied message → navigate to settings → update display name → verify change persists.

### Implementation

- [x] T069 [US4] Add author ownership check to edit post page `app/(dashboard)/dashboard/posts/[id]/edit/page.tsx`: after loading the post, if `session.user.role === 'author'` and `post.authorId !== session.user.id`, redirect to `/dashboard/posts?error=access-denied`; display a toast/banner error on the list page when this param is present
- [x] T070 [US4] Update `MockDataProvider.listPosts` to accept `authorId` filter and apply it correctly so the dashboard post page filters authors automatically via the `authorId` passed from `getServerSession()`
- [x] T071 [US4] Implement author profile settings section in `app/(dashboard)/dashboard/settings/page.tsx`: add a "Profile" section (visible to all roles) with `displayName`, `bio`, `avatarUrl` URL input fields; on save, call `PATCH /api/authors/[id]`; authors see only the Profile section (not the category/tag sections from US3)
- [x] T072 [US4] Add `PATCH /api/authors/[slug]/route.ts` handler: authenticate; if role is `author`, ensure `id === session.user.id` (403 otherwise); strip `role` field from the input if caller is not `admin`; validate `UpdateAuthorInput`; call `updateAuthor(id, input)`; return 200 with updated Author object

**Checkpoint**: US4 complete — authors are isolated to their own content and profile.

---

## Phase 7: User Story 5 — Admin Manages Users and Settings (Priority: P3)

**Goal**: Admins can view all users, change roles, and register new users (admin-managed invitation flow).

**Independent Test**: Log in as `admin@example.com` → settings page shows user list → change `author1@example.com` role to `editor` → verify change persists → use register form to create a new user → verify new author appears in the user list.

### Implementation

- [x] T073 [US5] Add a "Users" section to `app/(dashboard)/dashboard/settings/page.tsx` visible only when `session.user.role === 'admin'`: render a table of all authors (from `listAuthors()`) with name, email, role, and a role-change Select per row; on role change, call `PATCH /api/authors/[id]` with `{ role: newRole }`
- [x] T074 [US5] Update `PATCH /api/authors/[slug]/route.ts` to allow the `role` field only when the calling user has `admin` role; if a non-admin sends a `role` field, strip it silently (do not return 403 — the field simply has no effect)
- [x] T075 [US5] Implement admin-managed user registration: create `app/(auth)/register/page.tsx` with email, password, displayName form; implement `POST /api/auth/register` in `app/api/auth/register/route.ts`: authenticate, require `admin` role (403 otherwise), validate body with Zod (email valid+unique, password min 8, displayName 1–100 chars), create mock user (Phase 1: append to mock users array), return 201 with `{ user, profile }` per auth contract; 409 if email already registered

**Checkpoint**: US5 complete — admin can manage all users and roles.

---

## Phase 8: User Story 6 — Visitor Searches and Filters Posts (Priority: P3)

**Goal**: Keyword search bar on the public blog, tag filtering on the listing page, empty state messaging.

**Independent Test**: Navigate to `/blog` → enter "React" in search bar → results show only posts containing "React" in title or excerpt → clear search → apply a tag filter → verify only tagged posts show → search for a term with no matches → verify "no results" message.

### Implementation

- [x] T076 [US6] Create `components/blog/SearchBar.tsx` ("use client"): controlled Input that updates URL search param `?search=` using `useRouter().push` with a debounce of 300ms; shows a clear button when search is non-empty; aria-label for screen readers (WCAG FR-039)
- [x] T077 [US6] Add `SearchBar` to `app/(public)/blog/page.tsx` above the `PostGrid`; read `search` from `searchParams` and pass to `listPosts` filter; pass `search` to `PostGrid` for display in heading ("Showing results for '…'")
- [x] T078 [US6] Update `MockDataProvider.listPosts` to handle `search` filter: match posts where `title.toLowerCase().includes(search)` OR `excerpt?.toLowerCase().includes(search)` (case-insensitive substring match)
- [x] T079 [US6] Update `GET /api/posts` route handler in `app/api/posts/route.ts` to pass `search` query param to `listPosts` filters
- [x] T080 [US6] Add "no results" empty state to `PostGrid` component: when `posts.length === 0`, render a centered message ("No posts found. Try different search terms.") with a "Clear filters" link back to `/blog`
- [x] T081 [US6] Add tag filter UI to `app/(public)/blog/page.tsx`: render a horizontal scrollable list of all tag slugs as filter pill buttons; clicking a tag updates the URL `?tagSlug=` param; selected tag is highlighted; uses `listTags()` fetched server-side

**Checkpoint**: US6 complete — visitors can search and filter the public blog.

---

## Phase 9: User Story 7 — Author Uploads and Manages Media (Priority: P3)

**Goal**: Mock media upload, shared media library dashboard page, media picker in editor and cover image field.

**Independent Test**: Open media library → upload a JPEG (verify it appears in the grid) → open a post editor → insert an image block → use the media picker to select the uploaded image → verify image renders on the published post's public page.

### Implementation

- [x] T082 [US7] Create `components/dashboard/MediaGrid.tsx`: renders a responsive grid of `MediaItem` cards; each card shows a thumbnail (`next/image`), filename, upload date, and file size; accepts `items: MediaItem[]`, `onSelect?: (item: MediaItem) => void` prop for picker mode; shows selection highlight when in picker mode
- [x] T083 [US7] Implement media library page in `app/(dashboard)/dashboard/media/page.tsx`: call `listMedia(0, 50)`; render `MediaGrid`; add an "Upload" button that opens a file input dialog; on file select, call `POST /api/media/upload`; refresh list on success; `export const dynamic = 'force-dynamic'`
- [x] T084 [US7] Implement `GET /api/media` route handler in `app/api/media/route.ts`: authenticate (401 if no session); parse `page` and `pageSize` (max 50) from query; call `listMedia(page, pageSize)`; return paginated response per media contract
- [x] T085 [US7] Implement `POST /api/media/upload` route handler in `app/api/media/upload/route.ts` (Phase 1 mock): authenticate (401 if no session); parse `multipart/form-data`; validate `bucket` field (must be `post-covers`, `post-content`, or `avatars` — 400 otherwise); validate MIME type and file size per bucket limits from data-model.md (400 or 413 on failure); Phase 1: generate a Picsum URL using the file dimensions as a placeholder, call `createMediaItem()` with the mock URL; return 201 with `MediaItem` per media contract
- [x] T086 [US7] Add media picker Dialog to `components/dashboard/PostForm.tsx`: wrap cover image field with a "Browse Library" button that opens a Dialog containing `MediaGrid` in picker mode; on item select, populate `coverImageUrl` field and close Dialog
- [x] T087 [US7] Update `BlockEditor` image block to use media picker: when user inserts an Image block via slash command, show a Dialog with `MediaGrid` in picker mode AND a URL input tab; on selection, set the image block `url` prop; uses `useUiStore.openMediaPicker/closeMediaPicker`

**Checkpoint**: US7 complete — authors can upload, browse, and insert media in posts and cover images.

---

## Phase 10: Supabase Backend Integration (Phase 2 of Delivery)

**Purpose**: Replace the mock data and auth layer with live Supabase (PostgreSQL + Auth + Storage). Flip `NEXT_PUBLIC_DATA_SOURCE="supabase"` to activate.

**Prerequisites**: All US1–US7 tasks complete and working with mock data.

- [x] T088 Create Supabase SQL migration `supabase/migrations/001_enums.sql`: `CREATE TYPE user_role AS ENUM ('admin','editor','author')` and `CREATE TYPE post_status AS ENUM ('draft','published','archived')`
- [x] T089 Create Supabase SQL migration `supabase/migrations/002_tables.sql`: create `profiles`, `categories`, `tags`, `posts`, `post_tags`, `media` tables with all columns, constraints, foreign keys, and indexes exactly as defined in `data-model.md §Tables`
- [x] T090 Create Supabase SQL migration `supabase/migrations/003_rls.sql`: enable RLS on all tables; create `get_my_role()` SECURITY DEFINER function; create all policies from `research.md §3,4,6`: profiles (public select, own/admin update), posts (anon published only, auth role-scoped), media (authenticated all + own insert); storage object policies for the three buckets
- [x] T091 Create Supabase SQL migration `supabase/migrations/004_triggers.sql`: `handle_new_user()` trigger on `auth.users` INSERT (creates `profiles` row, auto-generates slug from email); `set_updated_at()` trigger on `posts` UPDATE; `enforce_post_status_transition()` trigger on `posts.status` UPDATE (enforces FR-013 matrix + auto-sets `published_at`) — copy SQL from `research.md §5`
- [x] T092 Create Supabase SQL migration `supabase/migrations/005_storage_buckets.sql`: create `post-covers` (public, max 5MB), `post-content` (public, max 10MB), `avatars` (public, max 2MB) storage buckets; create storage object RLS policies for authenticated upload and public read
- [x] T093 [P] Create Supabase server client in `lib/supabase/server.ts`: export `createServerClient()` that calls `@supabase/ssr` `createServerClient` with `await cookies()` getAll/setAll; safe to call from Server Components and Route Handlers
- [x] T094 [P] Create Supabase browser client in `lib/supabase/client.ts`: export `createBrowserClient()` using `@supabase/ssr` for Client Components; call once per component lifecycle
- [x] T095 [P] Create Supabase service client in `lib/supabase/service.ts`: export `supabaseAdmin` using `@supabase/supabase-js` `createClient` with `SUPABASE_SERVICE_ROLE_KEY`; marked `server-only`; used only in Route Handlers that need to bypass RLS (e.g., user creation)
- [x] T096 Implement `SupabaseDataProvider` in `lib/data/supabase/provider.ts`: implement all `DataProvider` interface methods using Supabase client from `lib/supabase/server.ts`; use `.select()` with joins for post listing (author, category, tags); wrap queries in `unstable_cache` with appropriate tags from `lib/cache-tags.ts`; map snake_case DB columns to camelCase TypeScript types
- [x] T097 Implement Next.js middleware in `middleware.ts` using `@supabase/ssr` pattern from `research.md §1`: refresh session on every request (preserve `supabaseResponse`), redirect unauthenticated users from `/dashboard/*` to `/login`; matcher excludes static files and `_next`
- [x] T098 Update `lib/auth/session.ts` to use Supabase `getUser()` (not `getSession()`) when `NEXT_PUBLIC_DATA_SOURCE === 'supabase'`; fetch the `profiles` row separately to get `role` and `slug`
- [x] T099 Update `POST /api/auth/login` in `app/api/auth/login/route.ts` for Supabase: call `supabase.auth.signInWithPassword({ email, password })`; return 401 on failure; fetch profile row for the response body; Supabase `@supabase/ssr` sets `sb-*` cookies automatically via the server client
- [x] T100 Update `POST /api/auth/logout` in `app/api/auth/logout/route.ts` for Supabase: call `supabase.auth.signOut()`; clear any remaining session cookies
- [x] T101 Update `POST /api/auth/register` in `app/api/auth/register/route.ts` for Supabase: use `supabaseAdmin.auth.admin.createUser()` to create the Supabase Auth user; the `handle_new_user` trigger creates the `profiles` row; update `profiles.display_name` and `profiles.slug` via `supabaseAdmin` to use the provided `displayName`
- [x] T102 Update `POST /api/media/upload` in `app/api/media/upload/route.ts` for Supabase Storage: authenticate via `getUser()`; validate file (MIME type + size per bucket); upload to Supabase Storage at `{bucket}/{user_id}/{timestamp}-{filename}` using `supabaseAdmin.storage.from(bucket).upload(path, file)`; insert row into `media` table via `SupabaseDataProvider.createMediaItem()`; return 201 with `MediaItem`
- [x] T103 Create ISR revalidation Route Handler in `app/api/revalidate/route.ts`: authenticate with `x-revalidate-secret` header (compare to `REVALIDATE_SECRET` env var — return 401 if mismatch); parse `{ type, slug, authorId, categorySlug }` from body; call `revalidateTag`/`revalidatePath` for the appropriate tags per `lib/cache-tags.ts`; also call `revalidatePath('/sitemap.xml')`; return `{ revalidated: true }`
- [x] T104 Wire ISR revalidation calls into post publish/archive actions: after `updatePost` succeeds with a status change in `PATCH /api/posts/[id]/route.ts`, call `fetch('/api/revalidate', ...)` with the appropriate type and slugs
- [x] T105 Create seed script in `supabase/seed.ts`: read all mock fixtures from `lib/data/mock/data.ts`; insert categories, tags, then posts (map mock IDs to new UUIDs), then `post_tags` rows using `supabaseAdmin`; skip if data already exists (upsert with `onConflict: 'slug'`); log progress per entity type

**Checkpoint**: Phase 2 delivery complete — flip `NEXT_PUBLIC_DATA_SOURCE="supabase"` to run against live Supabase.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Dark mode, dashboard overview completion, accessibility audit, bundle check, environment validation.

- [x] T106 [P] Complete dark mode support: add dark mode CSS variables to `@theme {}` in `app/globals.css` (shadcn/ui dark tokens); add `ThemeToggle` button to `Navbar`; verify all public page components have dark mode variants via `dark:` Tailwind classes
- [x] T107 [P] WCAG 2.1 AA audit of all public pages (FR-039): check keyboard navigation (tab order, focus rings), color contrast ratios (≥ 4.5:1 normal text, ≥ 3:1 large text), all images have descriptive `alt` text (FR-029), all form inputs have labels, skip-to-main-content link in `Navbar`; fix any violations found
- [x] T108 [P] Bundle audit: run `next build` and check the output — confirm no `@blocknote` package appears in the client bundle for public routes (`/blog`, `/blog/[slug]`, `/category/[slug]`, etc.); ensure BlockEditor loads only on dashboard routes via `next/dynamic`
- [x] T109 Validate `quickstart.md` end-to-end: follow Phase 1 steps (mock mode, dev server, mock login), verify all key routes load correctly; then follow Phase 2 steps (Supabase migration, seed, flip env var), verify data loads from live database
- [x] T110 [P] Add `not-found.tsx` pages: create `app/not-found.tsx` (global 404) and `app/(public)/blog/[slug]/not-found.tsx` (post not found) with clear messages and a link back to `/blog`
- [x] T111 [P] Add error boundary: create `app/error.tsx` (global error handler) and `app/(dashboard)/error.tsx` (dashboard error handler) with user-friendly messages and a retry button
- [x] T112 [P] Add loading skeletons: create `app/loading.tsx`, `app/(public)/blog/loading.tsx`, and `app/(dashboard)/loading.tsx` with `Skeleton` components matching the page layout (WCAG: no layout shift during load)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup. **BLOCKS all user stories.**
- **US1 (Phase 3)**: Depends on Foundational. No dependency on other user stories.
- **US2 (Phase 4)**: Depends on Foundational. No dependency on US1 (different routes and components).
- **US3 (Phase 5)**: Depends on US2 (reuses PostTable and auth session).
- **US4 (Phase 6)**: Depends on US2 (reuses PostForm, session, API routes).
- **US5 (Phase 7)**: Depends on US2 (reuses session and auth routes).
- **US6 (Phase 8)**: Depends on US1 (extends blog listing page).
- **US7 (Phase 9)**: Depends on US2 (reuses PostForm and dashboard layout).
- **Supabase Integration (Phase 10)**: Depends on ALL user stories being complete in mock mode.
- **Polish (Phase 11)**: Depends on all user stories and Supabase integration.

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|-----------|----------------------|
| US1 (P1) | Foundational | US2 |
| US2 (P1) | Foundational | US1 |
| US3 (P2) | US2 | US4, US5 |
| US4 (P2) | US2 | US3, US5 |
| US5 (P3) | US2 | US3, US4, US6, US7 |
| US6 (P3) | US1 | US5, US7 |
| US7 (P3) | US2 | US5, US6 |

### Parallel Opportunities Within Phases

**Phase 3 (US1)**: T024, T025, T026 (PostCard, PostGrid, PostPagination) can run in parallel. T036–T041 (API route handlers) can all run in parallel.

**Phase 4 (US2)**: T045, T046, T047 (custom block specs) can run in parallel. T049, T050, T051 are independent files.

**Phase 10 (Supabase)**: T093, T094, T095 (Supabase client files) can run in parallel. T088–T092 (SQL migrations) must run sequentially in order.

---

## Parallel Execution Examples

### US1 — Public Blog Components

```
In parallel:
  T024: Create PostCard component in components/blog/PostCard.tsx
  T025: Create PostGrid component in components/blog/PostGrid.tsx
  T026: Create PostPagination component in components/blog/PostPagination.tsx

Then:
  T028: Implement homepage (uses PostGrid)
  T029: Implement blog listing page (uses PostGrid + PostPagination)
```

### US2 — Custom Block Specs

```
In parallel:
  T045: Create CalloutBlock in components/editor/blocks/CalloutBlock.tsx
  T046: Create BlockquoteBlock in components/editor/blocks/BlockquoteBlock.tsx
  T047: Create DividerBlock in components/editor/blocks/DividerBlock.tsx

Then:
  T044: Create shared schema (uses all three block specs)
  T048: Create BlockEditor (uses schema)
```

### Phase 10 — Supabase Clients

```
In parallel:
  T093: Create lib/supabase/server.ts
  T094: Create lib/supabase/client.ts
  T095: Create lib/supabase/service.ts

Then:
  T096: Implement SupabaseDataProvider (uses all three)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — Visitor Reads Published Content
4. Complete Phase 4: US2 — Author Creates and Publishes a Post
5. **STOP and VALIDATE**: A visitor can browse and read posts; an author can log in, write, and publish
6. Deploy mock-mode build to Vercel preview

### Incremental Delivery

1. **MVP**: Setup + Foundational + US1 + US2 → Public blog + basic authoring
2. **Sprint 2**: US3 + US4 → Editorial workflow + access control
3. **Sprint 3**: US5 + US6 + US7 → Admin, search, media
4. **Phase 2**: Supabase backend integration (flip the provider)
5. **Polish**: Dark mode, accessibility audit, bundle check

### Parallel Team Strategy

Once Foundational (Phase 2) is complete:

- **Developer A**: US1 (public blog, SEO, sitemap)
- **Developer B**: US2 (block editor, dashboard, auth)
- **Developer C**: Database migrations and SupabaseDataProvider (Phase 10 prep)

---

## Notes

- `[P]` tasks touch different files and have no incomplete dependencies — safe to run in parallel
- `[USN]` label maps each task to a user story for traceability
- Each user story phase ends with an independent checkpoint — verify before proceeding
- Phase 10 (Supabase) is a backend-only phase; no UI changes required
- Commit after each task or logical group; keep commits atomic
- The mock data provider must mirror production data shapes exactly — any shape divergence will surface only on the Supabase switch
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or `NEXT_PUBLIC_*` env vars
