# Feature Specification: CMS Blog Platform

**Feature Branch**: `001-cms-blog-platform`
**Created**: 2026-02-20
**Status**: Draft
**Input**: User description: "CMS Blog Platform with Notion-like block editor, role-based authorship, content organization via categories/tags, SEO-optimized public blog, and a protected dashboard — delivered in two phases (mock data first, then live database integration)."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Reads Published Content (Priority: P1)

A visitor arrives at the blog, browses the post listing, filters by category or tag, and reads a full article. The visitor can navigate to related posts via the author's profile page.

**Why this priority**: This is the primary value delivered to end users and the reason the platform exists. Without a functional public-facing blog, the platform has no audience.

**Independent Test**: Can be tested by browsing the homepage, clicking into the blog listing, applying a category filter, and reading a post — without any login or dashboard interaction.

**Acceptance Scenarios**:

1. **Given** the blog has published posts, **When** a visitor opens the homepage, **Then** they see a curated selection of recent posts with titles, excerpts, cover images, author names, and publication dates.
2. **Given** the blog has posts in multiple categories, **When** a visitor clicks a category, **Then** they see only posts belonging to that category, paginated and sorted by publication date.
3. **Given** a published post exists, **When** a visitor opens it, **Then** they see the full rich content, the author's name and avatar, the estimated reading time, and related tags.
4. **Given** a visitor opens an author's profile page, **Then** they see the author's bio and a list of that author's published posts.
5. **Given** a post slug is invalid, **When** a visitor navigates to it, **Then** they see a clear "not found" message and a link back to the blog listing.

---

### User Story 2 - Author Creates and Publishes a Post (Priority: P1)

An authenticated author opens the dashboard, creates a new post using the rich block editor, assigns a category and tags, adds a cover image, and saves it as a draft. When ready, the author (or an editor) publishes it so it becomes publicly visible.

**Why this priority**: Content creation is the core workflow for content contributors. Without it, there is no content for visitors to read.

**Independent Test**: Can be tested end-to-end: log in as an author, create a post with at least one paragraph block, assign a category, save as draft, then publish — and verify the post appears on the public blog.

**Acceptance Scenarios**:

1. **Given** an authenticated author is on the "New Post" page, **When** they type a title, **Then** a URL-friendly slug is automatically generated from the title, which the author can optionally override.
2. **Given** an author is editing a post, **When** they use the slash command menu or markdown shortcuts in the content area, **Then** they can insert any supported block type (paragraph, heading, bulleted list, numbered list, image, code block, blockquote, callout, divider, table, embed).
3. **Given** an author saves a post, **When** the post status is "draft", **Then** the post is not visible on the public blog.
4. **Given** an author or editor publishes a post, **When** the action completes, **Then** the post immediately appears in the public blog listing with the correct metadata.
5. **Given** a post is published, **When** the author edits and saves it again, **Then** the updated content appears on the public blog.
6. **Given** an author sets an SEO title and description, **When** the post is published, **Then** those values appear in the page's search engine metadata instead of the defaults.
7. **Given** an author completes the post body, **Then** the system automatically calculates and displays an estimated reading time.

---

### User Story 3 - Editor Manages All Content (Priority: P2)

An authenticated editor can view, edit, publish, or archive any post from any author. The editor can also manage the list of categories and tags.

**Why this priority**: Editorial oversight ensures content quality and consistency. Editors need cross-author control that regular authors do not have.

**Independent Test**: Log in as an editor, open a post created by a different author, edit its content, change its status to published, then archive it — all without error.

**Acceptance Scenarios**:

1. **Given** an editor is on the post management dashboard, **When** they view the post list, **Then** they see all posts across all authors with their status, author name, category, and last-modified date.
2. **Given** an editor opens any post, **When** they make changes and save, **Then** the changes persist and reflect on the public blog (if published).
3. **Given** a post is in draft or published state, **When** an editor archives it, **Then** the post is removed from the public blog and marked as archived in the dashboard.
4. **Given** an editor creates a new category, **When** it is saved, **Then** authors can assign posts to that category and visitors can browse it.

---

### User Story 4 - Author Manages Their Own Posts Only (Priority: P2)

An authenticated author can only view and edit their own posts. They cannot modify posts belonging to other authors.

