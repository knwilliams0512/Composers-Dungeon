import { withAuth } from "next-auth/middleware";

/**
 * The bare `export { default } from "next-auth/middleware"` looks equivalent
 * and is not. Called that way, withAuth receives Next's NextFetchEvent as its
 * options argument, so it never sees any configuration — including
 * `pages.signIn: "/login"` from authOptions, which lives in a different module
 * and is read by the API route, not by this one. The result was that every
 * signed-out visitor to a protected route landed on next-auth's own generic
 * provider page at /api/auth/signin rather than this app's login screen, and
 * the per-page `redirect("/login")` guards never ran, because the middleware
 * had already answered.
 *
 * authOptions itself cannot be imported here: it pulls in bcryptjs and Prisma,
 * neither of which runs in the edge runtime this middleware executes in. The
 * one thing the middleware needs is the sign-in path, so it is named here, and
 * scripts/check-routes.mjs holds the two copies to the same value.
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

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
