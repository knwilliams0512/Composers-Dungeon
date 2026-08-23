import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

const display = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const body = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
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
      { url: "/icons/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
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
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
