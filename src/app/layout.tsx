import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { OpeningTitles } from "@/components/ui/OpeningTitles";

/*
 * The two typefaces, shipped with the app rather than fetched while it builds.
 *
 * These were `next/font/google`, which downloads the font CSS from
 * fonts.googleapis.com during the build and reads the woff2 URLs out of it.
 * That turns every build into a request to somebody else's service, and on
 * 2026-11-07 it started failing on the GitHub runner that builds the Windows
 * installer: next/font's loader takes the file extension off each URL it finds
 * and reads match[1] without checking, so a response it does not expect comes
 * out as "Cannot read properties of null (reading '1')" and the build stops.
 * It failed twice in a row there while the same request from elsewhere
 * returned ordinary woff2, so the response differs by where you ask from.
 *
 * Either way a release build should not depend on a third-party fetch, so the
 * files are in the repository. Both are the variable fonts Google itself
 * serves — one file each, covering the whole weight range, verified identical
 * to what the range request returns — so this is the same two typefaces at the
 * same weights, with no network involved.
 */
const display = localFont({
  src: "./fonts/cinzel-variable.woff2",
  variable: "--font-display",
  // The axis the file actually carries, as Google's own @font-face declares it.
  weight: "400 900",
  style: "normal",
  display: "swap",
});

const body = localFont({
  src: "./fonts/cormorant-garamond-variable.woff2",
  variable: "--font-body",
  weight: "300 700",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Composer's Dungeon",
    template: "%s — Composer's Dungeon",
  },
  description:
    "Learn music theory in the Academy. Prove it in the Dungeon. An RPG for composers, from first note to virtuoso repertoire.",
  applicationName: "Composer's Dungeon",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      // Windows and the browser tab want an exact small size; without these
      // they downscale a large PNG and the mark turns to mush.
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/composers-dungeon.ico"],
  },
  appleWebApp: {
    capable: true,
    title: "Composer's Dungeon",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0a14",
};

/**
 * `beforeinstallprompt` usually fires before React hydrates. Stash it so the
 * in-app "Install as App" button can offer it whenever the user gets there.
 */
const INSTALL_PROMPT_CAPTURE = `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__cdInstallPrompt=e;window.dispatchEvent(new Event('cd:installable'));});`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_CAPTURE }} />
      </head>
      <body>
        {children}
        <OpeningTitles />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
