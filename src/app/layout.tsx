import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

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
};

export const viewport: Viewport = {
  themeColor: "#0c0a14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
