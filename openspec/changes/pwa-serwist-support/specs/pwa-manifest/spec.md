## ADDED Requirements

### Requirement: App manifest is served
The app SHALL expose a `/manifest.webmanifest` endpoint via `app/manifest.ts` with a valid Web App Manifest JSON payload, including `name`, `short_name`, `start_url`, `display`, `theme_color`, `background_color`, and at least two icon entries (192×192 and 512×512 PNG).

#### Scenario: Manifest endpoint is reachable
- **WHEN** a browser or crawler requests `/manifest.webmanifest`
- **THEN** the server responds with `Content-Type: application/manifest+json` and a valid JSON body

#### Scenario: Manifest contains required install fields
- **WHEN** the manifest is parsed by a browser
- **THEN** it contains `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color`, and `background_color`

#### Scenario: Manifest references at least two icon sizes
- **WHEN** the manifest is parsed by a browser
- **THEN** it contains icons for 192×192 and 512×512 with `type: "image/png"` and valid `src` paths under `/icons/`

### Requirement: Manifest metadata reflects site configuration
The manifest `name` and `short_name` SHALL be derived from the `NEXT_PUBLIC_SITE_NAME` environment variable so that rebranding the site updates the manifest automatically.

#### Scenario: Name uses site name env var
- **WHEN** `NEXT_PUBLIC_SITE_NAME` is set to a value
- **THEN** the manifest `name` field equals that value and `short_name` equals a truncated version (≤12 characters)

#### Scenario: Name falls back to default
- **WHEN** `NEXT_PUBLIC_SITE_NAME` is not set
- **THEN** the manifest `name` defaults to `"Blog CMS"`

### Requirement: PWA icons exist in public directory
Static PNG icon files SHALL exist at `public/icons/icon-192x192.png` and `public/icons/icon-512x512.png` and be served by Next.js as static assets.

#### Scenario: Icons are accessible as static files
- **WHEN** a browser requests `/icons/icon-192x192.png` or `/icons/icon-512x512.png`
- **THEN** the server responds with `Content-Type: image/png` and a valid PNG body