**Why this priority**: Role isolation protects the integrity of each contributor's work and is a fundamental access-control requirement.

**Independent Test**: Log in as an author, attempt to navigate to or edit another author's post, and verify the action is denied.

**Acceptance Scenarios**:

1. **Given** an author is on the dashboard post list, **When** they view it, **Then** they only see their own posts.
2. **Given** an author attempts to access a post edit page for another author's post, **Then** they receive an access-denied message and are redirected.
3. **Given** an author opens their own profile settings, **Then** they can update their display name, bio, and avatar, but not change their role.

---

### User Story 5 - Admin Manages Users and Settings (Priority: P3)

An authenticated admin can view all user accounts, change user roles, and access all platform settings. Admins have all permissions that editors and authors have, plus user management.

**Why this priority**: Administrative control is essential for platform governance but is less frequently used than content workflows.

**Independent Test**: Log in as an admin, change a user's role from author to editor, verify the user now has editor-level access in the dashboard.

**Acceptance Scenarios**:

1. **Given** an admin views the user list, **When** they select a user, **Then** they can change that user's role (admin, editor, or author).
2. **Given** an admin has full access, **When** they perform any action available to editors or authors, **Then** the action succeeds.

---

### User Story 6 - Visitor Searches and Filters Posts (Priority: P3)

A visitor uses the search bar or filter controls to find posts by keyword, category, or tag.

**Why this priority**: Search and filtering improve content discoverability, especially as the post volume grows.

**Independent Test**: Enter a keyword in the search bar and verify the results list contains only posts that match the keyword in their title, excerpt, or content.

**Acceptance Scenarios**:

1. **Given** a visitor enters a keyword in the search bar, **When** they submit, **Then** the results page shows only posts that contain the keyword in the title or excerpt.
2. **Given** a visitor is on the blog listing, **When** they apply a tag filter, **Then** only posts with that tag are shown.
3. **Given** a search query matches no posts, **Then** the page shows a clear "no results" message with a suggestion to try different terms.

---

### User Story 7 - Author Uploads and Manages Media (Priority: P3)

An authenticated author can upload images to use as cover images or inline within post content. Uploaded media is available in a media library for reuse across posts.

**Why this priority**: Visual content significantly enhances blog posts, and a media library prevents duplicate uploads and simplifies asset management.

**Independent Test**: Upload an image via the media library, insert it as a post cover image, and verify it renders on the public post page.

**Acceptance Scenarios**:

1. **Given** an author is editing a post, **When** they upload an image for the cover or inline in the content, **Then** the image appears in the post and is added to the media library.
2. **Given** an author opens the media library, **When** they browse existing uploads, **Then** they can select and insert a previously uploaded image into their current post.
3. **Given** an author uploads a file that exceeds the allowed size, **Then** the system rejects the upload and displays a clear error message stating the file size limit.

---

### Edge Cases

- Author-vs-author concurrent edits are not possible due to post ownership isolation. The residual case — an Editor/Admin and the post's Author saving simultaneously — is resolved by last-write-wins; no special locking or conflict UI is required.
- How does the system handle a post title that generates a slug already in use by another post?
- What happens if a category is deleted while posts are still assigned to it?
- How does the system render rich content blocks that contain unsupported or malformed data?
- What happens when a visitor searches with special characters or extremely long queries?
- How does the platform behave for an unauthenticated user who attempts to access dashboard pages?
- What happens if a cover image becomes unavailable after being referenced by a published post?

---

## Requirements *(mandatory)*

### Functional Requirements

**Content Management**

