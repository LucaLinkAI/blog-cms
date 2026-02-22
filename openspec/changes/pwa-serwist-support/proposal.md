## Why

The blog is a server-rendered Next.js app with no offline capability or installability. Converting it to a PWA using Serwist gives users a native-app-like experience — offline reading of cached posts, an install prompt on mobile and desktop, and faster repeat visits via precached static assets.

## What Changes

- Add `@serwist/next` and `@serwist/sw` as dependencies
- Create `app/sw.ts` — service worker entry point using Serwist's baseline config with `defaultCache`
- Create `app/manifest.ts` — Next.js metadata manifest (name, icons, theme colour, `display: standalone`)
- Update `next.config.ts` — wrap with `withSerwistInit`, set `swSrc`/`swDest`, disable in development
- **BREAKING**: Switch build script from `next build` (Turbopack) to `next build --webpack` — Serwist requires Webpack, not Turbopack
- Update `scripts/deploy.sh` — no change needed (build script handles it)
- Add PWA icons to `public/` (192×192 and 512×512)

## Capabilities

### New Capabilities
- `pwa-manifest`: App manifest defining name, icons, theme colour, start URL, and `display: standalone` for installability
- `pwa-service-worker`: Service worker lifecycle (precaching static assets, runtime caching strategy, offline fallback, skip-waiting + clients-claim)

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **Dependencies**: `@serwist/next`, `@serwist/sw` added
- **Build pipeline**: `--webpack` flag required; Turbopack disabled for production builds (dev can keep Turbopack via `next dev --turbopack`)
- **Files added**: `app/sw.ts`, `app/manifest.ts`, `public/icons/` (PNG icons)
- **Files modified**: `next.config.ts`, `package.json` (build script)
- **Output**: `public/sw.js` (generated at build time, gitignored)
- **TypeScript**: `tsconfig.json` needs `lib: ["webworker"]` added for the service worker file
