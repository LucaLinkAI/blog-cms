## ADDED Requirements

### Requirement: Blog page has a right-side sidebar
The `/blog` page layout SHALL include a right-side panel alongside the main post list.

#### Scenario: Sidebar is visible on medium and larger screens
- **WHEN** a user views `/blog` on a screen width ≥ 768px
- **THEN** a sidebar panel is displayed to the right of the post list

#### Scenario: Sidebar stacks below content on small screens
- **WHEN** a user views `/blog` on a screen width < 768px
- **THEN** the sidebar renders below the post grid (not overlapping it)

### Requirement: Sidebar shows list of categories
The sidebar SHALL include a section listing all categories, each linking to `/category/[slug]`.

#### Scenario: Categories are listed in sidebar
- **WHEN** the `/blog` page renders and categories exist
- **THEN** the sidebar displays each category name as a link to `/category/[slug]`

#### Scenario: No categories section when empty
- **WHEN** the `/blog` page renders and no categories exist
- **THEN** the sidebar omits the categories section or shows an empty state

### Requirement: Sidebar shows list of authors
The sidebar SHALL include a section listing all authors, each linking to `/author/[slug]`.

#### Scenario: Authors are listed in sidebar
- **WHEN** the `/blog` page renders and authors exist
- **THEN** the sidebar displays each author's display name (and avatar if available) as a link to `/author/[slug]`

#### Scenario: No authors section when empty
- **WHEN** the `/blog` page renders and no authors exist
- **THEN** the sidebar omits the authors section or shows an empty state

### Requirement: Sidebar links to full index pages
The sidebar SHALL include "View all" or equivalent links to `/category` and `/author` for users who want to browse the full list.

#### Scenario: View all link for categories
- **WHEN** the sidebar renders with at least one category
- **THEN** a link to `/category` is present in the categories section

#### Scenario: View all link for authors
- **WHEN** the sidebar renders with at least one author
- **THEN** a link to `/author` is present in the authors section
