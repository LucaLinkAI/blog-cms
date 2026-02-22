## Context

The blog is a Next.js 15/16 app (App Router) deployed on Vercel. It currently has no service worker, no web manifest, and no offline support. Users visiting on mobile cannot install it or read cached articles when offline.

Serwist is the recommended library for adding PWA support to Next.js. It wraps Workbox with a Next.js-aware plugin (`@serwist/next`) and a service worker runtime (`@serwist/sw`). The key constraint is that Serwist requires **Webpack** — Next.js 16's default Turbopack bundler is not supported for production builds.

## Goals / Non-Goals

**Goals:**
- App is installable (manifest + service worker registration)
- Static assets and previously-visited pages are available offline
- First visit after install loads from cache (stale-while-revalidate for pages, cache-first for assets)
- No changes to UX or routing — PWA is purely additive

**Non-Goals:**
- Push notifications
- Background sync for post submissions
- Custom offline fallback page (Serwist's `defaultCache` handles navigation gracefully)
- Per-post explicit "save for offline" toggle

## Decisions

### 1. Use `@serwist/next` + `@serwist/sw` (not `next-pwa`)

`next-pwa` is unmaintained and does not support Next.js App Router or Next.js 15+. Serwist is its active successor, maintained by the original Workbox contributors, with first-class Next.js App Router support.

**Alternatives considered:**
- `next-pwa` — abandoned, does not support App Router
- Manual Workbox — more flexible but requires far more boilerplate and loses the `__SW_MANIFEST` injection that `@serwist/next` provides

### 2. Use `defaultCache` for runtime caching

`@serwist/next/worker` exports `defaultCache`, a pre-configured set of Workbox strategies:
- `CacheFirst` for static assets (JS, CSS, fonts, images)
- `StaleWhileRevalidate` for page navigations
- `NetworkFirst` for API routes

This is sufficient for a read-heavy blog. Custom strategies are not needed.

**Alternatives considered:**
- Hand-rolling `runtimeCaching` entries — unnecessary complexity for a blog with no write-heavy client interactions

### 3. Disable Serwist in development

Setting `disable: process.env.NODE_ENV === "development"` in `withSerwistInit` prevents the service worker from interfering with hot-module replacement and Next.js Fast Refresh during local development.

`next dev --turbopack` can still be used in dev because the Serwist plugin is disabled and Webpack is only required at build time.

### 4. TypeScript: separate `tsconfig.sw.json` for the service worker

`app/sw.ts` targets the `webworker` lib, which conflicts with the `dom` lib used by the rest of the app. Rather than polluting the root `tsconfig.json`, a dedicated `tsconfig.sw.json` is created that extends the root config and overrides `lib` to `["webworker", "esnext"]`. The Serwist compiler resolves this automatically.

**Alternatives considered:**
- Adding `webworker` to root `tsconfig.json` — causes type collisions between `Window` and `ServiceWorkerGlobalScope` globals
- Using a JS service worker — loses type safety

### 5. Manifest via `app/manifest.ts` (Next.js metadata API)

Next.js 13.3+ supports `app/manifest.ts` as a built-in metadata route. It outputs `/manifest.webmanifest` automatically with the correct `Content-Type` header. No manual `public/manifest.json` or custom route needed.

### 6. Icons: two PNG sizes in `public/icons/`

Web App Manifest requires at minimum a 192×192 and a 512×512 icon for Chrome's install criteria. These are placed in `public/icons/` and referenced from `app/manifest.ts`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Webpack build is slower than Turbopack | Accepted — only affects production build, not dev server |
| Cached pages may serve stale content after deploy | Serwist's `reloadOnOnline: true` and `skipWaiting: true` + `clientsClaim: true` ensure clients pick up new service workers on reconnect |
| `public/sw.js` committed accidentally | Add `public/sw.js` and `public/sw.js.map` to `.gitignore` |
| Supabase API responses cached offline incorrectly | `defaultCache` uses `NetworkFirst` for API routes — a failed network request falls back to cache rather than caching aggressively |

## Migration Plan

1. Install dependencies (`@serwist/next`, `@serwist/sw`)
2. Add `public/sw.js` and `public/sw.js.map` to `.gitignore`
3. Create `tsconfig.sw.json`
4. Create `app/sw.ts`
5. Create `app/manifest.ts` with site name + icons
6. Add PWA icons to `public/icons/`
7. Wrap `next.config.ts` with `withSerwistInit`
8. Update `package.json` build script: `next build --webpack`
9. Build locally and verify `public/sw.js` is generated
10. Deploy — Vercel picks up the updated build script automatically

**Rollback:** Remove the `withSerwistInit` wrapper from `next.config.ts` and revert the build script. The service worker file (`public/sw.js`) will no longer be served, and browsers will unregister it on next visit.

## Open Questions

- None — all decisions resolved above.
