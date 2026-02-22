## ADDED Requirements

### Requirement: Category index page exists at /category
The system SHALL serve a page at the `/category` route that lists all published categories.

#### Scenario: Page renders all categories
- **WHEN** a user navigates to `/category`
- **THEN** the page displays a list of all categories, each showing the category name and description (if present), linked to `/category/[slug]`

#### Scenario: Page renders when no categories exist
- **WHEN** a user navigates to `/category` and no categories exist
- **THEN** the page displays an empty state message instead of a list

### Requirement: Category list links to detail pages
Each category entry in the list SHALL be a navigable link to the corresponding `/category/[slug]` detail page.

#### Scenario: Clicking a category navigates to its detail page
- **WHEN** a user clicks a category name on `/category`
- **THEN** the browser navigates to `/category/[slug]` for that category

### Requirement: Category index page has appropriate metadata
The page SHALL have an HTML `<title>` and meta description suitable for SEO.

#### Scenario: Page metadata is present
- **WHEN** the `/category` page is rendered
- **THEN** the document title is set to "Categories" (or similar) and a meta description is present
