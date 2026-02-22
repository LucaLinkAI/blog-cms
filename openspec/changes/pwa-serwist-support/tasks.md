## 1. Dependencies & Build Pipeline

- [x] 1.1 Install `@serwist/next` and `@serwist/sw` via pnpm
- [x] 1.2 Update `package.json` build script from `next build` to `next build --webpack`
- [x] 1.3 Add `public/sw.js` and `public/sw.js.map` to `.gitignore`

## 2. TypeScript Configuration

- [x] 2.1 Create `tsconfig.sw.json` that extends the root `tsconfig.json` and overrides `lib` to `["webworker", "esnext"]` for the service worker compile context

## 3. Service Worker

- [x] 3.1 Create `app/sw.ts` — instantiate `Serwist` with `precacheEntries: self.__SW_MANIFEST`, `skipWaiting: true`, `clientsClaim: true`, `navigationPreload: true`, and `runtimeCaching: defaultCache` from `@serwist/next/worker`; call `serwist.addEventListeners()`
- [x] 3.2 Add the `@serwist/next` type declaration to `app/sw.ts` (`/// <reference lib="webworker" />` and `declare const self: ServiceWorkerGlobalScope`)

## 4. Next.js Config

- [x] 4.1 Update `next.config.ts` — import `withSerwistInit` from `@serwist/next` and wrap the exported config with `withSerwistInit({ swSrc: "app/sw.ts", swDest: "public/sw.js", disable: process.env.NODE_ENV === "development", reloadOnOnline: true })`

## 5. Web App Manifest

- [x] 5.1 Create `app/manifest.ts` — export a `manifest()` function returning a `MetadataRoute.Manifest` with `name` and `short_name` from `NEXT_PUBLIC_SITE_NAME` (fallback `"Blog CMS"`), `start_url: "/"`, `display: "standalone"`, `theme_color`, `background_color`, and icon entries for 192×192 and 512×512
- [x] 5.2 Add 192×192 PNG icon to `public/icons/icon-192x192.png`
- [x] 5.3 Add 512×512 PNG icon to `public/icons/icon-512x512.png`

## 6. Verification

- [x] 6.1 Run `pnpm build` locally and confirm `public/sw.js` is generated without errors
- [ ] 6.2 Serve the production build (`pnpm start`) and open Chrome DevTools → Application → Service Workers — confirm the SW is registered and status is `activated`
- [ ] 6.3 Open DevTools → Application → Manifest — confirm all required fields are present and icons load
- [ ] 6.4 In DevTools → Network, set throttling to "Offline" and navigate to a previously-visited post — confirm the page loads from cache
- [x] 6.5 Confirm `public/sw.js` does not appear in `git status` (gitignored)
