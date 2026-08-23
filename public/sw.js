/*
 * Composer's Dungeon service worker.
 *
 * Deliberately minimal. This app's progression is computed server-side, so
 * caching pages or API responses would be actively harmful (stale XP, stale
 * streaks, replayed server actions). The worker therefore:
 *
 *   - never touches non-GET requests (server actions, auth, mutations)
 *   - never caches HTML documents — navigations always hit the network
 *   - cache-first only for content-hashed build assets and icons
 *   - serves /offline.html when a navigation fails with the server stopped
 *
 * Its real job is making the app installable as a desktop/Start-menu app.
 */

const VERSION = "cd-v1";
const ASSET_CACHE = `${VERSION}-assets`;
const SHELL_CACHE = `${VERSION}-shell`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isHashedAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/manifest.webmanifest")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isHashedAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })()
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match(OFFLINE_URL)) ||
            new Response("The dungeon is dark.", { status: 503 })
          );
        }
      })()
    );
  }
});
