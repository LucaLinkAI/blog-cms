## ADDED Requirements

### Requirement: Author index page exists at /author
The system SHALL serve a page at the `/author` route that lists all registered authors.

#### Scenario: Page renders all authors
- **WHEN** a user navigates to `/author`
- **THEN** the page displays a list of all authors, each showing the author's avatar (if available), display name, and a bio snippet (if available), linked to `/author/[slug]`

#### Scenario: Page renders when no authors exist
- **WHEN** a user navigates to `/author` and no authors exist
- **THEN** the page displays an empty state message instead of a list

### Requirement: Author list links to detail pages
Each author entry in the list SHALL be a navigable link to the corresponding `/author/[slug]` detail page.

#### Scenario: Clicking an author navigates to their detail page
- **WHEN** a user clicks an author's name or avatar on `/author`
- **THEN** the browser navigates to `/author/[slug]` for that author

### Requirement: Author index page has appropriate metadata
The page SHALL have an HTML `<title>` and meta description suitable for SEO.

#### Scenario: Page metadata is present
- **WHEN** the `/author` page is rendered
- **THEN** the document title is set to "Authors" (or similar) and a meta description is present
