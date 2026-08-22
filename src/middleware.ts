export { default } from "next-auth/middleware";

// Everything inside the app shell requires an authenticated session.
export const config = {
  matcher: [
    "/hall/:path*",
    "/academy/:path*",
    "/dungeon/:path*",
    "/bosses/:path*",
    "/library/:path*",
    "/guild/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
  ],
};
