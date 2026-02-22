## ADDED Requirements

### Requirement: Service worker is registered and active
The app SHALL register a service worker (`/sw.js`) on first page load in production. The service worker MUST use `skipWaiting: true` and `clientsClaim: true` so that a new worker takes control of all open tabs immediately upon activation.

#### Scenario: Service worker registers on first visit
- **WHEN** a user visits any page in production for the first time
- **THEN** the browser registers `/sw.js` and the service worker moves to `activated` state

#### Scenario: New service worker activates immediately
- **WHEN** a new version of the service worker is installed
- **THEN** it skips the waiting phase and claims all open clients without requiring a page reload

#### Scenario: Service worker is not registered in development
- **WHEN** the app runs with `NODE_ENV=development`
- **THEN** no service worker is registered and no caching occurs

### Requirement: Static assets are precached at install time
The service worker SHALL precache all static Next.js assets (JS chunks, CSS, fonts) enumerated in `__SW_MANIFEST` at install time so they are available without a network request on subsequent visits.

#### Scenario: Precache populated at install
- **WHEN** the service worker installs
- **THEN** all entries in `__SW_MANIFEST` are fetched and stored in the precache

#### Scenario: Precached asset served offline
- **WHEN** the device is offline and the browser requests a previously-visited page's JS or CSS
- **THEN** the service worker responds from the precache

### Requirement: Runtime caching uses appropriate strategies per resource type
The service worker SHALL apply Serwist `defaultCache` runtime caching strategies: `CacheFirst` for static assets (images, fonts), `StaleWhileRevalidate` for page navigations, and `NetworkFirst` for API routes under `/api/`.

#### Scenario: Page navigation served stale-while-revalidate
- **WHEN** a user navigates to a blog post URL that was previously visited
- **THEN** the cached HTML is returned immediately while the network response updates the cache in the background

#### Scenario: API route uses network-first
- **WHEN** the device is online and the browser makes a request to `/api/*`
- **THEN** the service worker fetches from the network first, caching the response as a fallback

#### Scenario: API route falls back to cache when offline
- **WHEN** the device is offline and the browser makes a request to `/api/*` that has a cached response
- **THEN** the service worker returns the cached response

#### Scenario: Image served from cache when offline
- **WHEN** the device is offline and the browser requests a cover image previously loaded
- **THEN** the service worker returns the cached image

### Requirement: Service worker is disabled in development
The service worker build step SHALL be skipped when `NODE_ENV=development` to prevent conflicts with Next.js hot-module replacement.

#### Scenario: No sw.js generated in development
- **WHEN** `next dev` is run
- **THEN** no `public/sw.js` file is generated or served

### Requirement: Generated service worker files are excluded from version control
`public/sw.js` and `public/sw.js.map` SHALL be listed in `.gitignore` because they are build artifacts regenerated on every deployment.

#### Scenario: sw.js is gitignored
- **WHEN** `git status` is run after a production build
- **THEN** `public/sw.js` and `public/sw.js.map` do not appear as untracked or modified files
