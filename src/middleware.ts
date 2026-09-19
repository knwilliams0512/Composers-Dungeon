export { default } from "next-auth/middleware";

/**
 * Everything inside the app shell requires an authenticated session.
 *
 * This list has to name every route group under src/app/(app). Four of them
 * were missing — workshop, studio, settings and the new trials — and a route
 * left out does not become public, because the layout still checks: it becomes
 * *slower and stranger*. The middleware redirects before anything renders,
 * while the layout only redirects after the shell has started streaming, so a
 * signed-out visit to a listed route goes straight to the sign-in page and an
 * unlisted one sits on "Lighting the torches…" first and then jumps there.
 *
 * scripts/check-routes.mjs fails the build if a route group is added without
 * being added here too.
 */
export const config = {
  matcher: [
    "/hall/:path*",
    "/academy/:path*",
    "/dungeon/:path*",
    "/trials/:path*",
    "/workshop/:path*",
    "/studio/:path*",
    "/bosses/:path*",
    "/library/:path*",
    "/guild/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