- **FR-001**: The system MUST allow authenticated authors to create, edit, save as draft, and delete their own posts.
- **FR-002**: The system MUST allow authenticated editors and admins to create, edit, publish, archive, and delete any post.
- **FR-003**: Posts MUST support a rich block-based content format including at minimum: paragraphs, headings (three levels), bulleted lists, numbered lists, to-do lists, images, code blocks, blockquotes, callouts, dividers, tables, and embedded content.
- **FR-004**: The content editor MUST support a slash command menu to insert any block type by typing `/` followed by the block name.
- **FR-005**: The content editor MUST support markdown-style shortcuts (e.g., `#` for heading, `-` for bullet list, `>` for blockquote) that automatically convert to the corresponding block.
- **FR-006**: The content editor MUST support a floating formatting toolbar that appears when text is selected.
- **FR-007**: The content editor MUST allow blocks to be reordered by dragging.
- **FR-008**: The system MUST automatically generate a URL-friendly slug from a post's title when the post is first created, and allow the author to override it.
- **FR-009**: The system MUST prevent duplicate slugs and notify the author when a conflict is detected.
- **FR-010**: The system MUST automatically calculate and display an estimated reading time for each post based on word count.
- **FR-011**: Posts MUST support a cover image, excerpt, SEO title override, and SEO description override.
- **FR-012**: Posts MUST support assignment to exactly one category and zero or more tags.
- **FR-013**: The system MUST support three post statuses with the following allowed transitions:
  - `draft` → `published` (author, editor, admin)
  - `published` → `draft` (author on own post, editor, admin) — removes post from public blog
  - `published` → `archived` (editor, admin) — removes post from public blog
  - `draft` → `archived` (editor, admin)
  - `archived` → `draft` (editor, admin) — restored for revision; must be explicitly re-published
  - `archived` → `published` is NOT allowed; archived posts must be restored to draft before republishing

**Content Organization**

- **FR-014**: The system MUST allow admins and editors to create, rename, and delete categories, each with a name, slug, description, and display color.
- **FR-015**: The system MUST allow admins and editors to create and delete tags, each with a name and slug.
- **FR-016**: Deleting a category or tag MUST NOT delete the posts assigned to it; posts simply lose the category or tag assignment.

**Public Blog**

- **FR-017**: The public blog listing MUST display published posts in reverse chronological order with title, excerpt, cover image, author name, category, and publication date.
- **FR-018**: The blog listing MUST be paginated, showing a fixed number of posts per page with navigation controls.
- **FR-019**: Visitors MUST be able to filter the blog listing by category, by tag, or by author.
- **FR-020**: Visitors MUST be able to search posts by keyword matching title or excerpt.
- **FR-021**: Each post page MUST display the full rich content, author name and avatar, estimated reading time, category, tags, and publication date.
- **FR-022**: Author profile pages MUST display the author's name, avatar, bio, and a paginated list of their published posts.
- **FR-023**: The public blog MUST be accessible without authentication.

**SEO**

- **FR-024**: Every public page MUST have a unique page title, meta description, and canonical URL.
- **FR-025**: Post pages MUST include structured article metadata identifying the post title, author, publication date, and cover image.
- **FR-026**: Author pages MUST include structured person metadata identifying the author's name and profile.
- **FR-027**: The platform MUST auto-generate a sitemap listing all published posts, categories, tags, and author pages.
- **FR-028**: The platform MUST serve a robots.txt file allowing public page indexing and disallowing dashboard pages.
- **FR-029**: All images displayed on public pages MUST include descriptive alt text.

**Access Control**

- **FR-030**: The system MUST enforce three user roles — Admin, Editor, and Author — each with distinct permissions as defined below:
  - Admin: full CRUD on all posts, manage all users, access all settings.
  - Editor: full CRUD on all posts including publish and archive; view-only access to user list; no settings access.
  - Author: create, edit, and publish own posts only; update own profile; no access to other authors' posts or user management.
- **FR-031**: Dashboard pages MUST require authentication; unauthenticated users MUST be redirected to the login page.
- **FR-032**: Authors MUST be blocked from viewing or editing other authors' posts at both the interface and data levels.
- **FR-033**: Authors MUST be able to update their own profile (display name, bio, avatar).
- **FR-034**: Admins MUST be able to view all users and change any user's role.

**Media**

- **FR-035**: The system MUST allow authenticated users to upload images for use as post cover images and inline within post content.
- **FR-036**: Uploaded media MUST be accessible through a shared media library visible to all authenticated users. Any authenticated user MAY browse and reuse any media item regardless of who uploaded it. Ownership is recorded for audit purposes only and does not restrict visibility.
- **FR-037**: The system MUST reject uploads that exceed the defined file size limits and display a user-facing error message.
- **FR-038**: Supported upload formats MUST include JPEG, PNG, and WebP for cover images and avatars; post content uploads additionally support common image formats and MP4 video.

**Accessibility**

