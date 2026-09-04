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

// Bumped when a cached asset's bytes change in a way a stale copy would hide.
// v2: the icon set was regenerated — every earlier copy was a cropped fragment
// of the artwork, and the old cache would keep serving it.
const VERSION = "cd-v2";
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

/**
 * Build assets carry a content hash in their filename, so a given URL's bytes
 * can never change: caching them forever is safe and makes launches instant.
 */
function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

/**
 * Icons and the manifest live at fixed URLs, so their bytes CAN change when the
 * app updates itself. Caching those the same way would freeze the app's icon
 * and name on whatever shipped first, with no way for a later release to
 * correct them — the cache key never changes, so nothing would ever evict it.
 */
function isRevalidatedAsset(url) {
  return url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isImmutableAsset(url)) {
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

  // Serve the cached copy at once, then quietly refresh it for next time, so an
  // updated icon costs one launch to appear rather than never appearing.
  if (isRevalidatedAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        const hit = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => null);
        return hit || (await network) || Response.error();
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