- **FR-039**: All public-facing pages (homepage, blog listing, post, category, tag, author) MUST meet WCAG 2.1 Level AA conformance, including keyboard navigability, sufficient color contrast, screen-reader-compatible markup, and descriptive link text.
- **FR-040**: Dashboard pages MUST be usable via keyboard navigation as a best-effort target; full WCAG 2.1 AA audit of the dashboard is out of scope.

### Key Entities

- **Post**: The primary content unit. Has a title, rich content body, URL slug, excerpt, cover image, SEO title and description overrides, publication status, estimated reading time, and publication date. Belongs to one Author, one Category, and zero or more Tags.
- **Author (Profile)**: Represents a content contributor. Has a display name, avatar, bio, role, and a public profile URL. Linked to an authenticated user account.
- **Category**: A primary content grouping. Has a name, slug, description, and display color. A post belongs to exactly one category.
- **Tag**: A secondary content label. Has a name and slug. A post may have many tags; a tag may apply to many posts.
- **Media Item**: An uploaded file. Has a filename, public URL, file type, file size, and optional alt text. Records the uploading user for audit purposes; visible and reusable by all authenticated users.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can discover and open any published post in 3 clicks or fewer from the homepage.
- **SC-002**: An author can create, write content, assign a category and tags, and publish a new post within 5 minutes on their first attempt.
- **SC-003**: All public pages are visible and usable within 2.5 seconds on a standard broadband connection.
- **SC-004**: 100% of published posts automatically have a page title, meta description, and canonical URL without requiring manual intervention by the author.
- **SC-005**: Keyword search returns results in under 1 second for any query across a library of at least 100 published posts.
- **SC-006**: Authors cannot access, view, or modify another author's posts — verified by attempting access to restricted content and receiving a denial 100% of the time.
- **SC-007**: The platform correctly enforces all three role levels (Admin, Editor, Author) with zero permission leakage between roles, verified by role-based access tests.
- **SC-008**: All published post pages include valid structured metadata, verifiable by structured data validation tools without errors.
- **SC-009**: Image uploads complete and the image appears in the media library within 5 seconds for files up to the stated size limit.
- **SC-010**: The platform sitemap is updated within 24 hours of any post being published or archived, without manual intervention.
- **SC-011**: All public-facing pages pass an automated WCAG 2.1 AA accessibility audit with zero critical violations.

---

## Clarifications

### Session 2026-02-20

- Q: Can an Author self-publish their own posts, or must publishing be done by an Editor or Admin? → A: Authors can publish their own posts directly (Option A). FR-030 updated accordingly.
- Q: Which reverse post-status transitions are allowed? → A: Published can revert to Draft; Archived restores to Draft only — archived posts cannot transition directly to published (Option B). FR-013 updated with full transition matrix.
- Q: How should concurrent post-edit conflicts be handled? → A: Author access isolation eliminates author-vs-author concurrent edits. Residual case (Editor/Admin + Author editing same post simultaneously) resolves as last-write-wins with no special UI required. Edge Cases section updated.
- Q: Should the platform target a formal accessibility compliance level? → A: WCAG 2.1 AA for all public pages; best-effort keyboard navigation for dashboard (Option A). FR-039, FR-040, and SC-011 added.
- Q: Whose media files can a user see and reuse from the media library? → A: All authenticated users can view and reuse any uploaded media; ownership is recorded for audit only (Option B). FR-036 and Key Entities updated.

---

## Assumptions

- User registration is admin-managed (invitation or direct creation); self-registration by the public is out of scope.
- The blog is single-tenant (one brand, one site); multi-tenant support is out of scope.
- Comments, social sharing, and newsletter features are out of scope for this specification.
- Email notifications (e.g., "your post was published") are out of scope for this specification.
- Content versioning and post history/rollback are out of scope for this specification.
- Scheduled publishing (setting a future publish date) is out of scope for this specification.
- The rich content editor renders content on public pages without loading the full editor interface, keeping public pages fast and lightweight.
- The data layer is initially backed by static mock data to enable frontend development before the live database is ready; switching to live data does not require changes to UI components.
- OAuth provider selection for social login (e.g., Google, GitHub) will be determined during planning; email/password authentication is the baseline requirement.
- Dark mode support is a low-priority enhancement; the platform must function fully in light mode as the default.
